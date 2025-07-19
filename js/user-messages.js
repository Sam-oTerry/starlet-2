// user-messages.js
// User messaging logic for Starlet Properties
// Restores all previous messaging features with improved UI/UX

// --- Firebase Initialization ---
function waitForFirebaseAndInit() {
  // Wait for Firebase SDK and DOM
  if (typeof firebase === 'undefined' || !document.getElementById('chatSidebarList')) {
    setTimeout(waitForFirebaseAndInit, 100);
    return;
  }
  // Initialize Firebase if needed
  if (typeof initializeFirebase === 'function') {
    initializeFirebase();
  }
  // Get services
  window.firebaseDB = window.firebaseDB || (window.firebase && firebase.firestore());
  window.firebaseAuth = window.firebaseAuth || (window.firebase && firebase.auth());
  window.firebaseStorage = window.firebaseStorage || (window.firebase && firebase.storage && firebase.storage());
  const db = window.firebaseDB;
  const auth = window.firebaseAuth;
  const storage = window.firebaseStorage;
  if (!auth || typeof auth.onAuthStateChanged !== 'function') {
    setTimeout(waitForFirebaseAndInit, 100);
    return;
  }
  // --- Auth State ---
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = '/pages/auth/login.html';
      return;
    }
    window.currentUser = user;
    loadConversations(db, user);
    setupChatInput(db, user);
    updateAuthButton(user); // Call updateAuthButton here
  });

  // --- Load Conversations ---
  async function loadConversations(db, currentUser) {
    const sidebar = document.getElementById('chatSidebarList');
    if (!sidebar) return;
    sidebar.innerHTML = '<div class="text-center py-3">Loading...</div>';
    try {
      const snap = await db.collection('chats').where('participants', 'array-contains', currentUser.uid).orderBy('lastMessageAt', 'desc').get();
      if (snap.empty) {
        sidebar.innerHTML = '<div class="text-center py-3">No conversations yet.</div>';
        return;
      }
      sidebar.innerHTML = '';
      snap.forEach(doc => {
        const d = doc.data();
        const other = (d.participantDetails || []).find(u => u.uid !== currentUser.uid) || {};
        const activeClass = doc.id === window.currentChatId ? 'active' : '';
        sidebar.innerHTML += `
          <div class="chat-listing ${activeClass}" data-chat-id="${doc.id}" tabindex="0" aria-label="Conversation with ${other.name || 'Unknown'}">
            <img src="${other.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}" class="avatar me-2" alt="${other.name || 'Unknown'} avatar" width="40" height="40">
            <div class="flex-grow-1">
              <div class="d-flex justify-content-between align-items-center">
                <span class="chat-listing-title">${other.name || 'Unknown'}</span>
                <span class="chat-listing-time small text-muted">${d.lastMessageAt ? new Date(d.lastMessageAt.seconds*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
              </div>
              <div class="chat-listing-agent text-truncate">${d.lastMessage || ''}</div>
            </div>
            ${d.unread && d.unread[currentUser.uid] ? `<span class="unread-badge">${d.unread[currentUser.uid]}</span>` : ''}
          </div>
        `;
      });
      // Click handler
      Array.from(sidebar.querySelectorAll('.chat-listing')).forEach(a => {
        a.onclick = function(e) {
          e.preventDefault();
          openChat(db, currentUser, this.getAttribute('data-chat-id'));
        };
      });
      // Auto-open first chat
      if (!window.currentChatId && snap.docs.length > 0) openChat(db, currentUser, snap.docs[0].id);
    } catch (e) {
      sidebar.innerHTML = '<div class="text-center py-3">Failed to load conversations.</div>';
    }
  }

  // --- Open Chat and Load Messages ---
  let chatUnsub = null;
  function openChat(db, currentUser, chatId) {
    if (chatUnsub) chatUnsub();
    window.currentChatId = chatId;
    // Highlight selected chat
    Array.from(document.querySelectorAll('.chat-listing')).forEach(a => a.classList.remove('active'));
    const activeA = document.querySelector(`.chat-listing[data-chat-id='${chatId}']`);
    if (activeA) activeA.classList.add('active');
    // Load chat header
    db.collection('chats').doc(chatId).get().then(chatDoc => {
      const d = chatDoc.data();
      const other = (d.participantDetails || []).find(u => u.uid !== currentUser.uid) || {};
      document.getElementById('chatHeader').innerHTML = `
        <img src="${other.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}" class="avatar">
        <div class="info">
          <h5>${other.name || 'Unknown'}</h5>
          <p>${d.listingTitle || ''}</p>
        </div>
        <div id="typingIndicator" class="typing-indicator" style="display:none;"></div>
      `;
      listenTyping(db, chatId, other.uid);
    });
    // Listen for messages
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '<div class="text-center py-3">Loading...</div>';
    chatUnsub = db.collection('chats').doc(chatId).collection('messages').orderBy('createdAt').onSnapshot(snap => {
      chatMessages.innerHTML = '';
      snap.forEach(doc => {
        const m = doc.data();
        const sent = m.senderId === currentUser.uid;
        let content = '';
        if (m.type === 'text') {
          content = `<div class="bubble">${escapeHTML(m.text)}</div>`;
        } else if (m.type === 'image') {
          content = `<div class="bubble"><img src="${m.url}" class="chat-img"><div class="img-caption">${escapeHTML(m.caption || '')}</div></div>`;
        } else if (m.type === 'file') {
          content = `<div class="bubble"><i class="bi bi-paperclip file-icon"></i><a href="${m.url}" target="_blank" class="file-link">${m.fileName}</a><div class="file-size">${formatFileSize(m.fileSize)}</div></div>`;
        }
        let readMark = '';
        if (sent && m.readBy && m.readBy.includes(currentUser.uid)) {
          readMark = '<span class="ms-1 text-success small"><i class="bi bi-check2-all"></i> Seen</span>';
        }
        chatMessages.innerHTML += `
          <div class="chat-message${sent ? ' sent' : ''} d-flex mb-3">
            <img src="${sent ? (currentUser.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg') : (other.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg')}" class="avatar me-2" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">
            <div>
              ${content}
              <div class="meta small text-muted">${sent ? 'You' : (other.name || 'Unknown')} • ${m.createdAt ? new Date(m.createdAt.seconds*1000).toLocaleString() : ''} ${readMark}</div>
            </div>
          </div>
        `;
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
      markMessagesRead(db, chatId, currentUser);
    });
  }

  // --- Typing Indicator ---
  function listenTyping(db, chatId, otherUid) {
    const chatHeader = document.getElementById('chatHeader');
    db.collection('chats').doc(chatId).collection('typing').doc(otherUid).onSnapshot(doc => {
      if (doc.exists && doc.data().typing) {
        document.getElementById('typingIndicator').style.display = '';
        document.getElementById('typingIndicator').textContent = 'Typing...';
      } else {
        document.getElementById('typingIndicator').style.display = 'none';
      }
    });
  }

  // --- Mark Messages as Read ---
  function markMessagesRead(db, chatId, currentUser) {
    const chatRef = db.collection('chats').doc(chatId).collection('messages');
    chatRef.get().then(snap => {
      snap.forEach(doc => {
        if (!doc.data().readBy || !doc.data().readBy.includes(currentUser.uid)) {
          chatRef.doc(doc.id).update({ readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
        }
      });
    });
  }

  // --- Send Message & Typing ---
  function setupChatInput(db, currentUser) {
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
          senderId: currentUser.uid,
          createdAt: new Date()
        });
        input.value = '';
      };
      // Typing indicator
      const input = document.getElementById('chatInput');
      let typingTimeout = null;
      input.addEventListener('input', function() {
        if (!window.currentChatId) return;
        db.collection('chats').doc(window.currentChatId).collection('typing').doc(currentUser.uid).set({ typing: true });
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          db.collection('chats').doc(window.currentChatId).collection('typing').doc(currentUser.uid).set({ typing: false });
        }, 2000);
      });
    }
  }

  // --- Emoji Picker ---
  import('https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js').then(() => {
    const picker = document.getElementById('emojiPicker');
    const emojiBtn = document.getElementById('emojiBtn');
    const input = document.getElementById('chatInput');
    if (picker && emojiBtn && input) {
      emojiBtn.onclick = () => {
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
      };
      picker.addEventListener('emoji-click', e => {
        input.value += e.detail.unicode;
        picker.style.display = 'none';
        input.focus();
      });
      document.addEventListener('click', e => {
        if (!picker.contains(e.target) && e.target !== emojiBtn) picker.style.display = 'none';
      });
    }
  });

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

  // --- Auth Button Logic (from index.html) ---
  function updateAuthButton(user) {
    var authButton = document.getElementById('authButton');
    if (!authButton) return;
    if (user && !user.isAnonymous) {
      authButton.textContent = 'Logout';
      authButton.classList.remove('btn-outline-primary');
      authButton.classList.add('btn-danger');
      authButton.href = '#';
      authButton.onclick = function(e) {
        e.preventDefault();
        if (window.firebase && firebase.auth) {
          firebase.auth().signOut().then(function() {
            window.location.reload();
          });
        }
      };
    } else {
      authButton.textContent = 'Login / Signup';
      authButton.classList.remove('btn-danger');
      authButton.classList.add('btn-outline-primary');
      var loginHref = authButton.getAttribute('data-login-href') || authButton.getAttribute('href') || '/pages/auth/login.html';
      authButton.href = loginHref;
      authButton.onclick = null;
    }
  }
}

// Wait for DOMContentLoaded before running Firebase logic
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForFirebaseAndInit);
} else {
  waitForFirebaseAndInit();
} 