// messaging.js - Modern Chat UI Functionality for messaging.html
// Assumes Firebase SDK is loaded and initialized globally as firebase

(function() {
  // --- Firebase Setup ---
  let db, auth;
  function waitForFirebaseAndInit() {
    if (typeof firebase === 'undefined' || !document.getElementById('messaging-main')) {
      setTimeout(waitForFirebaseAndInit, 100);
      return;
    }
    db = firebase.firestore();
    auth = firebase.auth();
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      setTimeout(waitForFirebaseAndInit, 100);
      return;
    }
    auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = '/pages/auth/login.html';
        return;
      }
      window.currentUser = user;
      loadSidebarConversations();
      setupChatInput();
    });
  }

  // --- Sidebar: Load Conversations ---
  function loadSidebarConversations() {
    const sidebar = document.querySelector('.user-list');
    if (!sidebar) return;
    sidebar.innerHTML = '<div class="text-center py-3">Loading...</div>';
    db.collection('chats').where('participants', 'array-contains', window.currentUser.uid).orderBy('lastMessageAt', 'desc').onSnapshot(snap => {
      if (snap.empty) {
        sidebar.innerHTML = '<div class="text-center py-3">No conversations yet.</div>';
        return;
      }
      sidebar.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const other = (d.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
        const activeClass = doc.id === window.currentChatId ? 'active' : '';
        sidebar.innerHTML += `
          <div class="user-item ${activeClass}" data-chat-id="${doc.id}" tabindex="0">
            <div class="user-avatar"><img src="${other.avatar || '../../img/avatar-placeholder.png'}" alt="${other.name || 'Unknown'}" />${d.unread && d.unread[window.currentUser.uid] ? `<span class='user-unread'>${d.unread[window.currentUser.uid]}</span>` : ''}</div>
            <div class="user-info"><span class="user-name">${other.name || 'Unknown'}</span><span class="user-last">${d.lastMessage || ''}</span></div>
            <div class="user-meta"><span class="user-time">${d.lastMessageAt ? new Date(d.lastMessageAt.seconds*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span><span class="user-status online"></span></div>
          </div>
        `;
      });
      Array.from(sidebar.querySelectorAll('.user-item')).forEach(a => {
        a.onclick = function(e) {
          e.preventDefault();
          openChat(this.getAttribute('data-chat-id'));
        };
      });
      // Auto-open first chat if none selected
      if (!window.currentChatId && snap.docs.length > 0) openChat(snap.docs[0].id);
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
    db.collection('chats').doc(chatId).get().then(chatDoc => {
      const d = chatDoc.data();
      const other = (d.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
      document.querySelector('.chat-header-avatar img').src = other.avatar || '../../img/avatar-placeholder.png';
      document.querySelector('.chat-header-name').textContent = other.name || 'Unknown';
      document.querySelector('.chat-header-status').textContent = 'online'; // Placeholder, can be enhanced
      listenTyping(chatId, other.uid);
    });
    // Listen for messages
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML = '<div class="text-center py-3">Loading...</div>';
    chatUnsub = db.collection('chats').doc(chatId).collection('messages').orderBy('createdAt').onSnapshot(snap => {
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
    document.querySelector('.chat-header-info').appendChild(indicator);
    db.collection('chats').doc(chatId).collection('typing').doc(otherUid).onSnapshot(doc => {
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
    const chatRef = db.collection('chats').doc(chatId).collection('messages');
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
        await db.collection('chats').doc(window.currentChatId).collection('messages').add({
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
        db.collection('chats').doc(window.currentChatId).collection('typing').doc(window.currentUser.uid).set({ typing: true });
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          db.collection('chats').doc(window.currentChatId).collection('typing').doc(window.currentUser.uid).set({ typing: false });
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
