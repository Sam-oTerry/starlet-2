// messaging.js - Comprehensive messaging functionality for Starlet Properties
// Handles conversations, real-time messaging, file uploads, emoji picker, and responsive design

// Global variables
let currentUser = null;
let currentChatId = null;
let chatUnsub = null;
let typingUnsub = null;
let conversationsUnsub = null;
let selectedFiles = [];

// Firebase services
let db, auth, storage;

// Initialize messaging system
document.addEventListener('DOMContentLoaded', function() {
    initializeMessaging();
});

function initializeMessaging() {
    // Wait for Firebase to be available
    if (typeof firebase === 'undefined') {
        setTimeout(initializeMessaging, 100);
      return;
    }
    
    // Initialize Firebase services
    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();

    // Check authentication
    auth.onAuthStateChanged(function(user) {
      if (!user) {
        window.location.href = '/pages/auth/login.html';
        return;
      }
      
        currentUser = user;
        console.log('User authenticated:', user.email);
        
        // Initialize messaging features
        loadConversations();
        setupEventListeners();
        setupEmojiPicker();
        setupFileUpload();
    });
}

// Load conversations
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    const conversationCount = document.querySelector('.conversation-count');
    
    if (!conversationsList) return;

    try {
        // Show loading state
          conversationsList.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
              </div>
                <p class="mt-2 text-muted">Loading conversations...</p>
            </div>
          `;

        // Listen for conversations in real-time
        conversationsUnsub = db.collection('chats')
            .where('participants', 'array-contains', currentUser.uid)
            .orderBy('lastMessageAt', 'desc')
            .onSnapshot(snapshot => {
                const conversations = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    conversations.push({
                        id: doc.id,
                        ...data
                    });
                });

                renderConversations(conversations);
                updateConversationCount(conversations.length);
            }, error => {
                console.error('Error loading conversations:', error);
                conversationsList.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                        <p class="mt-2 text-muted">Failed to load conversations</p>
                        <button class="btn btn-outline-primary btn-sm" onclick="loadConversations()">Retry</button>
              </div>
            `;
            });

    } catch (error) {
        console.error('Error setting up conversations listener:', error);
    }
}

