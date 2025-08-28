// agent-messages.js
// WhatsApp-style chat, inquiries, notifications for agents
// Firestore + Firebase Storage integration

let db, auth, storage, currentUser;
if (typeof firebase !== 'undefined') {
  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();
}

// --- Auth ---
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = '/pages/auth/login.html';
    return;
  }
  currentUser = user;
  loadInquiries();
  loadNotifications();
  loadChats();
});

// --- Inquiries Tab ---
async function loadInquiries() {
  const tbody = document.querySelector('#inquiries tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  try {
    const snap = await db.collection('inquiries').where('agentId', '==', currentUser.uid).orderBy('createdAt', 'desc').get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="6">No inquiries found.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      tbody.innerHTML += `
        <tr>
          <td>${d.fromName || 'Unknown'}</td>
          <td>${d.listingTitle || ''}</td>
          <td>${d.message || ''}</td>
          <td>${d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleDateString() : ''}</td>
          <td><span class="badge bg-${d.status === 'new' ? 'primary' : 'secondary'}">${d.status === 'new' ? 'New' : 'Replied'}</span></td>
          <td>
            <button class="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#replyModal" data-inquiry-id="${doc.id}" data-from="${d.fromName || ''}" data-message="${d.message || ''}"><i class="bi bi-reply"></i> Reply</button>
          </td>
        </tr>
      `;
    });
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6">Failed to load inquiries.</td></tr>';
  }
}

document.addEventListener('click', function(e) {
  if (e.target.closest('[data-bs-target="#replyModal"]')) {
    const btn = e.target.closest('button');
    const inquiryId = btn.getAttribute('data-inquiry-id');
    const from = btn.getAttribute('data-from');
    const msg = btn.getAttribute('data-message');
    document.getElementById('replyModalLabel').textContent = `Reply to ${from}`;
    document.getElementById('replyMessage').value = '';
    document.getElementById('replyModal').setAttribute('data-inquiry-id', inquiryId);
  }
});

document.querySelector('#replyModal form').onsubmit = async function(e) {
  e.preventDefault();
  const inquiryId = document.getElementById('replyModal').getAttribute('data-inquiry-id');
  const reply = document.getElementById('replyMessage').value.trim();
  if (!reply) return;
  await db.collection('inquiries').doc(inquiryId).update({ reply, status: 'replied', repliedAt: new Date() });
  loadInquiries();
  bootstrap.Modal.getInstance(document.getElementById('replyModal')).hide();
};

// --- Notifications Tab ---
async function loadNotifications() {
  const notifTab = document.getElementById('notifications');
  if (!notifTab) return;
  notifTab.innerHTML = '<div class="alert alert-info">Loading...</div>';
  try {
    const snap = await db.collection('notifications').where('agentId', '==', currentUser.uid).orderBy('createdAt', 'desc').limit(20).get();
    if (snap.empty) {
      notifTab.innerHTML = '<div class="alert alert-info">No new notifications.</div>';
      return;
    }
    notifTab.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      notifTab.innerHTML += `<div class="alert alert-${d.type === 'info' ? 'info' : d.type === 'error' ? 'danger' : 'primary'}">${d.message} <span class="text-muted small">${d.createdAt ? new Date(d.createdAt.seconds*1000).toLocaleString() : ''}</span></div>`;
    });
  } catch (e) {
    notifTab.innerHTML = '<div class="alert alert-danger">Failed to load notifications.</div>';
  }
}

// --- Store Chat Tab ---
let currentChatId = null;
let chatUnsub = null;

async function loadChats() {
  const chatList = document.getElementById('chatList');
  if (!chatList) return;
  chatList.innerHTML = '<div class="text-center py-3">Loading...</div>';
  try {
    const snap = await db.collection('chats').where('participants', 'array-contains', currentUser.uid).orderBy('lastMessageAt', 'desc').get();
    if (snap.empty) {
      chatList.innerHTML = '<div class="text-center py-3">No chats yet.</div>';
      return;
    }
    chatList.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const other = (d.participantDetails || []).find(u => u.uid !== currentUser.uid) || {};
      chatList.innerHTML += `
        <a href="#" class="list-group-item list-group-item-action${doc.id === currentChatId ? ' active' : ''}" data-chat-id="${doc.id}">
          <div class="fw-semibold">${other.name || 'Unknown'}</div>
          <div class="text-muted small">${d.listingTitle || ''}</div>
          ${d.unread && d.unread[currentUser.uid] ? `<span class="badge bg-danger ms-2">${d.unread[currentUser.uid]}</span>` : ''}
        </a>
      `;
    });
    // Click handler
    Array.from(chatList.querySelectorAll('a')).forEach(a => {
      a.onclick = function(e) {
        e.preventDefault();
        openChat(this.getAttribute('data-chat-id'));
      };
    });
    // Auto-open first chat
    if (!currentChatId && snap.docs.length > 0) openChat(snap.docs[0].id);
  } catch (e) {
    chatList.innerHTML = '<div class="text-center py-3">Failed to load chats.</div>';
  }
}

