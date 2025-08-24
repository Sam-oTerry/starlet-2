// messaging.js - Comprehensive messaging functionality for Starlet Properties
// Handles conversations, real-time messaging, file uploads, emoji picker, and responsive design

// Global variables
// Use undefined instead of null for uninitialized variables to avoid potential issues with strict null checks or type coercion
let db;                    // Will hold the Firebase Firestore database reference
let auth;                  // Will hold the Firebase Auth reference
let storage;               // Will hold the Firebase Storage reference
let currentChatId;         // Will hold the currently selected chat/conversation ID
let chatUnsub;             // Will hold the unsubscribe function for chat listener
let typingUnsub;           // Will hold the unsubscribe function for typing indicator listener
let conversationsUnsub;    // Will hold the unsubscribe function for conversations list listener
let selectedFiles = [];

// Firebase services - will use global services from firebase-config.js

// Initialize messaging system
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing messaging...');
    initializeMessaging();
});

// Also try to initialize if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
} else {
    // DOM is already loaded
    console.log('DOM already loaded, initializing messaging immediately...');
    initializeMessaging();
}

function initializeMessaging() {
    console.log('Initializing messaging system...');
    
    // Prevent multiple initializations
    if (window.messagingInitialized) {
        console.log('Messaging already initialized, skipping...');
        return;
    }
    
    // Wait for Firebase to be available
    if (typeof firebase === 'undefined') {
        console.log('Firebase not available, retrying...');
        setTimeout(initializeMessaging, 100);
        return;
    }
    
    console.log('Firebase available, using global services...');
    
    // Use global Firebase services directly
    db = window.firebaseDb || firebase.firestore();
    auth = window.firebaseAuth || firebase.auth();
    storage = window.firebaseStorage || (typeof firebase.storage === 'function' ? firebase.storage() : null);

    // Verify services are available
    if (!db || !auth) {
        console.error('Firebase services not properly initialized, retrying...');
        setTimeout(initializeMessaging, 100);
        return;
    }

    if (!storage) {
        console.warn('Firebase Storage not available, file uploads will be disabled');
    }

    console.log('Firebase services initialized from global scope');

    // Check authentication
    auth.onAuthStateChanged(function(user) {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        
        if (!user) {
            console.log('No user authenticated, redirecting to login');
            window.location.href = '/pages/auth/login.html';
            return;
        }
        
        // Use window.currentUser to avoid conflicts with other scripts
        window.currentUser = user;
        console.log('User authenticated:', user.email, 'UID:', user.uid);
        
        // Initialize messaging features
        loadConversations();
        setupEventListeners();
        setupEmojiPicker();
        setupFileUpload();
        
        // Mark messaging as initialized
        window.messagingInitialized = true;
        
        // Add a test button to create sample data
        const header = document.querySelector('.messaging-header');
        if (header) {
            const testButton = document.createElement('button');
            testButton.className = 'btn btn-outline-secondary btn-sm ms-2';
            testButton.textContent = 'Create Sample Data';
            testButton.onclick = populateSampleData;
            header.querySelector('h1').appendChild(testButton);
            
            // Add a test button to check Firebase connection
            const testConnectionButton = document.createElement('button');
            testConnectionButton.className = 'btn btn-outline-info btn-sm ms-2';
            testConnectionButton.textContent = 'Test Connection';
            testConnectionButton.onclick = testFirebaseConnection;
            header.querySelector('h1').appendChild(testConnectionButton);
        }
    });
}