// Render conversations list
function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-chat-dots text-muted" style="font-size: 2rem;"></i>
                <p class="mt-2 text-muted">No conversations yet</p>
                <p class="small text-muted">Start a conversation by messaging a seller or agent</p>
            </div>
        `;
        return;
    }

    conversationsList.innerHTML = conversations.map(conversation => {
        const otherUser = (conversation.participantDetails || []).find(u => u.uid !== currentUser.uid) || {};
        const isActive = conversation.id === currentChatId;
        const unreadCount = conversation.unread && conversation.unread[currentUser.uid] ? conversation.unread[currentUser.uid] : 0;
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" 
                 data-chat-id="${conversation.id}" 
                 onclick="openChat('${conversation.id}')">
                <img src="${otherUser.avatar || '../../img/avatar-placeholder.svg'}" 
                     alt="${otherUser.name || 'User'}" 
                     class="conversation-avatar">
                <div class="conversation-info">
                    <div class="conversation-name">${otherUser.name || 'Unknown User'}</div>
                    <div class="conversation-preview">${conversation.lastMessage || 'No messages yet'}</div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${formatTime(conversation.lastMessageAt)}</div>
                    ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Open chat and load messages
async function openChat(chatId) {
    if (chatUnsub) chatUnsub();
    if (typingUnsub) typingUnsub();

    currentChatId = chatId;

    // Update active conversation
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
      });
    document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');

    try {
        // Get chat details
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) {
            showEmptyState('Chat not found');
            return;
        }

        const chatData = chatDoc.data();
        const otherUser = (chatData.participantDetails || []).find(u => u.uid !== currentUser.uid) || {};
      
      // Update chat header
        updateChatHeader(otherUser, chatData);
        
        // Enable input
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        messageInput.disabled = false;
        sendBtn.disabled = false;
        
        // Load messages
        loadMessages(chatId);

        // Mark messages as read
        markMessagesAsRead(chatId);

        // Listen for typing
        listenForTyping(chatId, otherUser.uid);

    } catch (error) {
        console.error('Error opening chat:', error);
        showEmptyState('Failed to load chat');
    }
}

// Update chat header
function updateChatHeader(otherUser, chatData) {
    const chatUserName = document.getElementById('chatUserName');
    const chatUserStatus = document.getElementById('chatUserStatus');
    const chatAvatar = document.getElementById('chatAvatar');

    chatUserName.textContent = otherUser.name || 'Unknown User';
    chatAvatar.src = otherUser.avatar || '../../img/avatar-placeholder.svg';
    
    // Update status (you can implement online/offline logic here)
    const statusIndicator = chatUserStatus.querySelector('.status-indicator');
    statusIndicator.className = 'status-indicator offline';
    chatUserStatus.querySelector('span').textContent = 'Offline';
}

// Load messages
function loadMessages(chatId) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Show loading
    chatMessages.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading messages...</span>
            </div>
        </div>
      `;

    // Listen for messages in real-time
    chatUnsub = db.collection('chats').doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(snapshot => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
      });
    });

            renderMessages(messages);
        }, error => {
            console.error('Error loading messages:', error);
            chatMessages.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                    <p class="mt-2 text-muted">Failed to load messages</p>
                </div>
            `;
        });
}

// Render messages
function renderMessages(messages) {
    const chatMessages = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
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
      
    chatMessages.innerHTML = messages.map(message => {
        const isOwnMessage = message.senderId === currentUser.uid;
        const messageClass = isOwnMessage ? 'sent' : 'received';
        
        return `
            <div class="chat-message ${messageClass}" data-message-id="${message.id}">
                <img src="${isOwnMessage ? (currentUser.photoURL || '../../img/avatar-placeholder.svg') : (message.senderAvatar || '../../img/avatar-placeholder.svg')}" 
                     alt="Avatar" class="avatar">
                <div class="message-content">
                    <div class="bubble">
                        ${message.type === 'text' ? escapeHTML(message.content) : renderMessageContent(message)}
                        <div class="meta">
                            ${formatTime(message.timestamp)}
                            ${isOwnMessage ? '<i class="bi bi-check2-all"></i>' : ''}
                        </div>
                    </div>
                </div>
            </div>
          `;
    }).join('');

    // Scroll to bottom
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Render different message content types
function renderMessageContent(message) {
    switch (message.type) {
        case 'image':
            return `<div class="media-content">
                        <img src="${message.content}" alt="Image" onclick="openImageModal('${message.content}')">
                    </div>`;
        case 'file':
            return `<div class="media-content">
                        <div class="file-item">
                            <i class="bi bi-file-earmark"></i>
                            <div class="file-info">
                                <div class="file-name">${message.fileName}</div>
                                <div class="file-size">${formatFileSize(message.fileSize)}</div>
                            </div>
                            <a href="${message.content}" download class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-download"></i>
                            </a>
            </div>
                    </div>`;
        default:
            return escapeHTML(message.content);
    }
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content || !currentChatId) return;

    try {
        // Disable input temporarily
        messageInput.disabled = true;
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;

        // Create message object
        const message = {
            content: content,
            type: 'text',
            senderId: currentUser.uid,
            senderName: currentUser.displayName || currentUser.email,
            senderAvatar: currentUser.photoURL,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add message to Firestore
        await db.collection('chats').doc(currentChatId)
            .collection('messages').add(message);

        // Update chat's last message
        await db.collection('chats').doc(currentChatId).update({
            lastMessage: content,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Re-enable input
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();

    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
        
        // Re-enable input
        messageInput.disabled = false;
        sendBtn.disabled = false;
    }
}

// Setup event listeners
function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const emojiBtn = document.getElementById('emojiBtn');
    const attachmentBtn = document.getElementById('attachmentBtn');

    // Send message on Enter (Shift+Enter for new line)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        
        // Enable/disable send button
        sendBtn.disabled = !this.value.trim() || !currentChatId;
    });

    // Send button click
    sendBtn.addEventListener('click', sendMessage);

    // Emoji button click
    emojiBtn.addEventListener('click', function() {
        const emojiPicker = document.getElementById('emojiPicker');
        emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    });

    // Attachment button click
    attachmentBtn.addEventListener('click', function() {
        document.getElementById('fileInput').click();
    });

    // File input change
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
}

// Setup emoji picker
function setupEmojiPicker() {
    const emojiPicker = document.getElementById('emojiPicker');
    const messageInput = document.getElementById('messageInput');

    if (emojiPicker) {
        emojiPicker.addEventListener('emoji-click', event => {
            const cursorPos = messageInput.selectionStart;
            const textBefore = messageInput.value.substring(0, cursorPos);
            const textAfter = messageInput.value.substring(cursorPos);
            
            messageInput.value = textBefore + event.detail.unicode + textAfter;
            messageInput.setSelectionRange(cursorPos + event.detail.unicode.length, cursorPos + event.detail.unicode.length);
            messageInput.focus();
            
            // Trigger input event to update send button
            messageInput.dispatchEvent(new Event('input'));
        });

        // Hide emoji picker when clicking outside
        document.addEventListener('click', function(e) {
            if (!emojiPicker.contains(e.target) && !document.getElementById('emojiBtn').contains(e.target)) {
                emojiPicker.style.display = 'none';
            }
        });
    }
}

// Setup file upload
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');

    fileInput.addEventListener('change', handleFileSelect);
}

// Handle file selection
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    selectedFiles = files;
    
    if (files.length === 0) return;

    const filePreview = document.getElementById('filePreview');
    filePreview.style.display = 'block';
    
    filePreview.innerHTML = files.map(file => `
        <div class="file-item">
            <i class="file-icon bi bi-file-earmark"></i>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="remove-file" onclick="removeFile('${file.name}')">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `).join('');
}

// Remove file from selection
function removeFile(fileName) {
    selectedFiles = selectedFiles.filter(file => file.name !== fileName);
    
    if (selectedFiles.length === 0) {
        document.getElementById('filePreview').style.display = 'none';
          } else {
        handleFileSelect({ target: { files: selectedFiles } });
    }
}

// Upload files and send message
async function uploadAndSendFiles() {
    if (!selectedFiles.length || !currentChatId) return;

    try {
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;

        for (const file of selectedFiles) {
            // Upload file to Firebase Storage
            const fileRef = storage.ref(`chat-files/${currentChatId}/${Date.now()}_${file.name}`);
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();

            // Create message object
            const message = {
                content: downloadURL,
                type: file.type.startsWith('image/') ? 'image' : 'file',
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email,
                senderAvatar: currentUser.photoURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add message to Firestore
            await db.collection('chats').doc(currentChatId)
                .collection('messages').add(message);
        }

        // Update chat's last message
        await db.collection('chats').doc(currentChatId).update({
            lastMessage: `Sent ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Clear file selection
        selectedFiles = [];
        document.getElementById('filePreview').style.display = 'none';
        document.getElementById('fileInput').value = '';

        sendBtn.disabled = false;

    } catch (error) {
        console.error('Error uploading files:', error);
        alert('Failed to upload files. Please try again.');
        sendBtn.disabled = false;
    }
}

