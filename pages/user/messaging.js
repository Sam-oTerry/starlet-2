// messaging.js - Modern Chat UI Functionality for messaging.html
// Assumes Firebase SDK is loaded and initialized globally as firebase

(function() {
  // --- Firebase Setup ---
  let db, auth;
  let presenceRef = null;
  let searchResults = [];
  let isSearchMode = false;
  
  function waitForFirebaseAndInit() {
    if (!window.firebase || !window.firebase.auth) {
      setTimeout(waitForFirebaseAndInit, 100);
      return;
    }
    
    firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        window.location.href = '/pages/auth/login.html';
        return;
      }
      
      window.currentUser = user;
      window.db = firebase.firestore();
      
      // Initialize UI components
      initNewMessageModal();
      initEventHandlers();
      setupMobileConversationSelection();
      loadSidebarConversations();
      setupChatInput();
      setupUserPresence(user);
    });
  }

  // --- User Presence System ---
  function setupUserPresence(user) {
    presenceRef = window.db.collection('presence').doc(user.uid);
    
    // Set user as online
    presenceRef.set({
      online: true,
      lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      uid: user.uid,
      name: user.displayName || user.email || 'Anonymous',
      avatar: user.photoURL || '/img/avatar-placeholder.svg'
    });
    
    // Set user as offline when they leave
    window.addEventListener('beforeunload', () => {
      presenceRef.update({
        online: false,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // Keep presence alive with periodic updates
    setInterval(() => {
      if (presenceRef) {
        presenceRef.update({
          online: true,
          lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }, 30000); // Update every 30 seconds
  }

  // --- Load Sidebar Conversations ---
  function loadSidebarConversations() {
    const conversationsList = document.getElementById('conversationsList');
    const conversationCount = document.querySelector('.conversation-count');
    if (!conversationsList) return;

    conversationsList.innerHTML = '<div class="loading-state">Loading conversations...</div>';

    // Listen for conversations
    window.db.collection('conversations')
      .where('participants', 'array-contains', window.currentUser.uid)
      .orderBy('lastMessageTime', 'desc')
      .onSnapshot(snap => {
        conversationsList.innerHTML = '';
        
        // Update conversation count
        if (conversationCount) {
          conversationCount.textContent = snap.size;
        }
        
        if (snap.empty) {
          conversationsList.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">
                <i class="bi bi-chat-dots"></i>
              </div>
              <h3>No conversations yet</h3>
              <p>Start a conversation by messaging someone</p>
            </div>
          `;
          return;
        }

        snap.forEach(doc => {
          const conv = doc.data();
          const otherUid = conv.participants.find(uid => uid !== window.currentUser.uid);
          
          // Get other user's info
          window.db.collection('users').doc(otherUid).get().then(userDoc => {
            const userData = userDoc.data();
            const conversationDiv = document.createElement('div');
            conversationDiv.className = 'conversation-item';
            conversationDiv.setAttribute('data-chat-id', doc.id);
            
            // Add mobile-specific attributes
            conversationDiv.setAttribute('role', 'button');
            conversationDiv.setAttribute('tabindex', '0');
            conversationDiv.setAttribute('aria-label', `Chat with ${userData?.displayName || userData?.email || 'User'}`);
            
            conversationDiv.innerHTML = `
              <img src="${userData?.photoURL || '../../img/avatar-placeholder.svg'}" alt="Avatar" class="conversation-avatar">
              <div class="conversation-info">
                <div class="conversation-name">${userData?.displayName || userData?.email || 'Unknown User'}</div>
                <div class="conversation-preview">${conv.lastMessage || 'No messages yet'}</div>
              </div>
              <div class="conversation-meta">
                <div class="conversation-time">${conv.lastMessageTime ? new Date(conv.lastMessageTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
              </div>
            `;
            
            // Add click handler with mobile improvements
            conversationDiv.addEventListener('click', () => openChat(doc.id));
            
            // Add keyboard support for accessibility
            conversationDiv.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openChat(doc.id);
              }
            });
            
            // Add touch feedback for mobile
            conversationDiv.addEventListener('touchstart', function() {
              this.style.transform = 'scale(0.96)';
            });
            
            conversationDiv.addEventListener('touchend', function() {
              this.style.transform = '';
            });
            
            conversationsList.appendChild(conversationDiv);
          });
        });
      });
  }

  // --- Mobile Conversation Selection Improvements ---
  function setupMobileConversationSelection() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;

    // Add smooth scrolling for mobile
    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;

    conversationsList.addEventListener('touchstart', (e) => {
      isScrolling = true;
      startX = e.touches[0].pageX - conversationsList.offsetLeft;
      scrollLeft = conversationsList.scrollLeft;
    });

    conversationsList.addEventListener('touchmove', (e) => {
      if (!isScrolling) return;
      e.preventDefault();
      const x = e.touches[0].pageX - conversationsList.offsetLeft;
      const walk = (x - startX) * 2;
      conversationsList.scrollLeft = scrollLeft - walk;
    });

    conversationsList.addEventListener('touchend', () => {
      isScrolling = false;
    });

    // Add swipe gestures for conversation items
    let startY = 0;
    let currentItem = null;

    conversationsList.addEventListener('touchstart', (e) => {
      const item = e.target.closest('.conversation-item');
      if (item) {
        currentItem = item;
        startY = e.touches[0].clientY;
        item.style.transition = 'none';
      }
    });

    conversationsList.addEventListener('touchmove', (e) => {
      if (currentItem) {
        const deltaY = e.touches[0].clientY - startY;
        if (Math.abs(deltaY) > 10) {
          currentItem.style.transform = `translateY(${deltaY * 0.3}px)`;
        }
      }
    });

    conversationsList.addEventListener('touchend', (e) => {
      if (currentItem) {
        currentItem.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        currentItem.style.transform = '';
        currentItem = null;
      }
    });

    // Add haptic feedback for mobile devices
    function triggerHapticFeedback() {
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }

    // Enhanced click handler with haptic feedback
    conversationsList.addEventListener('click', (e) => {
      const item = e.target.closest('.conversation-item');
      if (item) {
        triggerHapticFeedback();
      }
    });

    // Auto-scroll to active conversation on mobile
    function scrollToActiveConversation() {
      const activeItem = conversationsList.querySelector('.conversation-item.active');
      if (activeItem && window.innerWidth <= 768) {
        const containerWidth = conversationsList.offsetWidth;
        const itemWidth = activeItem.offsetWidth;
        const itemLeft = activeItem.offsetLeft;
        const scrollPosition = itemLeft - (containerWidth / 2) + (itemWidth / 2);
        
        conversationsList.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }

    // Add scroll indicator dots
    function updateScrollIndicator() {
      const container = conversationsList;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const scrollLeft = container.scrollLeft;
      
      // Create or update scroll indicator
      let indicator = container.parentElement.querySelector('.swipe-indicator');
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'swipe-indicator';
        container.parentElement.appendChild(indicator);
      }
      
      // Calculate number of dots needed
      const numDots = Math.ceil(scrollWidth / clientWidth);
      indicator.innerHTML = '';
      
      for (let i = 0; i < numDots; i++) {
        const dot = document.createElement('div');
        dot.className = 'swipe-dot';
        indicator.appendChild(dot);
      }
      
      // Highlight active dot
      const activeDotIndex = Math.round(scrollLeft / clientWidth);
      const dots = indicator.querySelectorAll('.swipe-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeDotIndex);
      });
    }

    // Update scroll indicator on scroll
    conversationsList.addEventListener('scroll', updateScrollIndicator);
    
    // Initial update
    setTimeout(updateScrollIndicator, 100);

    // Call scroll function when chat is opened
    window.scrollToActiveConversation = scrollToActiveConversation;
  }
  
  // --- Listen to User Presence ---
  function listenToUserPresence(userId, statusElement, statusIndicator) {
    if (!userId || !statusElement) return;
    
    window.db.collection('presence').doc(userId).onSnapshot(doc => {
      if (doc.exists) {
        const presence = doc.data();
        const isOnline = presence.online;
        const lastSeen = presence.lastSeen;
        
        if (isOnline) {
          statusElement.textContent = 'Online';
          if (statusIndicator) {
            statusIndicator.className = 'status-indicator';
          }
        } else {
          if (statusIndicator) {
            statusIndicator.className = 'status-indicator offline';
          }
          if (lastSeen) {
            const lastSeenDate = lastSeen.toDate();
            const now = new Date();
            const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
            
            if (diffMinutes < 1) {
              statusElement.textContent = 'Just now';
            } else if (diffMinutes < 60) {
              statusElement.textContent = `${diffMinutes}m ago`;
            } else if (diffMinutes < 1440) {
              statusElement.textContent = `${Math.floor(diffMinutes / 60)}h ago`;
            } else {
              statusElement.textContent = `${Math.floor(diffMinutes / 1440)}d ago`;
            }
          } else {
            statusElement.textContent = 'Offline';
          }
        }
      } else {
        statusElement.textContent = 'Offline';
        if (statusIndicator) {
          statusIndicator.className = 'status-indicator offline';
        }
      }
    });
  }

  // --- Main Chat: Load Messages ---
  // --- Open Chat ---
  function openChat(chatId) {
    if (!chatId) return;
    
    window.currentChatId = chatId;
    
    // Update active state in conversation list
    const conversationsList = document.getElementById('conversationsList');
    if (conversationsList) {
      // Remove active class from all items
      conversationsList.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to selected item
      const selectedItem = conversationsList.querySelector(`[data-chat-id="${chatId}"]`);
      if (selectedItem) {
        selectedItem.classList.add('active');
        
        // Auto-scroll to active conversation on mobile
        if (window.scrollToActiveConversation) {
          setTimeout(() => window.scrollToActiveConversation(), 100);
        }
      }
    }
    
    // Get conversation data
    window.db.collection('conversations').doc(chatId).get().then(doc => {
      if (!doc.exists) return;
      
      const conv = doc.data();
      const otherUid = conv.participants.find(uid => uid !== window.currentUser.uid);
      
      // Update chat header
      window.db.collection('users').doc(otherUid).get().then(userDoc => {
        const userData = userDoc.data();
        const chatUserName = document.getElementById('chatUserName');
        const chatAvatar = document.getElementById('chatAvatar');
        
        if (chatUserName) {
          chatUserName.textContent = userData?.displayName || userData?.email || 'Unknown User';
        }
        
        if (chatAvatar) {
          chatAvatar.src = userData?.photoURL || '../../img/avatar-placeholder.svg';
        }
        
        // Enable input
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        if (messageInput) messageInput.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        
        // Listen for user presence
        if (otherUid) {
          listenToUserPresence(otherUid, document.getElementById('chatUserStatus'), document.querySelector('.status-indicator'));
        }
        
        // Load messages
        loadChatMessages(chatId);
        
        // Setup typing indicator
        listenTyping(chatId, otherUid);
      });
    });
  }

  // --- Typing Indicator ---
  function listenTyping(chatId, otherUid) {
    const chatMessages = document.querySelector('#chatMessages');
    let indicator = document.getElementById('typingIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'typingIndicator';
      indicator.className = 'typing-indicator';
      indicator.style.display = 'none';
      indicator.innerHTML = `
        <span>Typing</span>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      `;
      chatMessages.appendChild(indicator);
    }
    window.db.collection('conversations').doc(chatId).collection('typing').doc(otherUid).onSnapshot(doc => {
      if (doc.exists && doc.data().typing) {
        indicator.style.display = 'flex';
      } else {
        indicator.style.display = 'none';
      }
    });
  }

  // --- Mark Messages as Read ---
  async function markMessagesRead(chatId) {
    if (!chatId || !window.currentUser) return;
    
    try {
      const conversationRef = window.db.collection('conversations').doc(chatId);
      await window.db.runTransaction(async (transaction) => {
        const conversation = await transaction.get(conversationRef);
        if (!conversation.exists) return;
        
        const unreadCount = {
          ...conversation.data().unreadCount,
          [window.currentUser.uid]: 0
        };
        
        transaction.update(conversationRef, { unreadCount });
      });
      
      // Update UI to show messages as read
      document.querySelectorAll(`.conversation-item[data-conversation-id="${chatId}"]`)
        .forEach(el => el.classList.remove('unread'));
        
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // --- Send Message & Typing ---
  function setupChatInput() {
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.onclick = async function(e) {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text || !window.currentChatId) return;
        await window.db.collection('conversations').doc(window.currentChatId).collection('messages').add({
          type: 'text',
          text,
          senderId: window.currentUser.uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
      };
      // Typing indicator
      const input = document.getElementById('messageInput');
      let typingTimeout = null;
      input.addEventListener('input', function() {
        if (!window.currentChatId) return;
        window.db.collection('conversations').doc(window.currentChatId).collection('typing').doc(window.currentUser.uid).set({ typing: true });
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          window.db.collection('conversations').doc(window.currentChatId).collection('typing').doc(window.currentUser.uid).set({ typing: false });
        }, 2000);
      });
    }
  }

  // --- Load Chat Messages ---
  let chatUnsub = null;
  
  function loadChatMessages(chatId) {
    if (chatUnsub) chatUnsub();
    
    const chatMessages = document.querySelector('#chatMessages');
    chatMessages.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="bi bi-arrow-clockwise"></i></div><h3>Loading...</h3></div>';
    
    chatUnsub = window.db.collection('conversations').doc(chatId).collection('messages').orderBy('createdAt').onSnapshot(snap => {
      chatMessages.innerHTML = '';
      
      if (snap.empty) {
        chatMessages.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="bi bi-chat-dots"></i>
            </div>
            <h3>No messages yet</h3>
            <p>Start the conversation by sending a message</p>
          </div>
        `;
        return;
      }
      
      snap.forEach(doc => {
        const m = doc.data();
        const sent = m.senderId === window.currentUser.uid;
        
        // Create message container
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sent ? 'sent' : 'received'}`;
        
        // Create avatar
        const avatar = document.createElement('img');
        avatar.className = 'avatar';
        avatar.src = sent ? (window.currentUser?.photoURL || '../../img/avatar-placeholder.svg') : (m.senderAvatar || '../../img/avatar-placeholder.svg');
        avatar.alt = 'Avatar';
        
        // Create bubble container
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        // Add content based on message type
        if (m.type === 'text') {
          bubble.textContent = m.text;
        } else if (m.type === 'image') {
          bubble.innerHTML = `
            <div class="media-content">
              <img src="${m.url}" alt="Image" style="max-width: 100%; border-radius: 8px;">
              ${m.caption ? `<div class="img-caption">${escapeHTML(m.caption)}</div>` : ''}
            </div>
          `;
        } else if (m.type === 'file') {
          bubble.innerHTML = `
            <div class="media-content">
              <i class="bi bi-paperclip"></i>
              <a href="${m.url}" target="_blank" class="file-link">${m.fileName}</a>
              <div class="file-size">${formatFileSize(m.fileSize)}</div>
            </div>
          `;
        }
        
        // Create meta information (time and read status)
        const meta = document.createElement('div');
        meta.className = 'meta';
        
        // Format timestamp in a more readable way
        let time = '';
        if (m.createdAt) {
          let date;
          // Handle both Firestore timestamps and regular Date objects
          if (m.createdAt.seconds) {
            // Firestore timestamp
            date = new Date(m.createdAt.seconds * 1000);
          } else if (m.createdAt.toDate) {
            // Firestore timestamp with toDate method
            date = m.createdAt.toDate();
          } else {
            // Regular Date object
            date = new Date(m.createdAt);
          }
          
          const now = new Date();
          const diffInHours = (now - date) / (1000 * 60 * 60);
          
          if (diffInHours < 24) {
            // Today - show time only
            time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (diffInHours < 48) {
            // Yesterday
            time = 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            // Older - show date and time
            time = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        }
        
        let readStatus = '';
        if (sent && m.readBy && m.readBy.includes(window.currentUser.uid)) {
          readStatus = ' <i class="bi bi-check2-all"></i>';
        } else if (sent) {
          readStatus = ' <i class="bi bi-check2"></i>';
        }
        
        meta.innerHTML = `${time}${readStatus}`;
        
        // Debug: log the timestamp to console
        console.log('Message timestamp:', time, 'for message:', m.text);
        console.log('Raw createdAt:', m.createdAt);
        console.log('Message object:', m);
        
        // Create message content container for proper layout
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Assemble the message - timestamp below bubble like WhatsApp
        messageContent.appendChild(bubble);
        messageContent.appendChild(meta);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatMessages.appendChild(messageDiv);
      });
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      markMessagesRead(chatId);
    });
  }

  // --- Helpers ---
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[tag]));
  }
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
  }

  // --- New Message Button ---
  const newMessageBtn = document.getElementById('new-message-btn');
  newMessageBtn.addEventListener('click', () => {
    // Logic to open a new message compose UI or modal
    openNewMessageModal();
  });

  // --- Delete Chat Button ---
  const deleteChatBtn = document.getElementById('delete-chat-btn');
  deleteChatBtn.addEventListener('click', () => {
    if (window.currentChatId) {
      if (confirm('Are you sure you want to delete this conversation?')) {
        deleteConversation(window.currentChatId).then(() => {
          alert('Conversation deleted');
          // Refresh conversation list and clear chat panel
          loadSidebarConversations();
          clearChatPanel();
        }).catch(err => {
          console.error('Error deleting conversation:', err);
          alert('Failed to delete conversation');
        });
      }
    }
  });

  // --- Mark as Read Button ---
  const markReadBtn = document.getElementById('mark-read-btn');
  markReadBtn.addEventListener('click', () => {
    if (window.currentChatId) {
      markMessagesRead(window.currentChatId);
    }
  });

  // --- Search Button ---
  const messageSearchBtn = document.getElementById('message-search-btn');
  messageSearchBtn.addEventListener('click', () => {
    const query = document.getElementById('message-search-input').value.trim();
    if (query.length > 0) {
      searchMessages(query);
    } else {
      // If search is empty, reload conversations normally
      loadSidebarConversations();
    }
  });

  // --- Search Input Enter Key ---
  const messageSearchInput = document.getElementById('message-search-input');
  messageSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      messageSearchBtn.click();
    }
  });

  // --- Send Message Button ---
  const chatMessageForm = document.getElementById('chat-message-form');
  chatMessageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const messageInput = document.getElementById('chat-message-input');
    const messageText = messageInput.value.trim();
    if (messageText.length > 0 && window.currentChatId) {
      sendMessage(window.currentChatId, messageText).then(() => {
        messageInput.value = '';
      }).catch(err => {
        console.error('Error sending message:', err);
        alert('Failed to send message');
      });
    }
  });

  // --- Helper Functions ---
  function clearChatPanel() {
    document.getElementById('chat-username').textContent = 'Select a conversation';
    document.getElementById('chat-avatar').src = '/img/avatar-placeholder.svg';
    document.getElementById('chat-messages').innerHTML = '';
    window.currentChatId = null;
  }

  function openNewMessageModal() {
    alert('Open new message compose UI - to be implemented');
  }

  function deleteConversation(chatId) {
    return window.db.collection('conversations').doc(chatId).delete();
  }

  async function searchMessages(query) {
    if (!query || !window.currentUser) return;
    
    const searchResultsContainer = document.getElementById('search-results');
    searchResultsContainer.innerHTML = '<div class="text-center py-3"><div class="spinner-border" role="status"></div></div>';
    
    try {
      // Search in messages
      const messagesSnapshot = await window.db.collectionGroup('messages')
        .where('text', '>=', query)
        .where('text', '<=', query + '\uf8ff')
        .where('participants', 'array-contains', window.currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(20)
        .get();
      
      if (messagesSnapshot.empty) {
        searchResultsContainer.innerHTML = '<div class="text-center py-3">No results found</div>';
        return;
      }
      
      // Group messages by conversation
      const resultsByConversation = {};
      const conversationPromises = [];
      
      messagesSnapshot.forEach(doc => {
        const message = doc.data();
        const conversationId = doc.ref.parent.parent.id;
        
        if (!resultsByConversation[conversationId]) {
          resultsByConversation[conversationId] = [];
          // Get conversation data
          conversationPromises.push(
            window.db.collection('conversations').doc(conversationId).get()
              .then(conversationDoc => {
                if (conversationDoc.exists) {
                  resultsByConversation[conversationId].conversation = 
                    { id: conversationId, ...conversationDoc.data() };
                }
              })
          );
        }
        
        resultsByConversation[conversationId].push({
          id: doc.id,
          ...message
        });
      });
      
      // Wait for all conversation data to load
      await Promise.all(conversationPromises);
      
      // Render search results
      let searchResultsHtml = '';
      
      for (const [conversationId, data] of Object.entries(resultsByConversation)) {
        const { conversation, ...messages } = data;
        const otherUser = conversation.participants.find(id => id !== window.currentUser.uid);
        
        searchResultsHtml += `
          <div class="search-result-conversation mb-4">
            <div class="conversation-header d-flex justify-content-between align-items-center mb-2">
              <h6>Conversation about: ${conversation.productTitle || 'Product'}</h6>
              <button class="btn btn-sm btn-outline-primary view-conversation" 
                      data-conversation-id="${conversationId}">
                View Conversation
              </button>
            </div>
            <div class="search-messages">
        `;
        
        // Sort messages by timestamp
        const sortedMessages = Object.values(messages).sort((a, b) => 
          a.timestamp?.toDate() - b.timestamp?.toDate()
        );
        
        sortedMessages.forEach(msg => {
          const isCurrentUser = msg.senderId === window.currentUser.uid;
          searchResultsHtml += `
            <div class="search-message ${isCurrentUser ? 'sent' : 'received'} mb-2 p-2">
              <div class="message-sender small text-muted">
                ${isCurrentUser ? 'You' : (conversation.otherUserName || 'User')} • 
                ${msg.timestamp?.toDate().toLocaleString()}
              </div>
              <div class="message-text">${msg.text}</div>
            </div>
          `;
        });
        
        searchResultsHtml += '</div></div>';
      }
      
      searchResultsContainer.innerHTML = searchResultsHtml || '<div class="text-center py-3">No results found</div>';
      
      // Add event listeners to view conversation buttons
      document.querySelectorAll('.view-conversation').forEach(button => {
        button.addEventListener('click', (e) => {
          const conversationId = e.target.dataset.conversationId;
          if (conversationId) {
            // Close search and open the conversation
            document.getElementById('search-results').innerHTML = '';
            document.getElementById('message-search-input').value = '';
            openChat(conversationId);
          }
        });
      });
      
    } catch (error) {
      console.error('Error searching messages:', error);
      searchResultsContainer.innerHTML = `
        <div class="alert alert-danger">
          Error searching messages. Please try again.
        </div>
      `;
    }
  }

  // Update the search input handler
  function setupSearchHandlers() {
    const searchInput = document.getElementById('message-search-input');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length < 2) {
        document.getElementById('search-results').innerHTML = '';
        return;
      }
      
      searchTimeout = setTimeout(() => {
        searchMessages(query);
      }, 500);
    });
    
    // Clear search when clicking the clear button (X) in the search input
    searchInput.addEventListener('search', () => {
      if (!searchInput.value) {
        document.getElementById('search-results').innerHTML = '';
        loadSidebarConversations();
      }
    });
  }

  // Initialize all event handlers
  function initEventHandlers() {
    setupSearchHandlers();
    setupMessageStatusAndActions();
    
    // Initialize any other event handlers here
    document.addEventListener('click', (e) => {
      // Handle conversation item clicks
      const conversationItem = e.target.closest('.conversation-item');
      if (conversationItem) {
        const conversationId = conversationItem.dataset.conversationId;
        if (conversationId) {
          openChat(conversationId);
        }
      }
    });
  }

  // Update waitForFirebaseAndInit to include new initializations
  function waitForFirebaseAndInit() {
    if (!window.firebase || !window.firebase.auth) {
      setTimeout(waitForFirebaseAndInit, 100);
      return;
    }
    
    firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        window.location.href = '/pages/auth/login.html';
        return;
      }
      
      window.currentUser = user;
      window.db = firebase.firestore();
      
      // Initialize UI components
      initNewMessageModal();
      initEventHandlers();
      setupMobileConversationSelection();
      loadSidebarConversations();
      setupChatInput();
      setupUserPresence(user);
    });
  }

  // --- New Message Modal Functionality ---
  let newMessageModal = null;

  // Initialize the new message modal when DOM is loaded
  function initNewMessageModal() {
    newMessageModal = new bootstrap.Modal(document.getElementById('newMessageModal'));
    
    // Load user's products into the dropdown
    loadUserProducts();
    
    // Handle new message form submission
    document.getElementById('new-message-form').addEventListener('submit', handleNewMessageSubmit);
  }

  // Load user's products into the product select dropdown
  async function loadUserProducts() {
    const productSelect = document.getElementById('product-select');
    try {
      // Clear existing options except the first one
      while (productSelect.options.length > 1) {
        productSelect.remove(1);
      }
      
      // Fetch user's products from Firestore
      const productsSnapshot = await window.db.collection('products')
        .where('sellerId', '==', window.currentUser.uid)
        .limit(20)
        .get();
      
      // Add products to dropdown
      productsSnapshot.forEach(doc => {
        const product = doc.data();
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = product.title;
        productSelect.appendChild(option);
      });
      
    } catch (error) {
      console.error('Error loading products:', error);
      // Optionally show error to user
    }
  }

  // Handle new message form submission
  async function handleNewMessageSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('product-select').value;
    const recipientEmail = document.getElementById('recipient-email').value.trim();
    const messageText = document.getElementById('message-text').value.trim();
    
    if (!productId || !recipientEmail || !messageText) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      // Get recipient user by email
      const userSnapshot = await window.db.collection('users')
        .where('email', '==', recipientEmail)
        .limit(1)
        .get();
      
      if (userSnapshot.empty) {
        alert('No user found with that email');
        return;
      }
      
      const recipientId = userSnapshot.docs[0].id;
      const productRef = window.db.collection('products').doc(productId);
      
      // Create a new conversation or get existing one
      const conversation = await findOrCreateConversation(recipientId, productId);
      
      // Add the message to the conversation
      await window.db.collection('conversations')
        .doc(conversation.id)
        .collection('messages')
        .add({
          text: messageText,
          senderId: window.currentUser.uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          productId: productId
        });
      
      // Close modal and reset form
      newMessageModal.hide();
      e.target.reset();
      
      // Open the new conversation
      openChat(conversation.id);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  }

  // Find or create a conversation between users about a product
  async function findOrCreateConversation(recipientId, productId) {
    // Check if conversation already exists
    const existingConvo = await window.db.collection('conversations')
      .where('participants', 'array-contains', window.currentUser.uid)
      .where('productId', '==', productId)
      .limit(1)
      .get();
    
    if (!existingConvo.empty) {
      return { id: existingConvo.docs[0].id, ...existingConvo.docs[0].data() };
    }
    
    // Create new conversation
    const newConvo = {
      participants: [window.currentUser.uid, recipientId],
      productId: productId,
      lastMessage: '',
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      unreadCount: { [window.currentUser.uid]: 0, [recipientId]: 1 },
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await window.db.collection('conversations').add(newConvo);
    return { id: docRef.id, ...newConvo };
  }

  // Update the openNewMessageModal function
  function openNewMessageModal() {
    // If there's a product context (e.g., from a product page), pre-select it
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');
    
    if (productId) {
      // If we have a product ID in the URL, try to pre-select it
      const productSelect = document.getElementById('product-select');
      for (let i = 0; i < productSelect.options.length; i++) {
        if (productSelect.options[i].value === productId) {
          productSelect.selectedIndex = i;
          break;
        }
      }
    }
    
    newMessageModal.show();
  }

  // Update the loadSidebarConversations to include product info
  async function loadSidebarConversations() {
    // Existing code...
    
    // In the conversation list item creation, include product info if available
    conversationsList.innerHTML = conversations.docs.map(doc => {
      const data = doc.data();
      const otherUser = data.participants.find(id => id !== currentUser.uid);
      const isUnread = (data.unreadCount?.[currentUser.uid] || 0) > 0;
      
      // Include product info in the conversation item
      const productInfo = data.productId ? 
        `<small class="text-muted d-block">${data.productTitle || 'Product'}</small>` : '';
      
      return `
        <div class="list-group-item list-group-item-action conversation-item ${isUnread ? 'unread' : ''}" 
             data-conversation-id="${doc.id}" 
             data-other-user="${otherUser}">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${data.otherUserName || 'User'}</h6>
            <small>${formatTimeAgo(data.lastMessageTime?.toDate())}</small>
          </div>
          <p class="mb-1 text-truncate">${data.lastMessage || 'No messages yet'}</p>
          ${productInfo}
        </div>
      `;
    }).join('');
    
    // Rest of the function...
  }

  // --- Init ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForFirebaseAndInit);
  } else {
    waitForFirebaseAndInit();
  }
})();