// --- Typing Indicator ---
let typingTimeout = null;
const chatInput = document.querySelector('.card-footer input[type=text]');
if (chatInput) {
  chatInput.addEventListener('input', function() {
    if (!currentChatId) return;
    db.collection('chats').doc(currentChatId).collection('typing').doc(currentUser.uid).set({ typing: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      db.collection('chats').doc(currentChatId).collection('typing').doc(currentUser.uid).set({ typing: false });
    }, 2000);
  });
}
function listenTyping(chatId, otherUid) {
  const chatHeader = document.getElementById('chatHeader');
  db.collection('chats').doc(chatId).collection('typing').doc(otherUid).onSnapshot(doc => {
    if (doc.exists && doc.data().typing) {
      if (!chatHeader.querySelector('.typing-indicator')) {
        chatHeader.insertAdjacentHTML('beforeend', '<span class="typing-indicator ms-2 text-success small">Typing...</span>');
      }
    } else {
      const ti = chatHeader.querySelector('.typing-indicator');
      if (ti) ti.remove();
    }
  });
}
// --- Read Receipts ---
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
// --- Emoji Picker ---
import('https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js').then(() => {
  const picker = document.createElement('emoji-picker');
  picker.style.position = 'absolute';
  picker.style.bottom = '60px';
  picker.style.right = '30px';
  picker.style.zIndex = 2000;
  picker.style.display = 'none';
  document.body.appendChild(picker);
  const emojiBtn = document.createElement('button');
  emojiBtn.type = 'button';
  emojiBtn.className = 'btn btn-link p-0 chat-footer-tools';
  emojiBtn.innerHTML = '<i class="bi bi-emoji-smile"></i>';
  chatFooter.insertBefore(emojiBtn, chatFooter.querySelector('input[type=text]'));
  emojiBtn.onclick = () => {
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    const rect = emojiBtn.getBoundingClientRect();
    picker.style.left = rect.left + 'px';
    picker.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
  };
  picker.addEventListener('emoji-click', e => {
    chatInput.value += e.detail.unicode;
    picker.style.display = 'none';
    chatInput.focus();
  });
  document.addEventListener('click', e => {
    if (!picker.contains(e.target) && e.target !== emojiBtn) picker.style.display = 'none';
  });
});
// --- Toast Notifications ---
function showToast(msg, type = 'info') {
  let toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0 position-fixed bottom-0 end-0 m-3`;
  toast.style.zIndex = 3000;
  toast.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  document.body.appendChild(toast);
  new bootstrap.Toast(toast, { delay: 4000 }).show();
  toast.addEventListener('hidden.bs.toast', () => toast.remove());
}
// --- Enhance openChat to use typing/read/notifications ---
async function openChat(chatId) {
  if (chatUnsub) chatUnsub();
  currentChatId = chatId;
  // Highlight selected chat
  Array.from(document.querySelectorAll('#chatList a')).forEach(a => a.classList.remove('active'));
  const activeA = document.querySelector(`#chatList a[data-chat-id='${chatId}']`);
  if (activeA) activeA.classList.add('active');
  // Load chat header
  const chatDoc = await db.collection('chats').doc(chatId).get();
  const d = chatDoc.data();
  const other = (d.participantDetails || []).find(u => u.uid !== currentUser.uid) || {};
  document.getElementById('chatHeader').innerHTML = `
    <img src="${other.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}" class="avatar me-2" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
    <div>
      <div class="fw-semibold">${other.name || 'Unknown'}</div>
      <div class="text-muted small">${d.listingTitle || ''}</div>
    </div>
  `;
  listenTyping(chatId, other.uid);
  // Listen for messages
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.innerHTML = '<div class="text-center py-3">Loading...</div>';
  chatUnsub = db.collection('chats').doc(chatId).collection('messages').orderBy('createdAt').onSnapshot(snap => {
    chatMessages.innerHTML = '';
    let lastReadIdx = -1;
    let idx = 0;
    snap.forEach(doc => {
      const m = doc.data();
      const sent = m.senderId === currentUser.uid;
      let content = '';
      if (m.type === 'text') {
        content = `<div class="bubble ${sent ? 'bg-primary text-white' : 'bg-light'}">${escapeHTML(m.text)}</div>`;
      } else if (m.type === 'image') {
        content = `<div class="bubble ${sent ? 'bg-primary text-white' : 'bg-light'}"><img src="${m.url}" class="chat-img"><div class="img-caption">${escapeHTML(m.caption || '')}</div></div>`;
      } else if (m.type === 'file') {
        content = `<div class="bubble ${sent ? 'bg-primary text-white' : 'bg-light'}"><i class="bi bi-paperclip file-icon"></i><a href="${m.url}" target="_blank" class="file-link">${m.fileName}</a><div class="file-size">${formatFileSize(m.fileSize)}</div></div>`;
      }
      // Read receipt
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
      if (!sent && m.readBy && m.readBy.includes(currentUser.uid)) lastReadIdx = idx;
      idx++;
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
    markMessagesRead(chatId);
    // Toast for new message
    if (snap.docChanges().some(change => change.type === 'added' && change.doc.data().senderId !== currentUser.uid)) {
      showToast('New message received!', 'success');
    }
  });
}

// --- Send Message (text, image, file) ---
const chatFooter = document.querySelector('.card-footer form');
if (chatFooter) {
  chatFooter.onsubmit = async function(e) {
    e.preventDefault();
    const input = chatFooter.querySelector('input[type=text]');
    const text = input.value.trim();
    if (!text && !chatFooter.dataset.uploadUrl) return;
    if (!currentChatId) return;
    // Send text message
    if (text) {
      await db.collection('chats').doc(currentChatId).collection('messages').add({
        type: 'text',
        text,
        senderId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      input.value = '';
    }
    // Send uploaded file/image
    if (chatFooter.dataset.uploadUrl) {
      const { uploadType, uploadUrl, uploadName, uploadSize } = chatFooter.dataset;
      await db.collection('chats').doc(currentChatId).collection('messages').add({
        type: uploadType,
        url: uploadUrl,
        fileName: uploadName,
        fileSize: parseInt(uploadSize),
        senderId: currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      delete chatFooter.dataset.uploadUrl;
      delete chatFooter.dataset.uploadType;
      delete chatFooter.dataset.uploadName;
      delete chatFooter.dataset.uploadSize;
      chatFooter.querySelector('.upload-preview')?.remove();
    }
  };
  // File/image upload
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed,application/octet-stream';
  fileInput.style.display = 'none';
  chatFooter.appendChild(fileInput);
  const attachBtn = document.createElement('label');
  attachBtn.innerHTML = '<i class="bi bi-paperclip"></i>';
  attachBtn.className = 'btn btn-link p-0 chat-footer-tools';
  attachBtn.style.fontSize = '1.3em';
  attachBtn.appendChild(fileInput);
  chatFooter.insertBefore(attachBtn, chatFooter.firstChild);
  attachBtn.onclick = () => fileInput.click();
  fileInput.onchange = async function() {
    if (!fileInput.files.length) return;
    const file = fileInput.files[0];
    const isImage = file.type.startsWith('image/');
    const ref = storage.ref().child(`chat_uploads/${currentUser.uid}/${Date.now()}_${file.name}`);
    const task = ref.put(file);
    // Show preview/progress
    let preview = chatFooter.querySelector('.upload-preview');
    if (!preview) {
      preview = document.createElement('img');
      preview.className = 'upload-preview';
      chatFooter.insertBefore(preview, chatFooter.querySelector('input[type=text]'));
    }
    if (isImage) {
      const reader = new FileReader();
      reader.onload = e => { preview.src = e.target.result; };
      reader.readAsDataURL(file);
    } else {
      preview.src = '/assets/icons/file-icon.png';
    }
    // Progress bar
    let progress = chatFooter.querySelector('.progress');
    if (!progress) {
      progress = document.createElement('div');
      progress.className = 'progress';
      progress.innerHTML = '<div class="progress-bar" style="width:0%"></div>';
      chatFooter.insertBefore(progress, chatFooter.querySelector('input[type=text]'));
    }
    task.on('state_changed', snap => {
      const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
      progress.querySelector('.progress-bar').style.width = pct + '%';
    }, err => {
      alert('Upload failed');
      preview.remove();
      progress.remove();
    }, async () => {
      const url = await ref.getDownloadURL();
      chatFooter.dataset.uploadUrl = url;
      chatFooter.dataset.uploadType = isImage ? 'image' : 'file';
      chatFooter.dataset.uploadName = file.name;
      chatFooter.dataset.uploadSize = file.size;
      progress.remove();
    });
  };
}

// --- Helpers ---
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[tag]));
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  if (bytes < 1024*1024*1024) return (bytes/1024/1024).toFixed(1) + ' MB';
  return (bytes/1024/1024/1024).toFixed(1) + ' GB';
} 