// Load conversations
async function loadConversations() {
    const conversationsList = document.getElementById('conversationsList');
    const conversationCount = document.querySelector('.conversation-count');
    
    if (!conversationsList) {
        console.error('Conversations list element not found');
        return;
    }

    if (!db) {
        console.error('Database not initialized, retrying...');
        setTimeout(loadConversations, 100);
        return;
    }

    if (!window.currentUser) {
        console.error('No user authenticated');
        return;
    }

    console.log('Loading conversations for user:', window.currentUser.uid);

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
            .where('participants', 'array-contains', window.currentUser.uid)
            .orderBy('lastMessageAt', 'desc')
            .onSnapshot(snapshot => {
                console.log('Conversations snapshot received:', snapshot.size, 'conversations');
                const conversations = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    conversations.push({
                        id: doc.id,
                        ...data
                    });
                });

                console.log('Processed conversations:', conversations);
                renderConversations(conversations);
                updateConversationCount(conversations.length);
            }, error => {
                console.error('Error loading conversations:', error);
                conversationsList.innerHTML = `
                    <div class="text-center py-4">
                        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                        <p class="mt-2 text-muted">Failed to load conversations</p>
                        <p class="small text-muted">Error: ${error.message}</p>
                        <button class="btn btn-outline-primary btn-sm" onclick="loadConversations()">Retry</button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="populateSampleData()">Load Sample Data</button>
                    </div>
                `;
            });

    } catch (error) {
        console.error('Error setting up conversations listener:', error);
        conversationsList.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                <p class="mt-2 text-muted">Failed to load conversations</p>
                <p class="small text-muted">Error: ${error.message}</p>
                <button class="btn btn-outline-primary btn-sm" onclick="loadConversations()">Retry</button>
                <button class="btn btn-outline-secondary btn-sm" onclick="populateSampleData()">Load Sample Data</button>
            </div>
        `;
    }
}

// Render conversations list
function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    
    console.log('Rendering conversations:', conversations);
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="conversations-empty">
                <i class="bi bi-chat-dots"></i>
                <h4>No conversations yet</h4>
                <p>Start a conversation by messaging a seller or agent</p>
                <button class="btn btn-primary btn-sm" onclick="populateSampleData()">Load Sample Data</button>
            </div>
        `;
        return;
    }

    conversationsList.innerHTML = conversations.map(conversation => {
        const otherUser = (conversation.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
        const isActive = conversation.id === currentChatId;
        const unreadCount = conversation.unread && conversation.unread[window.currentUser.uid] ? conversation.unread[window.currentUser.uid] : 0;
        const hasUnread = unreadCount > 0;
        
        // Determine if the last message was sent by current user
        const isLastMessageFromCurrentUser = conversation.lastMessageSenderId === window.currentUser.uid;
        
        // Get message preview with status indicators
        let messagePreview = conversation.lastMessage || 'No messages yet';
        let messageStatus = '';
        
        if (isLastMessageFromCurrentUser && conversation.lastMessage) {
            // Add message status indicators for sent messages
            if (conversation.lastMessageRead) {
                messageStatus = ' ✓✓';
            } else if (conversation.lastMessageDelivered) {
                messageStatus = ' ✓✓';
            } else {
                messageStatus = ' ✓';
            }
        }
        
        // Truncate long messages
        if (messagePreview.length > 50) {
            messagePreview = messagePreview.substring(0, 47) + '...';
        }
        
        return `
            <div class="conversation-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}" 
                 data-chat-id="${conversation.id}" 
                 onclick="openChat('${conversation.id}')">
                <img src="${otherUser.avatar || '../../img/avatar-placeholder.svg'}" 
                     alt="${otherUser.name || 'User'}" 
                     class="conversation-avatar">
                <div class="conversation-info">
                    <div class="conversation-name">${otherUser.name || 'Unknown User'}</div>
                    <div class="conversation-preview">
                        ${isLastMessageFromCurrentUser && conversation.lastMessage ? 'You: ' : ''}${messagePreview}${messageStatus}
                    </div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${formatTime(conversation.lastMessageAt)}</div>
                    ${hasUnread ? `<div class="unread-badge ${unreadCount > 9 ? 'large' : ''}">${unreadCount > 99 ? '99+' : unreadCount}</div>` : ''}
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
        // Use global db variable
        
        // Get chat details
        const chatDoc = await db.collection('chats').doc(chatId).get();
        if (!chatDoc.exists) {
            showEmptyState('Chat not found');
            return;
        }

        const chatData = chatDoc.data();
        const otherUser = (chatData.participantDetails || []).find(u => u.uid !== window.currentUser.uid) || {};
      
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

    // Use global db variable
    
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

// Function to render a single message
function renderMessage(message) {
  const isCurrentUser = message.senderId === window.currentUser.uid;
  const messageClass = isCurrentUser ? 'sent' : 'received';
  
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = `message ${messageClass}`;
  
  // Handle different message types
  let messageContent = '';
  switch (message.type) {
    case 'text':
      messageContent = message.content;
      break;
      
    case 'chart':
      messageContent = `
        <div class="chart-container">
          <canvas class="chart-canvas" data-chart-data='${JSON.stringify(message.chartData)}'></canvas>
        </div>
      `;
      break;
      
    case 'image':
      messageContent = `
        <div class="image-message">
          <img src="${message.imageUrl}" alt="Shared image" class="message-image" style="max-width: 100%; border-radius: 8px;">
          ${message.caption ? `<div class="image-caption mt-2">${message.caption}</div>` : ''}
        </div>
      `;
      break;
      
    case 'file':
      messageContent = `
        <div class="file-message">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-file-earmark fs-4"></i>
            <div>
              <div class="fw-medium">${message.fileName || 'File'}</div>
              <small class="text-muted">${message.fileSize ? formatFileSize(message.fileSize) : ''}</small>
            </div>
          </div>
        </div>
      `;
      break;
      
    default:
      messageContent = message.content || 'Unsupported message type';
  }
  
  // Format time
  const messageTime = message.timestamp?.toDate 
    ? message.timestamp.toDate() 
    : (message.timestamp ? new Date(message.timestamp) : new Date());
  const formattedTime = messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Set message HTML with WhatsApp-style structure
  messageElement.innerHTML = `
    <div class="message-content">
      <div class="message-text">${messageContent}</div>
      <div class="message-meta">
        <span class="message-time">${formattedTime}</span>
        ${isCurrentUser ? '<span class="message-status">✓✓</span>' : ''}
      </div>
    </div>
  `;
  
  return messageElement;
}

// Function to render all messages
function renderMessages(messages) {
  const container = document.getElementById('chatMessages');
  if (!container) return;
  
  // Clear existing messages
  container.innerHTML = '';
  
  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-chat-dots"></i>
        <p>No messages yet. Start the conversation!</p>
      </div>
    `;
    return;
  }
  
  // Render each message
  messages.forEach(message => {
    const messageElement = renderMessage(message);
    container.appendChild(messageElement);
  });
  
  // Initialize charts if any
  initializeCharts();
  
  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// Function to initialize chart.js charts
function initializeCharts() {
  const chartContainers = document.querySelectorAll('.chart-canvas');
  
  chartContainers.forEach(container => {
    try {
      const ctx = container.getContext('2d');
      const chartData = JSON.parse(container.dataset.chartData);
      
      new Chart(ctx, {
        type: chartData.type || 'line', // Default to line chart
        data: chartData.data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: chartData.title || '',
            },
          },
          scales: chartData.scales || {}
        },
      });
    } catch (error) {
      console.error('Error initializing chart:', error);
    }
  });
}

