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
      
      // Initialize mobile conversation selection
      setupMobileConversationSelection();
      
      // Load conversations
      loadSidebarConversations();
      
      // Setup chat input
      setupChatInput();
      
      // Setup user presence
      setupUserPresence(user);
    });
  }

  // --- User Presence System ---
  function setupUserPresence(user) {
    presenceRef = db.collection('presence').doc(user.uid);
    
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
    db.collection('conversations')
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
          db.collection('users').doc(otherUid).get().then(userDoc => {
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
    
    db.collection('presence').doc(userId).onSnapshot(doc => {
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
    db.collection('conversations').doc(chatId).get().then(doc => {
      if (!doc.exists) return;
      
      const conv = doc.data();
      const otherUid = conv.participants.find(uid => uid !== window.currentUser.uid);
      
      // Update chat header
      db.collection('users').doc(otherUid).get().then(userDoc => {
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
    db.collection('conversations').doc(chatId).collection('typing').doc(otherUid).onSnapshot(doc => {
      if (doc.exists && doc.data().typing) {
        indicator.style.display = 'flex';
      } else {
        indicator.style.display = 'none';
      }
    });
  }

  // --- Mark Messages as Read ---
  function markMessagesRead(chatId) {
    const chatRef = db.collection('conversations').doc(chatId).collection('messages');
    chatRef.get().then(snap => {
      snap.forEach(doc => {
        if (!doc.data().readBy || !doc.data().readBy.includes(window.currentUser.uid)) {
          chatRef.doc(doc.id).update({ readBy: firebase.firestore.FieldValue.arrayUnion(window.currentUser.uid) });
        }
      });
    });
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
        await db.collection('conversations').doc(window.currentChatId).collection('messages').add({
          type: 'text',
          text,
          senderId: window.currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
      };
      // Typing indicator
      const input = document.getElementById('messageInput');
      let typingTimeout = null;
      input.addEventListener('input', function() {
        if (!window.currentChatId) return;
        db.collection('conversations').doc(window.currentChatId).collection('typing').doc(window.currentUser.uid).set({ typing: true });
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          db.collection('conversations').doc(window.currentChatId).collection('typing').doc(window.currentUser.uid).set({ typing: false });
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
    
    chatUnsub = db.collection('conversations').doc(chatId).collection('messages').orderBy('createdAt').onSnapshot(snap => {
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

  // --- Init ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForFirebaseAndInit);
  } else {
    waitForFirebaseAndInit();
  }
})();