// Mark messages as read
async function markMessagesAsRead(chatId) {
    try {
        await db.collection('chats').doc(chatId).update({
            [`unread.${currentUser.uid}`]: 0
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Listen for typing indicators
function listenForTyping(chatId, otherUserId) {
    typingUnsub = db.collection('chats').doc(chatId)
        .collection('typing')
        .doc(otherUserId)
        .onSnapshot(doc => {
            const typingIndicator = document.querySelector('.typing-indicator');
            if (doc.exists && doc.data().isTyping) {
                if (!typingIndicator) {
                    const indicator = document.createElement('div');
                    indicator.className = 'typing-indicator';
                    indicator.innerHTML = `
                        <span>Typing</span>
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    `;
                    document.getElementById('chatMessages').appendChild(indicator);
                }
            } else {
                if (typingIndicator) {
                    typingIndicator.remove();
                }
            }
        });
}

// Update conversation count
function updateConversationCount(count) {
    const countElement = document.querySelector('.conversation-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Show empty state
function showEmptyState(message) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="bi bi-chat-dots"></i>
            </div>
            <h3>${message}</h3>
            <p>Select a conversation to start messaging</p>
        </div>
    `;
}

// Utility functions
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
    
    return date.toLocaleDateString();
}

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open image modal
function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Image</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body text-center">
                    <img src="${imageUrl}" class="img-fluid" alt="Image">
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
    
    modal.addEventListener('hidden.bs.modal', function() {
        document.body.removeChild(modal);
    });
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (chatUnsub) chatUnsub();
    if (typingUnsub) typingUnsub();
    if (conversationsUnsub) conversationsUnsub();
});

// Export functions for global access
window.openChat = openChat;
window.removeFile = removeFile;
window.uploadAndSendFiles = uploadAndSendFiles;