// Send message
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const content = messageInput.value.trim();
    
    if (!content || !currentChatId) return;
    
    if (!db) {
        console.error('Database not initialized');
        alert('Database connection not available. Please refresh the page.');
        return;
    }
    
    try {
        // Use global db variable
        // Disable input temporarily
        messageInput.disabled = true;
        const sendBtn = document.getElementById('sendBtn');
        sendBtn.disabled = true;

        // Create message object
        const message = {
            content: content,
            type: 'text',
            senderId: window.currentUser.uid,
            senderName: window.currentUser.displayName || window.currentUser.email,
            senderAvatar: window.currentUser.photoURL,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add message to Firestore
        await db.collection('chats').doc(currentChatId)
            .collection('messages').add(message);

        // Update chat's last message
        await db.collection('chats').doc(currentChatId).update({
            lastMessage: content,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageSenderId: window.currentUser.uid,
            lastMessageDelivered: true,
            lastMessageRead: false
        });

        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';
        messageInput.focus();

        // Re-enable input and update send button
        messageInput.disabled = false;
        sendBtn.disabled = true;
        sendBtn.classList.remove('btn-primary');
        sendBtn.classList.add('btn-secondary');

        // Hide typing indicator when message is sent
        if (window.hideTypingIndicator) {
          window.hideTypingIndicator();
        }
        
        // Auto-scroll to bottom
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
          setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }, 100);
        }

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

    // Check if elements exist before adding listeners
    if (!messageInput || !sendBtn) {
        console.warn('Message input or send button not found');
        return;
    }

    // Send button click
    sendBtn.addEventListener('click', function(e) {
        e.preventDefault();
        sendMessage();
    });

    // Attachment button click
    if (attachmentBtn) {
        attachmentBtn.addEventListener('click', function() {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) fileInput.click();
        });
    }

    // File input change
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// Setup emoji picker with simple implementation
function setupEmojiPicker() {
    const emojiBtn = document.getElementById('emojiBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (!emojiBtn || !messageInput) {
        console.log('Emoji picker elements not found, skipping setup');
        return;
    }
    
    // Create simple emoji picker
    const emojiPicker = document.createElement('div');
    emojiPicker.className = 'emoji-picker';
    emojiPicker.id = 'emojiPicker';
    
    // Common emojis
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👮‍♀️', '👮', '👮‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️', '💂‍♀️', '💂', '💂‍♂️', '👷‍♀️', '👷', '👷‍♂️', '🤴', '👸', '👳‍♀️', '👳', '👳‍♂️', '👲', '🧕‍♀️', '🤵‍♀️', '🤵', '🤵‍♂️', '👰‍♀️', '👰', '👰‍♂️', '🤰‍♀️', '🤰', '🤰‍♂️', '🤱‍♀️', '🤱', '🤱‍♂️', '👼', '🎅', '🤶', '🦸‍♀️', '🦸', '🦸‍♂️', '🦹‍♀️', '🦹', '🦹‍♂️', '🧙‍♀️', '🧙', '🧙‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🙍‍♀️', '🙍', '🙍‍♂️', '🙎‍♀️', '🙎', '🙎‍♂️', '🙅‍♀️', '🙅', '🙅‍♂️', '🙆‍♀️', '🙆', '🙆‍♂️', '💁‍♀️', '💁', '💁‍♂️', '🙋‍♀️', '🙋', '🙋‍♂️', '🧏‍♀️', '🧏', '🧏‍♂️', '🙇‍♀️', '🙇', '🙇‍♂️', '🤦‍♀️', '🤦', '🤦‍♂️', '🤷‍♀️', '🤷', '🤷‍♂️', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒', '👮‍♀️', '👮', '👮‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️', '💂‍♀️', '💂', '💂‍♂️', '👷‍♀️', '👷', '👷‍♂️', '🤴', '👸', '👳‍♀️', '👳', '👳‍♂️', '👲', '🧕‍♀️', '🤵‍♀️', '🤵', '🤵‍♂️', '👰‍♀️', '👰', '👰‍♂️', '🤰‍♀️', '🤰', '🤰‍♂️', '🤱‍♀️', '🤱', '🤱‍♂️', '👼', '🎅', '🤶', '🦸‍♀️', '🦸', '🦸‍♂️', '🦹‍♀️', '🦹', '🦹‍♂️', '🧙‍♀️', '🧙', '🧙‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🙍‍♀️', '🙍', '🙍‍♂️', '🙎‍♀️', '🙎', '🙎‍♂️', '🙅‍♀️', '🙅', '🙅‍♂️', '🙆‍♀️', '🙆', '🙆‍♂️', '💁‍♀️', '💁', '💁‍♂️', '🙋‍♀️', '🙋', '🙋‍♂️', '🧏‍♀️', '🧏', '🧏‍♂️', '🙇‍♀️', '🙇', '🙇‍♂️', '🤦‍♀️', '🤦', '🤦‍♂️', '🤷‍♀️', '🤷', '🤷‍♂️', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '👨‍⚖️', '👩‍⚖️', '👨‍🌾', '👩‍🌾', '👨‍🍳', '👩‍🍳', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍✈️', '👩‍✈️', '👨‍🚀', '👩‍🚀', '👨‍🚒', '👩‍🚒'];
    
    // Create emoji grid
    const emojiGrid = document.createElement('div');
    emojiGrid.className = 'emoji-grid';
    
    emojis.forEach(emoji => {
        const emojiItem = document.createElement('div');
        emojiItem.className = 'emoji-item';
        emojiItem.textContent = emoji;
        emojiItem.onclick = () => {
            const cursorPos = messageInput.selectionStart;
            const textBefore = messageInput.value.substring(0, cursorPos);
            const textAfter = messageInput.value.substring(cursorPos);
            
            messageInput.value = textBefore + emoji + textAfter;
            messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
            messageInput.focus();
            
            // Trigger input event to update send button
            messageInput.dispatchEvent(new Event('input'));
            
            // Hide emoji picker
            emojiPicker.classList.remove('show');
        };
        emojiGrid.appendChild(emojiItem);
    });
    
    emojiPicker.appendChild(emojiGrid);
    document.body.appendChild(emojiPicker);
    
    // Emoji button click handler
    emojiBtn.onclick = (e) => {
        e.preventDefault();
        emojiPicker.classList.toggle('show');
        
        // Position the picker near the button
        const rect = emojiBtn.getBoundingClientRect();
        emojiPicker.style.position = 'absolute';
        emojiPicker.style.top = (rect.bottom + 5) + 'px';
        emojiPicker.style.left = rect.left + 'px';
    };
    
    // Hide emoji picker when clicking outside
    document.addEventListener('click', function(e) {
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.classList.remove('show');
        }
    });
}

