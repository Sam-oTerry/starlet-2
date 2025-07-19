// user-messages.js
// User messaging logic for Starlet Properties
// Restores all previous messaging features with improved UI/UX

// --- Firebase Initialization ---
if (typeof initializeFirebase === 'function') {
  initializeFirebase();
}
const db = window.firebaseDB || (window.firebase && firebase.firestore());
const auth = window.firebaseAuth || (window.firebase && firebase.auth());
const storage = window.firebaseStorage || (window.firebase && firebase.storage && firebase.storage());

let currentUser = null;
let currentChatId = null;
let chatUnsub = null;
let typingTimeout = null;

// --- Auth State ---
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  currentUser = user;
  loadConversations();
});

// --- Load Conversations ---
async function loadConversations() {
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
      const activeClass = doc.id === currentChatId ? 'active' : '';
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
        openChat(this.getAttribute('data-chat-id'));
      };
    });
    // Auto-open first chat
    if (!currentChatId && snap.docs.length > 0) openChat(snap.docs[0].id);
  } catch (e) {
    sidebar.innerHTML = '<div class="text-center py-3">Failed to load conversations.</div>';
  }
}

// --- Open Chat and Load Messages ---
async function openChat(chatId) {
  if (chatUnsub) chatUnsub();
  currentChatId = chatId;
  // Highlight selected chat
  Array.from(document.querySelectorAll('.chat-listing')).forEach(a => a.classList.remove('active'));
  const activeA = document.querySelector(`.chat-listing[data-chat-id='${chatId}']`);
  if (activeA) activeA.classList.add('active');
  // Load chat header
  const chatDoc = await db.collection('chats').doc(chatId).get();
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
  listenTyping(chatId, other.uid);
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
      if (sent && m.readBy && m.readBy.includes(other.uid)) {
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
    markMessagesRead(chatId);
  });
}

// --- Typing Indicator ---
function listenTyping(chatId, otherUid) {
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
function markMessagesRead(chatId) {
  const chatRef = db.collection('chats').doc(chatId).collection('messages');
  chatRef.get().then(snap => {
    snap.forEach(doc => {
      if (!doc.data().readBy || !doc.data().readBy.includes(currentUser.uid)) {
        chatRef.doc(doc.id).update({ readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
      }
    });
  });
}

// --- Send Message ---
const chatInputForm = document.getElementById('chatInputForm');
if (chatInputForm) {
  chatInputForm.onsubmit = async function(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !currentChatId) return;
    await db.collection('chats').doc(currentChatId).collection('messages').add({
      type: 'text',
      text,
      senderId: currentUser.uid,
      createdAt: new Date()
    });
    input.value = '';
  };
  // Typing indicator
  const input = document.getElementById('chatInput');
  input.addEventListener('input', function() {
    if (!currentChatId) return;
    db.collection('chats').doc(currentChatId).collection('typing').doc(currentUser.uid).set({ typing: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      db.collection('chats').doc(currentChatId).collection('typing').doc(currentUser.uid).set({ typing: false });
    }, 2000);
  });
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