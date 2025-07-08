// agent-messages.js
// Dynamic logic for Agent Messages page (inquiries, notifications, chat)

// --- Firebase Auth & Firestore Setup ---
let db, auth, currentUser;
if (typeof firebase !== 'undefined') {
  db = firebase.firestore();
  auth = firebase.auth();
}

// --- Authentication Check ---
function enforceAgentAuth() {
  if (!auth) return;
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = '../auth/login.html';
      return;
    }
    currentUser = {
      id: user.uid,
      name: user.displayName || user.email || 'Agent',
      avatar: user.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg',
      email: user.email
    };
    // After auth, load all data
    loadInquiries();
    loadNotifications();
    loadChatContacts();
  });
}

document.addEventListener('DOMContentLoaded', enforceAgentAuth);

// --- Inquiries Tab ---
async function loadInquiries() {
  const tbody = document.querySelector('#inquiries tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Loading...</td></tr>';
  // TODO: Replace with Firestore fetch
  // Example placeholder data
  const inquiries = [
    {from: 'John Doe', listing: 'Property Title 1', message: 'Hello, I am interested in your property.', date: '2024-06-01', status: 'New'},
    {from: 'Jane Smith', listing: 'Car for Sale', message: 'Is this car still available?', date: '2024-05-30', status: 'Read'}
  ];
  tbody.innerHTML = inquiries.map(inq => `
    <tr>
      <td>${inq.from}</td>
      <td>${inq.listing}</td>
      <td>${inq.message}</td>
      <td>${inq.date}</td>
      <td><span class="badge bg-${inq.status === 'New' ? 'primary' : 'secondary'}">${inq.status}</span></td>
      <td><button class="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#replyModal"><i class="bi bi-reply"></i> Reply</button></td>
    </tr>
  `).join('');
}

// --- Notifications Tab ---
async function loadNotifications() {
  const notifTab = document.getElementById('notifications');
  if (!notifTab) return;
  // TODO: Replace with Firestore fetch
  notifTab.innerHTML = '<div class="alert alert-info">No new notifications.</div>';
}

// --- Store Chat Tab ---
async function loadChatContacts() {
  const chatList = document.getElementById('chatList');
  const chatMessages = document.getElementById('chatMessages');
  if (!chatList || !chatMessages) return;
  // TODO: Replace with Firestore fetch
  const contacts = [
    {name: 'Jane Smith', listing: 'Property Title 2', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', id: 'c1'},
    {name: 'John Doe', listing: 'Car for Sale', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', id: 'c2'}
  ];
  chatList.innerHTML = contacts.map((c, i) => `
    <a href="#" class="list-group-item list-group-item-action${i === 0 ? ' active' : ''}" data-contact-id="${c.id}">
      <div class="fw-semibold">${c.name}</div>
      <div class="text-muted small">${c.listing}</div>
    </a>
  `).join('');
  // Load first contact's messages by default
  loadChatMessages(contacts[0]);
  // Event listeners for switching chat
  chatList.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', function(e) {
      e.preventDefault();
      chatList.querySelectorAll('a').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      const contact = contacts.find(c => c.id === this.getAttribute('data-contact-id'));
      loadChatMessages(contact);
    });
  });
}

function loadChatMessages(contact) {
  const chatHeader = document.getElementById('chatHeader');
  const chatMessages = document.getElementById('chatMessages');
  if (!chatHeader || !chatMessages) return;
  chatHeader.innerHTML = `
    <img src="${contact.avatar}" class="avatar me-2" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
    <div>
      <div class="fw-semibold">${contact.name}</div>
      <div class="text-muted small">${contact.listing}</div>
    </div>
  `;
  // TODO: Replace with Firestore fetch
  const messages = [
    {from: 'me', text: 'Hi, is this property still available?', date: '2024-06-01', avatar: currentUser ? currentUser.avatar : '', sent: true},
    {from: contact.name, text: 'Yes, it is available!', date: '2024-06-01', avatar: contact.avatar, sent: false}
  ];
  chatMessages.innerHTML = messages.map(msg => `
    <div class="chat-message${msg.sent ? ' sent' : ''} d-flex mb-3">
      <img src="${msg.avatar}" class="avatar me-2" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">
      <div>
        <div class="bubble ${msg.sent ? 'bg-primary text-white' : 'bg-light'}">${msg.text}</div>
        <div class="meta small text-muted">${msg.from} • ${msg.date}</div>
      </div>
    </div>
  `).join('');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Reply Modal ---
const replyModal = document.getElementById('replyModal');
if (replyModal) {
  replyModal.addEventListener('show.bs.modal', function (event) {
    // Optionally pre-fill modal with inquiry details
  });
  replyModal.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    // TODO: Send reply to Firestore
    replyModal.querySelector('textarea').value = '';
    const modal = bootstrap.Modal.getInstance(replyModal);
    modal.hide();
    alert('Reply sent!');
  });
}

// --- Chat Send Message ---
document.addEventListener('DOMContentLoaded', function() {
  const chatForm = document.querySelector('#storechat .card-footer form');
  if (chatForm) {
    chatForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // TODO: Send chat message to Firestore
      chatForm.querySelector('input').value = '';
    });
  }
}); 