// Setup file upload
function setupFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const attachmentBtn = document.getElementById('attachmentBtn');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Get Firebase services from global scope
    const storage = window.firebaseStorage || (typeof firebase.storage === 'function' ? firebase.storage() : null);
    
    // Disable attachment button if storage is not available
    if (!storage) {
        if (attachmentBtn) {
            attachmentBtn.disabled = true;
            attachmentBtn.title = 'File uploads not available';
            attachmentBtn.style.opacity = '0.5';
        }
        console.log('File uploads disabled - Firebase Storage not available');
    }
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

    if (!db) {
        console.error('Database not initialized');
        alert('Database connection not available. Please refresh the page.');
        return;
    }

    try {
        // Use global db and storage variables
        const storage = window.firebaseStorage || (typeof firebase.storage === 'function' ? firebase.storage() : null);

        // Check if storage is available
        if (!storage) {
            alert('File uploads are not available. Please try again later.');
            return;
        }
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
                senderId: window.currentUser.uid,
                senderName: window.currentUser.displayName || window.currentUser.email,
                senderAvatar: window.currentUser.photoURL,
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
    // Use global db variable
    
    try {
        await db.collection('chats').doc(chatId).update({
            [`unread.${window.currentUser.uid}`]: 0
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Listen for typing indicators
function listenForTyping(chatId, otherUserId) {
    // Use global db variable
    
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
    
    // Clear initialization flag
    window.messagingInitialized = false;
});

// Populate sample data for testing
async function populateSampleData() {
    if (!window.currentUser) {
        console.error('No user authenticated');
        return;
    }

    if (!db) {
        console.error('Database not initialized');
        alert('Database connection not available. Please refresh the page.');
        return;
    }

    console.log('Populating sample data for user:', window.currentUser.uid);

    try {
        // Use global db variable
        // Create sample conversations
        const sampleConversations = [
            {
                participants: [window.currentUser.uid, 'agent1'],
                participantDetails: [
                    {
                        uid: window.currentUser.uid,
                        name: window.currentUser.displayName || window.currentUser.email,
                        email: window.currentUser.email,
                        avatar: window.currentUser.photoURL || '../../img/avatar-placeholder.svg'
                    },
                    {
                        uid: 'agent1',
                        name: 'Sarah Johnson',
                        email: 'sarah@starletproperties.ug',
                        avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
                    }
                ],
                listingTitle: 'Beautiful 3-Bedroom House in Kampala',
                lastMessage: 'Thank you for your interest! When would you like to schedule a viewing?',
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                unread: {
                    [window.currentUser.uid]: 2
                }
            },
            {
                participants: [window.currentUser.uid, 'agent2'],
                participantDetails: [
                    {
                        uid: window.currentUser.uid,
                        name: window.currentUser.displayName || window.currentUser.email,
                        email: window.currentUser.email,
                        avatar: window.currentUser.photoURL || '../../img/avatar-placeholder.svg'
                    },
                    {
                        uid: 'agent2',
                        name: 'Michael Chen',
                        email: 'michael@starletproperties.ug',
                        avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
                    }
                ],
                listingTitle: 'Luxury SUV for Sale',
                lastMessage: 'The vehicle is still available. Would you like to see it this weekend?',
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                unread: {}
            }
        ];

        // Add conversations to Firestore
        for (const conversation of sampleConversations) {
            const chatRef = await db.collection('chats').add(conversation);
            console.log('Created conversation:', chatRef.id);

            // Add sample messages
            const sampleMessages = [
                {
                    content: 'Hi! I\'m interested in this property. Is it still available?',
                    type: 'text',
                    senderId: window.currentUser.uid,
                    senderName: window.currentUser.displayName || window.currentUser.email,
                    senderAvatar: window.currentUser.photoURL || '../../img/avatar-placeholder.svg',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                },
                {
                    content: 'Hello! Yes, it\'s still available. Would you like to schedule a viewing?',
                    type: 'text',
                    senderId: conversation.participants.find(p => p !== window.currentUser.uid),
                    senderName: conversation.participantDetails.find(p => p.uid !== window.currentUser.uid).name,
                    senderAvatar: conversation.participantDetails.find(p => p.uid !== window.currentUser.uid).avatar,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }
            ];

            for (const message of sampleMessages) {
                await chatRef.collection('messages').add(message);
            }
        }

        console.log('Sample data populated successfully');
        alert('Sample conversations created! Refresh the page to see them.');

    } catch (error) {
        console.error('Error populating sample data:', error);
        alert('Failed to create sample data: ' + error.message);
    }
}

// Test Firebase connection
async function testFirebaseConnection() {
    console.log('Testing Firebase connection...');
    
    try {
        // Use global variables
        const auth = window.firebaseAuth || firebase.auth();
        const storage = window.firebaseStorage || (typeof firebase.storage === 'function' ? firebase.storage() : null);
        
        console.log('Firebase services status:');
        console.log('- Firestore:', db ? 'Available' : 'Not available');
        console.log('- Auth:', auth ? 'Available' : 'Not available');
        console.log('- Storage:', storage ? 'Available' : 'Not available');
        console.log('- Current user:', window.currentUser ? window.currentUser.email : 'Not authenticated');
        
        // Test Firestore connection
        if (db) {
            const testDoc = await db.collection('test').doc('connection-test').get();
            console.log('Firestore connection test:', testDoc.exists ? 'Success' : 'Success (doc does not exist)');
        }
        
        alert('Firebase connection test completed. Check console for details.');
        
    } catch (error) {
        console.error('Firebase connection test failed:', error);
        alert('Firebase connection test failed: ' + error.message);
    }
}

// Export functions for global access
window.openChat = openChat;
window.removeFile = removeFile;
window.uploadAndSendFiles = uploadAndSendFiles;
window.populateSampleData = populateSampleData;
window.testFirebaseConnection = testFirebaseConnection;
