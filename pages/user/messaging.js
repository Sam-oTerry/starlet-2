// messaging.js - Modern Chat UI Functionality for messaging.html
// Assumes Firebase SDK is loaded and initialized globally as firebase

(function() {
  // --- Firebase Setup ---
  let db, auth;
  let presenceRef = null;
  let searchResults = [];
  let isSearchMode = false;
  
  function waitForFirebaseAndInit() {
    // Check if Firebase is loaded and initialized
    if (typeof firebase === 'undefined') {
      console.log('Firebase not loaded yet, retrying...');
      setTimeout(waitForFirebaseAndInit, 100);
      return;
    }
    
    // Check if Firebase is initialized
    if (!firebase.apps || firebase.apps.length === 0) {
      console.log('Firebase not initialized yet, retrying...');
      setTimeout(waitForFirebaseAndInit, 100);
      return;
    }
    
    // Check if DOM is ready
    if (!document.getElementById('conversationsList')) {
      console.log('DOM not ready yet, retrying...');
      setTimeout(waitForFirebaseAndInit, 100);
      return;
    }
    
    try {
      db = firebase.firestore();
      auth = firebase.auth();
      
      if (!auth || typeof auth.onAuthStateChanged !== 'function') {
        console.log('Firebase Auth not ready yet, retrying...');
        setTimeout(waitForFirebaseAndInit, 100);
        return;
      }
      
      console.log('Firebase ready, setting up auth listener...');
      auth.onAuthStateChanged(user => {
        if (!user) {
          window.location.href = '/pages/auth/login.html';
          return;
        }
        window.currentUser = user;
        console.log('User authenticated:', user.uid, user.email);
        setupUserPresence(user);
        loadSidebarConversations();
        setupChatInput();
        setupMessageSearch();
      });
    } catch (error) {
      console.error('Error initializing Firebase services:', error);
      setTimeout(waitForFirebaseAndInit, 100);
    }
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

  // --- Message Search System ---
  function setupMessageSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search messages...';
    searchInput.className = 'form-control mb-3';
    searchInput.id = 'messageSearchInput';
    
    const conversationsHeader = document.querySelector('.conversations-header');
    if (conversationsHeader) {
      conversationsHeader.appendChild(searchInput);
    }
    
    let searchTimeout;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      const query = this.value.trim();
      
      if (query.length === 0) {
        isSearchMode = false;
        loadSidebarConversations(); // Return to normal conversation list
        return;
      }
      
      searchTimeout = setTimeout(() => {
        searchMessages(query);
      }, 300); // Debounce search
    });
  }
  
  async function searchMessages(query) {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) {
      console.log('conversationsList element not found');
      return;
    }
    
    conversationsList.innerHTML = '<div class="text-center py-3">Searching...</div>';
    
    try {
      const results = await db.collection('messages')
        .where('text', '>=', query)
        .where('text', '<=', query + '\uf8ff')
        .orderBy('text')
        .limit(20)
        .get();
      
      if (results.empty) {
        conversationsList.innerHTML = '<div class="text-center py-3 text-muted">No messages found for "' + query + '"</div>';
        return;
      }
      
      conversationsList.innerHTML = '';
      
      results.forEach(doc => {
        const message = doc.data();
        conversationsList.innerHTML += `
          <div class="search-result-item" data-chat-id="${message.chatId}">
            <div class="search-result-preview">
              <strong>${message.senderName || 'Unknown'}</strong>
              <span class="text-muted">${message.text}</span>
            </div>
            <div class="search-result-time">
              ${message.timestamp ? new Date(message.timestamp.seconds*1000).toLocaleDateString() : ''}
            </div>
          </div>
        `;
      });
      
      // Add click handlers to search results
      Array.from(conversationsList.querySelectorAll('.search-result-item')).forEach(item => {
        item.addEventListener('click', () => {
          const chatId = item.getAttribute('data-chat-id');
          if (chatId) {
            openChat(chatId);
            loadSidebarConversations(); // Reload normal conversation list
          }
        });
      });
      
    } catch (error) {
      console.error('Search error:', error);
      conversationsList.innerHTML = '<div class="text-center py-3 text-danger">Search failed</div>';
    }
  }
  
  function displaySearchResults(results, query) {
    const conversationsList = document.getElementById('conversationsList');
    
    if (results.length === 0) {
      conversationsList.innerHTML = `<div class="text-center py-3 text-muted">No messages found for "${query}"</div>`;
      return;
    }
    
    conversationsList.innerHTML = '';
    results.forEach(result => {
      const highlightedText = result.text.replace(
        new RegExp(`(${escapeRegex(query)})`, 'gi'),
        '<mark>$1</mark>'
      );
      
      conversationsList.innerHTML += `
        <div class="search-result-item" data-chat-id="${result.chatId}" tabindex="0">
          <div class="user-avatar"><img src="${result.otherUser.avatar || '/img/avatar-placeholder.svg'}" alt="${result.otherUser.name || 'Unknown'}" /></div>
          <div class="user-info">
            <span class="user-name">${result.otherUser.name || 'Unknown'}</span>
            <span class="user-last">${result.senderName}: ${highlightedText}</span>
          </div>
          <div class="user-meta">
            <span class="user-time">${result.createdAt ? new Date(result.createdAt.seconds*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
          </div>
        </div>
      `;
    });
    
    // Add click handlers for search results
    Array.from(conversationsList.querySelectorAll('.search-result-item')).forEach(item => {
      item.onclick = function() {
        const chatId = this.getAttribute('data-chat-id');
        // Clear search and open chat
        document.getElementById('messageSearchInput').value = '';
        isSearchMode = false;
        openChat(chatId);
        loadSidebarConversations(); // Reload normal conversation list
      };
    });
  }
  
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // --- Sidebar: Load Conversations ---
  function loadSidebarConversations() {
    if (isSearchMode) return; // Don't reload if in search mode
    
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) {
      console.log('conversationsList element not found');
      return;
    }
    conversationsList.innerHTML = '<div class="text-center py-3">Loading...</div>';
    
    console.log('Loading conversations for user:', window.currentUser.uid);
    
    // Test if we can access the database
    db.collection('conversations').limit(1).get().then(testSnap => {
      console.log('Database access test:', testSnap.size, 'documents in conversations collection');
      if (testSnap.size > 0) {
        const sampleDoc = testSnap.docs[0];
        console.log('Sample conversation document:', sampleDoc.data());
      }
    }).catch(err => {
      console.error('Database access error:', err);
    });
    
    db.collection('conversations').where('participants', 'array-contains', window.currentUser.uid).onSnapshot(snap => {
      console.log('Conversations snapshot:', snap.size, 'conversations found');
      if (snap.empty) {
        conversationsList.innerHTML = '<div class="text-center py-3">No conversations yet.</div>';
        return;
      }
      conversationsList.innerHTML = '';
      
      snap.forEach(doc => {
        const d = doc.data();
        const other = (d.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
        const activeClass = doc.id === window.currentChatId ? 'active' : '';
        
        // Create conversation item with placeholder presence
        const conversationItem = document.createElement('div');
        conversationItem.className = `conversation-item ${activeClass}`;
        conversationItem.setAttribute('data-chat-id', doc.id);
        conversationItem.setAttribute('tabindex', '0');
        
        conversationItem.innerHTML = `
          <img src="${other.avatar || '../../img/avatar-placeholder.svg'}" class="conversation-avatar" alt="Avatar">
          <div class="conversation-info">
            <div class="conversation-name">${other.name || 'Unknown'}</div>
            <div class="conversation-preview">${d.lastMessage || 'No messages yet'}</div>
          </div>
          <div class="conversation-meta">
            <div class="conversation-time">${d.lastMessageAt ? new Date(d.lastMessageAt.seconds*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
            <div class="unread-badge" style="display: ${d.unread && d.unread[window.currentUser.uid] ? 'flex' : 'none'}">${d.unread && d.unread[window.currentUser.uid] ? d.unread[window.currentUser.uid] : 0}</div>
          </div>
        `;
        
        conversationsList.appendChild(conversationItem);
        
        // Listen for presence status for this user
        if (other.uid) {
          // Presence will be handled in the chat header when conversation is opened
        }
      });
      
              Array.from(conversationsList.querySelectorAll('.conversation-item')).forEach(a => {
        a.onclick = function(e) {
          e.preventDefault();
          openChat(this.getAttribute('data-chat-id'));
        };
      });
      
      // Auto-open first chat if none selected
      if (!window.currentChatId && snap.docs.length > 0) openChat(snap.docs[0].id);
    }, error => {
      console.error('Error loading conversations:', error);
      conversationsList.innerHTML = '<div class="text-center py-3 text-danger">Error loading conversations. Please try again.</div>';
    });
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
  let chatUnsub = null;
  function openChat(chatId) {
    if (chatUnsub) chatUnsub();
    window.currentChatId = chatId;
    // Highlight selected
    document.querySelectorAll('.conversation-item').forEach(a => a.classList.remove('active'));
    const activeA = document.querySelector(`.conversation-item[data-chat-id='${chatId}']`);
    if (activeA) activeA.classList.add('active');
          // Enable input field
      const messageInput = document.getElementById('messageInput');
      const sendBtn = document.getElementById('sendBtn');
      if (messageInput) messageInput.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      
      // Load header
      db.collection('conversations').doc(chatId).get().then(chatDoc => {
      const d = chatDoc.data();
      const other = (d.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
              const avatarImg = document.querySelector('#chatAvatar');
              if (avatarImg) {
                avatarImg.src = other.avatar || '../../img/avatar-placeholder.svg';
              }
              const nameElement = document.querySelector('#chatUserName');
              if (nameElement) {
                nameElement.textContent = other.name || 'Unknown';
              }
      
      // Set up presence status in chat header
      const headerStatus = document.querySelector('#chatUserStatus span');
      const statusIndicator = document.querySelector('#chatUserStatus .status-indicator');
      if (other.uid && headerStatus) {
        listenToUserPresence(other.uid, headerStatus, statusIndicator);
      } else if (headerStatus) {
        headerStatus.textContent = 'Offline';
        if (statusIndicator) {
          statusIndicator.className = 'status-indicator offline';
        }
      }
      
      listenTyping(chatId, other.uid);
    });
    // Listen for messages
    const chatMessages = document.querySelector('#chatMessages');
          chatMessages.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="bi bi-arrow-clockwise"></i></div><h3>Loading...</h3></div>';
    chatUnsub = db.collection('conversations').doc(chatId).collection('messages').orderBy('createdAt').onSnapshot(snap => {
      chatMessages.innerHTML = '';
      snap.forEach(doc => {
        const m = doc.data();
        const sent = m.senderId === window.currentUser.uid;
        let content = '';
        if (m.type === 'text') {
          content = `<div class="message-bubble">${escapeHTML(m.text)}</div>`;
        } else if (m.type === 'image') {
          content = `<div class="message-bubble"><img src="${m.url}" class="chat-img"><div class="img-caption">${escapeHTML(m.caption || '')}</div></div>`;
        } else if (m.type === 'file') {
          content = `<div class="message-bubble"><i class="bi bi-paperclip file-icon"></i><a href="${m.url}" target="_blank" class="file-link">${m.fileName}</a><div class="file-size">${formatFileSize(m.fileSize)}</div></div>`;
        }
        let readMark = '';
        if (sent && m.readBy && m.readBy.includes(window.currentUser.uid)) {
          readMark = '<span class="ms-1 text-success small"><i class="bi bi-check2-all"></i> Seen</span>';
        }
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sent ? 'sent' : 'received'}`;
        
        const avatar = document.createElement('img');
        avatar.className = 'message-avatar';
        avatar.src = sent ? (window.currentUser?.avatar || '../../img/avatar-placeholder.svg') : (m.senderAvatar || '../../img/avatar-placeholder.svg');
        avatar.alt = 'Avatar';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = content;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = m.createdAt ? new Date(m.createdAt.seconds*1000).toLocaleString() : '';
        
        messageContent.appendChild(bubble);
        messageContent.appendChild(time);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatMessages.appendChild(messageDiv);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
      markMessagesRead(chatId);
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
          createdAt: new Date()
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
