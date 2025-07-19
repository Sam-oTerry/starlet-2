// User Messaging Script for Starlet Properties
// Requires: assets/js/firebase-config.js loaded first

let db = window.firebaseDB;
let auth = window.firebaseAuth;
let currentUser = null;
let currentChatId = null;
let chatUnsub = null;

// --- Auth ---
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  currentUser = user;
  loadChats();
});

// --- Load Chats (Sidebar) ---
async function loadChats() {
  const chatSidebarList = document.getElementById('chatSidebarList');
  if (!chatSidebarList) return;
  chatSidebarList.innerHTML = '<div class="text-center py-3">Loading...</div>';
  try {
    const snap = await db.collection('chats')
      .where('participants', 'array-contains', currentUser.uid)
      .orderBy('lastMessageAt', 'desc').get();
    if (snap.empty) {
      chatSidebarList.innerHTML = '<div class="text-center py-3">No conversations yet.</div>';
      return;
    }
    chatSidebarList.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const other = (d.participantDetails || []).find(u => u.uid !== currentUser.uid) || {};
      const lastMsg = d.lastMessage || '';
      const lastTime = d.lastMessageAt ? new Date(d.lastMessageAt.seconds*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
      const unread = d.unread && d.unread[currentUser.uid] ? d.unread[currentUser.uid] : 0;
      const activeClass = doc.id === currentChatId ? ' active' : '';
      chatSidebarList.innerHTML += `
        <div class="chat-listing${activeClass}" tabindex="0" aria-label="Conversation with ${other.name || 'Unknown'}" data-chat-id="${doc.id}">
          <img src="${other.avatar || 'https://via.placeholder.com/40x40/0d6efd/fff?text=U'}" class="avatar me-2" alt="${other.name || 'User'} avatar" width="40" height="40">
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center">
              <span class="chat-listing-title">${other.name || 'Unknown'}</span>
              <span class="chat-listing-time small text-muted">${lastTime}</span>
            </div>
            <div class="chat-listing-agent text-truncate">${lastMsg}</div>
          </div>
          ${unread > 0 ? `<span class="unread-badge">${unread}</span>` : ''}
        </div>
      `;
    });
    // Click handler
    Array.from(chatSidebarList.querySelectorAll('.chat-listing')).forEach(div => {
      div.onclick = function() {
        openChat(this.getAttribute('data-chat-id'));
      };
    });
    // Auto-open first chat
    if (!currentChatId && snap.docs.length > 0) openChat(snap.docs[0].id);
  } catch (e) {
    chatSidebarList.innerHTML = '<div class="text-center py-3">Failed to load conversations.</div>';
  }
}

// --- Open Chat and Load Messages ---
async function openChat(chatId) {
  if (chatUnsub) chatUnsub();
  currentChatId = chatId;
  // Highlight selected chat
  Array.from(document.querySelectorAll('.chat-listing')).forEach(a => a.classList.remove('active'));
  const activeDiv = document.querySelector(`.chat-listing[data-chat-id='${chatId}']`);
  if (activeDiv) activeDiv.classList.add('active');
  // Load chat header
  const chatDoc = await db.collection('chats').doc(chatId).get();
  const d = chatDoc.data();
  const other = (d.participantDetails || []).find(u => u.uid !== currentUser.uid) || {};
  document.getElementById('chatHeader').innerHTML = `
    <button class="back-btn" id="backToSidebar" title="Back to conversations" style="display:none;"><i class="bi bi-arrow-left"></i></button>
    <img src="${other.avatar || 'https://via.placeholder.com/48x48/0d6efd/ffffff?text=U'}" class="avatar">
    <div class="info">
      <h5>${other.name || 'User'}</h5>
      <p>${d.listingTitle || ''}</p>
    </div>
    <div id="typingIndicator" class="typing-indicator" style="display:none;"></div>
  `;
  // Listen for messages
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = '<div class="text-center py-3">Loading...</div>';
  chatUnsub = db.collection('chats').doc(chatId).collection('messages').orderBy('createdAt').onSnapshot(snap => {
    chatMessages.innerHTML = '';
    snap.forEach(doc => {
      const m = doc.data();
      const sent = m.senderId === currentUser.uid;
      chatMessages.innerHTML += `
        <div class="chat-message ${sent ? 'sent' : 'received'}">
          <img src="${sent ? (currentUser.photoURL || 'https://via.placeholder.com/32x32/0d6efd/fff?text=Me') : (other.avatar || 'https://via.placeholder.com/32x32/0d6efd/fff?text=U')}" class="avatar">
          <div class="bubble">
            <span>${m.text || ''}</span>
            <span class="meta">
              <span class="message-time">${m.createdAt ? new Date(m.createdAt.seconds*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
            </span>
          </div>
        </div>
      `;
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
    markMessagesRead(chatId);
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
    input.value = '';
    const msg = {
      text,
      senderId: currentUser.uid,
      createdAt: new Date(),
      readBy: [currentUser.uid]
    };
    await db.collection('chats').doc(currentChatId).collection('messages').add(msg);
    await db.collection('chats').doc(currentChatId).update({
      lastMessage: text,
      lastMessageAt: new Date(),
      [`unread.${currentUser.uid}`]: 0
    });
  };
}

// --- Mark Messages as Read ---
function markMessagesRead(chatId) {
  const chatRef = db.collection('chats').doc(chatId).collection('messages');
  chatRef.where('readBy', 'array-contains', currentUser.uid).get().then(snap => {
    snap.forEach(doc => {
      if (!doc.data().readBy || !doc.data().readBy.includes(currentUser.uid)) {
        chatRef.doc(doc.id).update({ readBy: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
      }
    });
  });
}
// --- Typing Indicator (optional, can be added later) ---
// ... 