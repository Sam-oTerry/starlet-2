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
    if (!document.getElementById('chatSidebar')) {
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
    
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
      sidebarHeader.appendChild(searchInput);
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
    if (!window.currentUser || query.length < 2) return;
    
    isSearchMode = true;
    const sidebar = document.querySelector('.user-list');
    sidebar.innerHTML = '<div class="text-center py-3">Searching...</div>';
    
    try {
      // Search in all chats the user participates in
      const chatsSnap = await db.collection('conversations')
        .where('participants', 'array-contains', window.currentUser.uid)
        .get();
      
      const searchResults = [];
      
      for (const chatDoc of chatsSnap.docs) {
        const chatData = chatDoc.data();
        
        // Search messages in this chat
        const messagesSnap = await db.collection('conversations')
          .doc(chatDoc.id)
          .collection('messages')
          .where('type', '==', 'text')
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
        
        messagesSnap.forEach(msgDoc => {
          const msgData = msgDoc.data();
          if (msgData.text && msgData.text.toLowerCase().includes(query.toLowerCase())) {
            const other = (chatData.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
            searchResults.push({
              chatId: chatDoc.id,
              messageId: msgDoc.id,
              text: msgData.text,
              createdAt: msgData.createdAt,
              senderName: msgData.senderId === window.currentUser.uid ? 'You' : (other.name || 'Unknown'),
              otherUser: other
            });
          }
        });
      }
      
      displaySearchResults(searchResults, query);
    } catch (error) {
      console.error('Search error:', error);
      sidebar.innerHTML = '<div class="text-center py-3 text-danger">Search failed</div>';
    }
  }
  
  function displaySearchResults(results, query) {
    const sidebar = document.querySelector('.user-list');
    
    if (results.length === 0) {
      sidebar.innerHTML = `<div class="text-center py-3 text-muted">No messages found for "${query}"</div>`;
      return;
    }
    
    sidebar.innerHTML = '';
    results.forEach(result => {
      const highlightedText = result.text.replace(
        new RegExp(`(${escapeRegex(query)})`, 'gi'),
        '<mark>$1</mark>'
      );
      
      sidebar.innerHTML += `
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
    Array.from(sidebar.querySelectorAll('.search-result-item')).forEach(item => {
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
    
    const sidebar = document.getElementById('chatSidebarList');
    if (!sidebar) {
      console.log('chatSidebarList element not found');
      return;
    }
    sidebar.innerHTML = '<div class="text-center py-3">Loading...</div>';
    
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
        sidebar.innerHTML = '<div class="text-center py-3">No conversations yet.</div>';
        return;
      }
      sidebar.innerHTML = '';
      
      snap.forEach(doc => {
        const d = doc.data();
        const other = (d.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
        const activeClass = doc.id === window.currentChatId ? 'active' : '';
        
        // Create conversation item with placeholder presence
        const conversationItem = document.createElement('div');
        conversationItem.className = `chat-listing ${activeClass}`;
        conversationItem.setAttribute('data-chat-id', doc.id);
        conversationItem.setAttribute('tabindex', '0');
        
        conversationItem.innerHTML = `
          <div class="user-avatar">
            <img src="${other.avatar || '/img/avatar-placeholder.svg'}" alt="${other.name || 'Unknown'}" />
            ${d.unread && d.unread[window.currentUser.uid] ? `<span class='user-unread'>${d.unread[window.currentUser.uid]}</span>` : ''}
          </div>
          <div class="user-info">
            <span class="user-name">${other.name || 'Unknown'}</span>
            <span class="user-last">${d.lastMessage || ''}</span>
          </div>
          <div class="user-meta">
            <span class="user-time">${d.lastMessageAt ? new Date(d.lastMessageAt.seconds*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
            <span class="user-status" data-user-id="${other.uid}">offline</span>
          </div>
        `;
        
        sidebar.appendChild(conversationItem);
        
        // Listen for presence status for this user
        if (other.uid) {
          listenToUserPresence(other.uid, conversationItem.querySelector('.user-status'));
        }
      });
      
      Array.from(sidebar.querySelectorAll('.chat-listing')).forEach(a => {
        a.onclick = function(e) {
          e.preventDefault();
          openChat(this.getAttribute('data-chat-id'));
        };
      });
      
      // Auto-open first chat if none selected
      if (!window.currentChatId && snap.docs.length > 0) openChat(snap.docs[0].id);
    }, error => {
      console.error('Error loading conversations:', error);
      sidebar.innerHTML = '<div class="text-center py-3 text-danger">Error loading conversations. Please try again.</div>';
    });
  }
  
  // --- Listen to User Presence ---
  function listenToUserPresence(userId, statusElement) {
    if (!userId || !statusElement) return;
    
    db.collection('presence').doc(userId).onSnapshot(doc => {
      if (doc.exists) {
        const presence = doc.data();
        const isOnline = presence.online;
        const lastSeen = presence.lastSeen;
        
        if (isOnline) {
          statusElement.textContent = 'online';
          statusElement.className = 'user-status online';
        } else {
          statusElement.className = 'user-status offline';
          if (lastSeen) {
            const lastSeenDate = lastSeen.toDate();
            const now = new Date();
            const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
            
            if (diffMinutes < 1) {
              statusElement.textContent = 'just now';
            } else if (diffMinutes < 60) {
              statusElement.textContent = `${diffMinutes}m ago`;
            } else if (diffMinutes < 1440) {
              statusElement.textContent = `${Math.floor(diffMinutes / 60)}h ago`;
            } else {
              statusElement.textContent = `${Math.floor(diffMinutes / 1440)}d ago`;
            }
          } else {
            statusElement.textContent = 'offline';
          }
        }
      } else {
        statusElement.textContent = 'offline';
        statusElement.className = 'user-status offline';
      }
    });
  }

  // --- Main Chat: Load Messages ---
  let chatUnsub = null;
  function openChat(chatId) {
    if (chatUnsub) chatUnsub();
    window.currentChatId = chatId;
    // Highlight selected
    document.querySelectorAll('.user-item').forEach(a => a.classList.remove('active'));
    const activeA = document.querySelector(`.user-item[data-chat-id='${chatId}']`);
    if (activeA) activeA.classList.add('active');
    // Load header
    db.collection('conversations').doc(chatId).get().then(chatDoc => {
      const d = chatDoc.data();
      const other = (d.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
      
      // Safely update header elements with null checks
      const headerAvatar = document.querySelector('.chat-header-avatar img');
      const headerName = document.querySelector('.chat-header-name');
      
      if (headerAvatar) {
        headerAvatar.src = other.avatar || '/img/avatar-placeholder.svg';
      }
      
      if (headerName) {
        headerName.textContent = other.name || 'Unknown';
      }
      
      // Set up presence status in chat header
      const headerStatus = document.querySelector('.chat-header-status');
      if (headerStatus) {
        if (other.uid) {
          listenToUserPresence(other.uid, headerStatus);
        } else {
          headerStatus.textContent = 'offline';
          headerStatus.className = 'chat-header-status offline';
        }
      }
      
      listenTyping(chatId, other.uid);
    });
    // Listen for messages
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML = '<div class="text-center py-3">Loading...</div>';
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
        chatMessages.innerHTML += `
          <div class="message-row ${sent ? 'right' : 'left'}">
            <div class="message-bubble">${content}</div>
            <div class="meta small text-muted">${sent ? 'You' : 'Them'} • ${m.createdAt ? new Date(m.createdAt.seconds*1000).toLocaleString() : ''} ${readMark}</div>
          </div>
        `;
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
      markMessagesRead(chatId);
    });
  }

  // --- Typing Indicator ---
  function listenTyping(chatId, otherUid) {
    const indicator = document.getElementById('typingIndicator') || document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'typing-indicator';
    indicator.style.display = 'none';
    
    const headerInfo = document.querySelector('.chat-header-info');
    if (headerInfo) {
      headerInfo.appendChild(indicator);
    }
    db.collection('conversations').doc(chatId).collection('typing').doc(otherUid).onSnapshot(doc => {
      if (doc.exists && doc.data().typing) {
        indicator.style.display = '';
        indicator.textContent = 'Typing...';
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
    const chatInputForm = document.getElementById('chatInputForm');
    if (chatInputForm) {
      chatInputForm.onsubmit = async function(e) {
        e.preventDefault();
        const input = document.getElementById('chatInput');
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
      const input = document.getElementById('chatInput');
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
