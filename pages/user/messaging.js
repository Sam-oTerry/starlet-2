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
let onlineStatusUnsub;     // Will hold the unsubscribe function for online status listener
let conversationsUnsub;    // Will hold the unsubscribe function for conversations list listener
let selectedFiles = [];
let typingTimeout = null;  // Will hold the typing timeout for debouncing

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
            window.location.href = '../auth/login.html';
            return;
        }
        
        // Use window.currentUser to avoid conflicts with other scripts
        window.currentUser = user;
        console.log('User authenticated:', user.email, 'UID:', user.uid);
        
        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const isSupportChat = urlParams.get('support') === '1';
        const listingId = urlParams.get('listingId');
        const listerId = urlParams.get('listerId');
        const makeOffer = urlParams.get('makeOffer') === '1';
        
        // Initialize messaging features
        loadConversations();
        setupEventListeners();
        setupEmojiPicker();
        setupFileUpload();
        
        // Initialize mobile state
        initializeMobileState();
        
        // Handle different scenarios based on URL parameters
        if (isSupportChat) {
            console.log('Support chat requested, setting up support conversation...');
            setupSupportChat();
        } else if (listingId) {
            console.log('Listing ID provided, setting up listing conversation...');
            setupListingChat(listingId, listerId, makeOffer);
        }
        
        // Set up online status
        updateOnlineStatus(true);
        
        // Set up page visibility change listener for online status
        document.addEventListener('visibilitychange', () => {
            updateOnlineStatus(!document.hidden);
        });
        
        // Set up beforeunload listener to mark user as offline
        window.addEventListener('beforeunload', () => {
            updateOnlineStatus(false);
        });
        
        // Set up page unload listener to clean up listeners
        window.addEventListener('unload', () => {
            if (chatUnsub) chatUnsub();
            if (typingUnsub) typingUnsub();
            if (onlineStatusUnsub) onlineStatusUnsub();
            if (conversationsUnsub) conversationsUnsub();
            if (typingTimeout) clearTimeout(typingTimeout);
        });
        
        // Handle window resize for mobile navigation
        window.addEventListener('resize', handleWindowResize);
        
        // Mark messaging as initialized
        window.messagingInitialized = true;
        

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
        conversationsUnsub = db.collection('conversations')
            .where('participants', 'array-contains', window.currentUser.uid)
            .orderBy('lastMessageAt', 'desc')
            .onSnapshot(snapshot => {
                console.log('Conversations snapshot received:', snapshot.size, 'conversations');
                const conversations = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    console.log('Raw conversation data:', doc.id, data);
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
                    <div class="conversations-empty">
                        <i class="bi bi-exclamation-triangle text-warning"></i>
                        <h4>Failed to load conversations</h4>
                        <p class="small text-muted">Error: ${error.message}</p>
                        <button class="btn btn-primary btn-sm" onclick="loadConversations()">Retry</button>
                    </div>
                `;
            });

    } catch (error) {
        console.error('Error setting up conversations listener:', error);
        conversationsList.innerHTML = `
            <div class="conversations-empty">
                <i class="bi bi-exclamation-triangle text-warning"></i>
                <h4>Failed to load conversations</h4>
                <p class="small text-muted">Error: ${error.message}</p>
                <button class="btn btn-primary btn-sm" onclick="loadConversations()">Retry</button>
            </div>
        `;
    }
}

// Render conversations list
function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversationsList');
    
    console.log('Rendering conversations:', conversations);
    console.log('Conversations list element:', conversationsList);
    console.log('Conversations list visibility:', conversationsList.style.display, conversationsList.style.visibility, conversationsList.style.opacity);
    
    console.log('Conversations array length:', conversations.length);
    console.log('Conversations array type:', typeof conversations);
    console.log('Is conversations array?', Array.isArray(conversations));
    
    if (!conversations || conversations.length === 0) {
        console.log('No conversations to render, showing empty state');
        conversationsList.innerHTML = `
            <div class="conversations-empty">
                <i class="bi bi-chat-dots"></i>
                <h4>No conversations yet</h4>
                <p>Start a conversation by messaging a seller or agent</p>
            </div>
        `;
        return;
    }

    console.log('Starting to render', conversations.length, 'conversations');
    
    const conversationHtmls = conversations.map((conversation, index) => {
        console.log(`Processing conversation ${index + 1}/${conversations.length}:`, conversation);
        
        // Skip conversations that are null or undefined
        if (!conversation) {
            console.warn(`Conversation ${index} is null or undefined, skipping`);
            return '';
        }
        
        // Skip conversations without an ID
        if (!conversation.id) {
            console.warn(`Conversation ${index} has no ID, skipping:`, conversation);
            return '';
        }
        
        // Handle different conversation structures
        console.log(`Conversation ${index} participants:`, conversation.participants);
        console.log(`Conversation ${index} participantDetails:`, conversation.participantDetails);
        console.log(`Current user UID:`, window.currentUser.uid);
        
        let otherUser = {};
        if (conversation.participantDetails && conversation.participantDetails.length > 0) {
            console.log(`Conversation ${index} has participantDetails, searching for other user...`);
            otherUser = conversation.participantDetails.find(u => u.uid !== window.currentUser.uid) || {};
            console.log(`Conversation ${index} otherUser from participantDetails:`, otherUser);
        } else if (conversation.participants && conversation.participants.length > 0) {
            console.log(`Conversation ${index} has participants array, searching for other user...`);
            // Fallback: if no participantDetails, try to get from participants array
            const otherUserId = conversation.participants.find(uid => uid !== window.currentUser.uid);
            console.log(`Conversation ${index} otherUserId from participants:`, otherUserId);
            if (otherUserId) {
                otherUser = { uid: otherUserId, name: 'User', email: otherUserId };
                console.log(`Conversation ${index} created otherUser from participants:`, otherUser);
            }
        } else {
            console.warn(`Conversation ${index} has no participants or participantDetails`);
        }
        
        console.log('Other user found:', otherUser);
        
        const isActive = conversation.id === currentChatId;
        const unreadCount = conversation.unread && conversation.unread[window.currentUser.uid] ? conversation.unread[window.currentUser.uid] : 0;
        const hasUnread = unreadCount > 0;
        
        // Get listing information if available
        console.log(`Conversation ${index} listingQuote:`, conversation.listingQuote);
        console.log(`Conversation ${index} listingTitle:`, conversation.listingTitle);
        
        const listingInfo = conversation.listingQuote || {};
        let listingTitle = listingInfo.title || conversation.listingTitle || 'Property Inquiry';
        
        // Handle support chat special case
        if (conversation.isSupportChat) {
            listingTitle = 'Support Chat';
        }
        
        console.log(`Conversation ${index} final listing title:`, listingTitle);
        
        // Get user name for display (fallback to email if no name)
        const userName = otherUser.name || otherUser.email || 'Unknown User';
        
        console.log(`Conversation ${index} final display data:`, { 
            listingTitle, 
            userName, 
            hasUnread, 
            isActive,
            otherUserExists: Object.keys(otherUser).length > 0,
            hasListingInfo: !!listingInfo.title || !!conversation.listingTitle
        });
        
        // Ensure we have at least basic data to render
        if (!userName || userName === 'Unknown User') {
            console.warn(`Conversation ${index} has no valid user name, using fallback`);
        }
        
        if (!listingTitle || listingTitle === 'Property Inquiry') {
            console.warn(`Conversation ${index} has no valid listing title, using fallback`);
        }
        
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
        
        // Always render the conversation, even if some data is missing
        const conversationHtml = `
            <div class="conversation-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}" 
                 data-chat-id="${conversation.id}" 
                 onclick="openChat('${conversation.id}')">
                <img src="${otherUser.avatar || '../../img/avatar-placeholder.svg'}" 
                     alt="${userName}" 
                     class="conversation-avatar"
                     onerror="this.src='../../img/avatar-placeholder.svg'">
                <div class="conversation-info">
                    <div class="conversation-name">${listingTitle}</div>
                    <div class="conversation-subtitle">${userName}</div>
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
        
        console.log(`Conversation ${index} generated HTML length:`, conversationHtml.length);
        console.log(`Conversation ${index} HTML preview:`, conversationHtml.substring(0, 100) + '...');
        
        console.log('Generated HTML for conversation:', conversation.id, conversationHtml);
        return conversationHtml;
    });
    
    // Filter out empty strings and join
    const validHtmls = conversationHtmls.filter(html => html !== '');
    console.log('Valid conversation HTMLs:', validHtmls.length, 'out of', conversations.length);
    
    conversationsList.innerHTML = validHtmls.join('');
    
    console.log('Final conversations HTML length:', conversationsList.innerHTML.length);
    console.log('Number of conversation-item elements:', conversationsList.querySelectorAll('.conversation-item').length);
    
    // Add a visual indicator if no conversations are rendered
    const renderedItems = conversationsList.querySelectorAll('.conversation-item');
    console.log('Rendered items count:', renderedItems.length);
    
    if (renderedItems.length === 0) {
        console.error('No conversation items were rendered!');
        console.error('Original conversations count:', conversations.length);
        console.error('Valid HTMLs count:', validHtmls.length);
        console.error('Final HTML length:', conversationsList.innerHTML.length);
        
        conversationsList.innerHTML = `
            <div class="conversations-empty">
                <i class="bi bi-exclamation-triangle text-warning"></i>
                <h4>Rendering Issue</h4>
                <p>Conversations loaded but not displayed. Check console for details.</p>
                <p class="small text-muted">Expected: ${conversations.length} conversations</p>
                <p class="small text-muted">Valid: ${validHtmls.length} conversations</p>
                <p class="small text-muted">Rendered: ${renderedItems.length} items</p>
            </div>
        `;
    } else {
        console.log('Successfully rendered', renderedItems.length, 'conversation items');
    }
}

// Open chat and load messages
async function openChat(chatId) {
    // Clean up previous listeners
    if (chatUnsub) chatUnsub();
    if (typingUnsub) typingUnsub();
    if (onlineStatusUnsub) onlineStatusUnsub();
    
    // Clear typing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }

    currentChatId = chatId;
    
    // Show chat area on mobile
    showChatArea();

    // Update active conversation
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
      });
    document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('active');

    try {
        // Use global db variable
        
        // Get chat details
        const chatDoc = await db.collection('conversations').doc(chatId).get();
        if (!chatDoc.exists) {
            showEmptyState('Chat not found');
            return;
        }

        const chatData = chatDoc.data();
        console.log('Chat data:', chatData);
        
        let otherUser = {};
        if (chatData.participantDetails && chatData.participantDetails.length > 0) {
            otherUser = chatData.participantDetails.find(u => u.uid !== window.currentUser.uid) || {};
        } else if (chatData.participants && chatData.participants.length > 0) {
            // Fallback: if no participantDetails, try to get from participants array
            const otherUserId = chatData.participants.find(uid => uid !== window.currentUser.uid);
            if (otherUserId) {
                otherUser = { uid: otherUserId, name: 'User', email: otherUserId };
            }
        }
      
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
        
        // Listen for online status
        listenForOnlineStatus(otherUser.uid);

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

    // Get listing information if available
    const listingInfo = chatData.listingQuote || {};
    let listingTitle = listingInfo.title || chatData.listingTitle || 'Property Inquiry';
    const listingPrice = listingInfo.price ? `$${listingInfo.price.toLocaleString()}` : '';

    // Handle support chat special case
    if (chatData.isSupportChat) {
        listingTitle = 'Support Chat';
    }

    chatUserName.textContent = listingTitle;
    chatAvatar.src = otherUser.avatar || '../../img/avatar-placeholder.svg';
    
    // Initialize status with offline state (will be updated by online status listener)
    const statusIndicator = chatUserStatus.querySelector('.status-indicator');
    if (statusIndicator) {
    statusIndicator.className = 'status-indicator offline';
        statusIndicator.innerHTML = '<i class="bi bi-circle"></i>';
    }
    
    const statusText = chatUserStatus.querySelector('.status-text');
    if (statusText) {
        statusText.textContent = 'offline';
    }
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
    chatUnsub = db.collection('conversations').doc(chatId)
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
        await db.collection('conversations').doc(currentChatId)
            .collection('messages').add(message);

        // Update chat's last message
        await db.collection('conversations').doc(currentChatId).update({
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
    
    // Typing indicator functionality
    if (messageInput) {
    messageInput.addEventListener('input', function() {
            if (currentChatId) {
                // Clear existing timeout
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                }
                
                // Set typing status to true
                updateTypingStatus(currentChatId, true);
                
                // Set timeout to stop typing indicator after 2 seconds of no input
                typingTimeout = setTimeout(() => {
                    updateTypingStatus(currentChatId, false);
                }, 2000);
            }
        });
        
        // Stop typing when input loses focus
        messageInput.addEventListener('blur', function() {
            if (currentChatId && typingTimeout) {
                clearTimeout(typingTimeout);
                updateTypingStatus(currentChatId, false);
            }
        });
    }
    
    // Support chat button
    const supportChatBtn = document.getElementById('supportChatBtn');
    if (supportChatBtn) {
        supportChatBtn.addEventListener('click', function() {
            console.log('Support chat button clicked');
            setupSupportChat();
        });
    }
    
    // Floating support button
    const floatingSupportBtn = document.getElementById('floatingSupportBtn');
    if (floatingSupportBtn) {
        floatingSupportBtn.addEventListener('click', function() {
            console.log('Floating support button clicked');
            setupSupportChat();
        });
    }
    
    // Mobile navigation - back button
    const backToConversationsBtn = document.getElementById('backToConversations');
    if (backToConversationsBtn) {
        backToConversationsBtn.addEventListener('click', function() {
            console.log('Back to conversations clicked');
            showConversationsList();
        });
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
            await db.collection('conversations').doc(currentChatId)
                .collection('messages').add(message);
        }

        // Update chat's last message
        await db.collection('conversations').doc(currentChatId).update({
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
        await db.collection('conversations').doc(chatId).update({
            [`unread.${window.currentUser.uid}`]: 0
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Listen for typing indicators
function listenForTyping(chatId, otherUserId) {
    console.log('Setting up typing listener for chat:', chatId, 'other user:', otherUserId);
    
    if (!db) {
        console.error('Database not available for typing listener');
        return;
    }
    
    // Clean up previous listener
    if (typingUnsub) {
        typingUnsub();
    }
    
    typingUnsub = db.collection('conversations').doc(chatId)
        .collection('typing')
        .doc(otherUserId)
        .onSnapshot(doc => {
            console.log('Typing status update:', doc.exists ? doc.data() : 'not typing');
            
            const typingIndicator = document.querySelector('.typing-indicator');
            if (doc.exists && doc.data().isTyping) {
                if (!typingIndicator) {
                    console.log('Showing typing indicator');
                    const indicator = document.createElement('div');
                    indicator.className = 'typing-indicator';
                    indicator.innerHTML = `
                        <div class="typing-bubble">
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            </div>
                            <span class="typing-text">typing...</span>
                        </div>
                    `;
                    const chatMessages = document.getElementById('chatMessages');
                    if (chatMessages) {
                        chatMessages.appendChild(indicator);
                        // Auto-scroll to show typing indicator
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }
            } else {
                if (typingIndicator) {
                    console.log('Hiding typing indicator');
                    typingIndicator.remove();
                }
            }
        }, error => {
            console.error('Error listening for typing:', error);
        });
}

// Update typing status
function updateTypingStatus(chatId, isTyping) {
    if (!db || !chatId || !window.currentUser) {
        console.error('Cannot update typing status - missing required data');
        return;
    }
    
    console.log('Updating typing status:', isTyping, 'for chat:', chatId);
    
    const typingRef = db.collection('conversations').doc(chatId)
        .collection('typing')
        .doc(window.currentUser.uid);
    
    if (isTyping) {
        typingRef.set({
            isTyping: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else {
        typingRef.delete();
    }
}

// Update conversation count
function updateConversationCount(count) {
    const countElement = document.querySelector('.conversation-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Listen for online status
function listenForOnlineStatus(userId) {
    console.log('Setting up online status listener for user:', userId);
    
    if (!db) {
        console.error('Database not available for online status listener');
        return;
    }
    
    // Clean up previous listener
    if (onlineStatusUnsub) {
        onlineStatusUnsub();
    }
    
    onlineStatusUnsub = db.collection('presence').doc(userId)
        .onSnapshot(doc => {
            console.log('Online status update for user:', userId, doc.exists ? doc.data() : 'offline');
            
            const chatUserStatus = document.getElementById('chatUserStatus');
            if (chatUserStatus) {
                const statusIndicator = chatUserStatus.querySelector('.status-indicator');
                const statusText = chatUserStatus.querySelector('.status-text');
                
                if (doc.exists && doc.data().online) {
                    // User is online
                    if (statusIndicator) {
                        statusIndicator.className = 'status-indicator online';
                        statusIndicator.innerHTML = '<i class="bi bi-circle-fill"></i>';
                    }
                    if (statusText) {
                        statusText.textContent = 'online';
                    }
                } else {
                    // User is offline - show last seen
                    if (statusIndicator) {
                        statusIndicator.className = 'status-indicator offline';
                        statusIndicator.innerHTML = '<i class="bi bi-circle"></i>';
                    }
                    if (statusText) {
                        if (doc.exists && doc.data().lastSeen) {
                            const lastSeen = doc.data().lastSeen.toDate ? doc.data().lastSeen.toDate() : new Date(doc.data().lastSeen);
                            const now = new Date();
                            const diff = now - lastSeen;
                            
                            let lastSeenText = 'last seen ';
                            if (diff < 60000) { // Less than 1 minute
                                lastSeenText += 'just now';
                            } else if (diff < 3600000) { // Less than 1 hour
                                const minutes = Math.floor(diff / 60000);
                                lastSeenText += `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                            } else if (diff < 86400000) { // Less than 1 day
                                const hours = Math.floor(diff / 3600000);
                                lastSeenText += `${hours} hour${hours > 1 ? 's' : ''} ago`;
                            } else if (diff < 604800000) { // Less than 1 week
                                const days = Math.floor(diff / 86400000);
                                lastSeenText += `${days} day${days > 1 ? 's' : ''} ago`;
                            } else {
                                lastSeenText += lastSeen.toLocaleDateString();
                            }
                            
                            statusText.textContent = lastSeenText;
                        } else {
                            statusText.textContent = 'offline';
                        }
                    }
                }
            }
        }, error => {
            console.error('Error listening for online status:', error);
        });
}

// Setup support chat
async function setupSupportChat() {
    console.log('Setting up support chat...');
    
    if (!db || !window.currentUser) {
        console.error('Cannot setup support chat - missing required data');
        return;
    }
    
    try {
        // Create a unique support conversation ID for this user
        const supportChatId = `support_${window.currentUser.uid}`;
        
        // Check if support conversation already exists
        const supportDoc = await db.collection('conversations').doc(supportChatId).get();
        
        if (!supportDoc.exists) {
            console.log('Creating new support conversation...');
            
            // Create support conversation
            const supportConversation = {
                id: supportChatId,
                participants: [window.currentUser.uid, 'support_team'],
                participantDetails: [
                    {
                        uid: window.currentUser.uid,
                        name: window.currentUser.displayName || 'User',
                        email: window.currentUser.email,
                        avatar: window.currentUser.photoURL
                    },
                    {
                        uid: 'support_team',
                        name: 'Starlet Support',
                        email: 'support@starlet.co.ug',
                        avatar: '../../img/avatar-placeholder.svg'
                    }
                ],
                listingTitle: 'Support Chat',
                listingQuote: {
                    title: 'Support Chat',
                    price: null
                },
                lastMessage: 'Welcome to Starlet Support! How can we help you today?',
                lastMessageSenderId: 'support_team',
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isSupportChat: true
            };
            
            await db.collection('conversations').doc(supportChatId).set(supportConversation);
            
            // Add welcome message
            const welcomeMessage = {
                content: 'Welcome to Starlet Support! How can we help you today?',
                type: 'text',
                senderId: 'support_team',
                senderName: 'Starlet Support',
                senderAvatar: '../../img/avatar-placeholder.svg',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('conversations').doc(supportChatId)
                .collection('messages').add(welcomeMessage);
                
            console.log('Support conversation created successfully');
        } else {
            console.log('Support conversation already exists');
        }
        
        // Open the support chat
        await openChat(supportChatId);
        
        // Update the URL to show support chat
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('support', '1');
        newUrl.searchParams.set('chat', supportChatId);
        window.history.replaceState({}, '', newUrl);
        
        // Show chat area on mobile
        showChatArea();
        
    } catch (error) {
        console.error('Error setting up support chat:', error);
        showNotification('Failed to setup support chat. Please try again.', 'error');
    }
}

// Setup listing chat - create or find conversation for a specific listing
async function setupListingChat(listingId, listerId, makeOffer = false) {
    console.log('Setting up listing chat for listing:', listingId, 'lister:', listerId);
    
    if (!listingId) {
        console.error('Cannot setup listing chat - no listing ID provided');
        showNotification('Invalid listing. Please try again.', 'error');
        return;
    }
    
    // If no listerId provided, we'll try to get it from the listing data
    if (!listerId) {
        console.log('No listerId provided in URL, will attempt to extract from listing data');
    }
    
    if (!db) {
        console.error('Cannot setup listing chat - database not initialized');
        showNotification('System error. Please refresh the page and try again.', 'error');
        return;
    }
    
    if (!window.currentUser) {
        console.error('Cannot setup listing chat - user not authenticated');
        showNotification('Please log in to start a conversation.', 'error');
        return;
    }
    
    try {
        // Get listing details from Firestore
        let listingData;
        let listerData;
        const listingDoc = await db.collection('listings').doc(listingId).get();
        if (!listingDoc.exists) {
            // Check if this is a test listing and create demo data
            if (listingId.startsWith('test_')) {
                console.log('Creating demo listing for testing');
                listingData = {
                    title: listingId.includes('property') ? 'Demo Property - Beautiful 3-Bedroom House' : 'Demo Vehicle - 2020 Toyota Camry',
                    price: 50000000,
                    type: listingId.includes('property') ? 'house_sale' : 'cars',
                    location: {
                        district: 'Kampala',
                        town: 'Kampala Central'
                    },
                    images: ['https://via.placeholder.com/800x600?text=Demo+Property'],
                    createdBy: {
                        uid: actualListerId || 'demo_seller_123',
                        email: 'admin@starletproperties.ug'
                    },
                    description: 'This is a demo listing for testing the messaging system.'
                };
            } else {
                console.error('Listing not found:', listingId);
                showNotification('This listing is no longer available or has been removed.', 'error');
                return;
            }
        } else {
            listingData = listingDoc.data();
        }
        console.log('Listing data:', listingData);
        console.log('Listing data keys:', Object.keys(listingData || {}));
        if (listingData && listingData.createdBy) {
            console.log('CreatedBy data:', listingData.createdBy);
        }
        
        // Get lister details - check for multiple possible ID types
        // Priority order: URL listerId > agentId > createdBy.uid > userId > listerId > ownerId > propertyAgentId
        let actualListerId = listerId || 
                            listingData.agentId || 
                            (listingData.createdBy && listingData.createdBy.uid) || 
                            listingData.userId || 
                            listingData.listerId || 
                            listingData.ownerId || 
                            listingData.propertyAgentId;
        
        if (!actualListerId) {
            console.error('No lister ID found in listing data or URL parameters');
            console.log('Listing data keys:', Object.keys(listingData || {}));
            
            // For existing listings without a clear lister, create a support-style conversation
            console.log('Creating support-style conversation for listing without clear lister');
            actualListerId = 'support_team';
            showNotification('Connected to support for this listing.', 'info');
        } else {
            console.log('Found lister ID:', actualListerId);
            
            // Show which ID type was actually used
            if (actualListerId === listerId) {
                console.log('Using lister ID from URL parameters');
            } else if (actualListerId === listingData.agentId) {
                console.log('Using agentId from listing data');
            } else if (actualListerId === (listingData.createdBy && listingData.createdBy.uid)) {
                console.log('Using createdBy.uid from listing data');
            } else if (actualListerId === listingData.userId) {
                console.log('Using userId from listing data');
            } else {
                console.log('Using fallback ID from listing data');
            }
            
            console.log('ID source breakdown:');
            console.log('- URL listerId:', listerId);
            console.log('- agentId:', listingData.agentId);
            console.log('- createdBy.uid:', listingData.createdBy && listingData.createdBy.uid);
            console.log('- userId:', listingData.userId);
            console.log('- listerId:', listingData.listerId);
            console.log('- ownerId:', listingData.ownerId);
            console.log('- propertyAgentId:', listingData.propertyAgentId);
        }
        
        // For test cases, create demo lister data
        if (actualListerId.startsWith('test_') || actualListerId.startsWith('demo_')) {
            console.log('Creating demo lister data for testing');
            listerData = {
                displayName: 'Demo Seller',
                name: 'Demo Seller',
                email: 'demo@starlet.co.ug',
                photoURL: '../../img/avatar-placeholder.svg'
            };
        } else {
            console.log('Searching for lister data with ID:', actualListerId);
            
            // Try to find lister data in multiple collections
            let listerDoc = null;
            let collectionName = '';
            
            // Try users collection first
            try {
                listerDoc = await db.collection('users').doc(actualListerId).get();
                if (listerDoc.exists) {
                    collectionName = 'users';
                    console.log('Found lister in users collection');
                }
            } catch (error) {
                console.log('Error checking users collection:', error);
            }
            
            // If not found in users, try agents collection
            if (!listerDoc || !listerDoc.exists) {
                try {
                    listerDoc = await db.collection('agents').doc(actualListerId).get();
                    if (listerDoc.exists) {
                        collectionName = 'agents';
                        console.log('Found lister in agents collection');
                    }
                } catch (error) {
                    console.log('Error checking agents collection:', error);
                }
            }
            
            // If not found in agents, try propertyAgents collection
            if (!listerDoc || !listerDoc.exists) {
                try {
                    listerDoc = await db.collection('propertyAgents').doc(actualListerId).get();
                    if (listerDoc.exists) {
                        collectionName = 'propertyAgents';
                        console.log('Found lister in propertyAgents collection');
                    }
                } catch (error) {
                    console.log('Error checking propertyAgents collection:', error);
                }
            }
            
            if (!listerDoc || !listerDoc.exists) {
                console.error('Lister not found in any collection:', actualListerId);
                console.log('Tried collections: users, agents, propertyAgents');
                showNotification('Seller information not available. Please try again later.', 'error');
                return;
            }
            
            listerData = listerDoc.data();
            console.log(`Lister data loaded from ${collectionName} collection:`, listerData);
        }
        
        console.log('Lister data:', listerData);
        
        // Normalize lister data to handle different field names from different collections
        if (listerData) {
            // Ensure we have the required fields with fallbacks
            listerData = {
                displayName: listerData.displayName || listerData.name || listerData.fullName || listerData.agentName || 'Seller',
                name: listerData.name || listerData.displayName || listerData.fullName || listerData.agentName || 'Seller',
                email: listerData.email || listerData.agentEmail || 'seller@starlet.co.ug',
                photoURL: listerData.photoURL || listerData.avatar || listerData.agentAvatar || listerData.profilePicture || '../../img/avatar-placeholder.svg',
                phone: listerData.phone || listerData.phoneNumber || listerData.agentPhone || null,
                type: listerData.type || listerData.role || listerData.agentType || 'seller'
            };
            console.log('Normalized lister data:', listerData);
        } else {
            console.warn('Lister data not found, using fallback data');
            listerData = {
                displayName: 'Seller',
                name: 'Seller',
                email: 'seller@starlet.co.ug',
                photoURL: '../../img/avatar-placeholder.svg',
                phone: null,
                type: 'seller'
            };
        }
        
        // Create a unique conversation ID for this listing and user
        const conversationId = `listing_${listingId}_${window.currentUser.uid}_${actualListerId}`;
        
        // Check if conversation already exists
        const conversationDoc = await db.collection('conversations').doc(conversationId).get();
        
        if (!conversationDoc.exists) {
            console.log('Creating new listing conversation...');
            
            // Check for pending offer in localStorage
            let pendingOffer = null;
            if (makeOffer) {
                try {
                    const storedOffer = localStorage.getItem('pendingOffer');
                    if (storedOffer) {
                        pendingOffer = JSON.parse(storedOffer);
                        localStorage.removeItem('pendingOffer'); // Clear after reading
                    }
                } catch (error) {
                    console.error('Error reading pending offer:', error);
                }
            }
            
            // Helper function to remove undefined values
            const removeUndefinedValues = (obj) => {
                const cleaned = {};
                for (const [key, value] of Object.entries(obj)) {
                    if (value !== undefined) {
                        if (value && typeof value === 'object' && !Array.isArray(value)) {
                            cleaned[key] = removeUndefinedValues(value);
                        } else {
                            cleaned[key] = value;
                        }
                    }
                }
                return cleaned;
            };

            // Create conversation
            const conversation = {
                id: conversationId,
                participants: [window.currentUser.uid, actualListerId],
                participantDetails: [
                    {
                        uid: window.currentUser.uid,
                        name: window.currentUser.displayName || 'User',
                        email: window.currentUser.email,
                        avatar: window.currentUser.photoURL
                    },
                    {
                        uid: actualListerId,
                        name: listerData.displayName || listerData.name || 'Lister',
                        email: listerData.email,
                        avatar: listerData.photoURL || listerData.avatar,
                        phone: listerData.phone,
                        type: listerData.type || 'seller'
                    }
                ],
                listingId: listingId,
                listingTitle: listingData.title || 'Property Inquiry',
                listingQuote: {
                    title: listingData.title || 'Property Inquiry',
                    price: listingData.price || listingData.askingPrice || null,
                    image: listingData.images && listingData.images.length > 0 ? listingData.images[0] : 
                           listingData.image || listingData.media && listingData.media.length > 0 ? listingData.media[0] : null,
                    type: listingData.type || listingData.propertyType || listingData.listingType || 'property',
                    location: listingData.location ? {
                        district: listingData.location.district || null,
                        town: listingData.location.town || null,
                        neighborhood: listingData.location.neighborhood || null,
                        village: listingData.location.village || null
                    } : null
                },
                lastMessage: pendingOffer ? `Made an offer of $${pendingOffer.offerAmount}` : 'New conversation started',
                lastMessageSenderId: window.currentUser.uid,
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isListingChat: true
            };

            // Clean the conversation object to remove any undefined values
            const cleanedConversation = removeUndefinedValues(conversation);
            console.log('Cleaned conversation data:', cleanedConversation);
            
            await db.collection('conversations').doc(conversationId).set(cleanedConversation);
            
            // Add initial message
            let initialMessageContent = `Hi! I'm interested in your ${listingData.title || 'property'}. Can you tell me more about it?`;
            
            if (pendingOffer) {
                initialMessageContent = `Hi! I'm interested in your ${listingData.title || 'property'} and would like to make an offer of $${pendingOffer.offerAmount}. Can we discuss this?`;
            }
            
            const initialMessage = {
                content: initialMessageContent,
                type: 'text',
                senderId: window.currentUser.uid,
                senderName: window.currentUser.displayName || window.currentUser.email,
                senderAvatar: window.currentUser.photoURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('conversations').doc(conversationId)
                .collection('messages').add(initialMessage);
                
            console.log('Listing conversation created successfully');
        } else {
            console.log('Listing conversation already exists');
            // Update conversation with latest listing info if needed
            const existingData = conversationDoc.data();
            if (existingData.listingQuote?.title !== listingData.title) {
                await db.collection('conversations').doc(conversationId).update({
                    listingTitle: listingData.title || 'Property Inquiry',
                    listingQuote: {
                        title: listingData.title || 'Property Inquiry',
                        price: listingData.price,
                        image: listingData.images && listingData.images.length > 0 ? listingData.images[0] : null,
                        type: listingData.type,
                        location: listingData.location
                    },
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        
        // Open the conversation
        await openChat(conversationId);
        
        // Update the URL to show the conversation
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('chat', conversationId);
        window.history.replaceState({}, '', newUrl);
        
        // Show chat area on mobile
        showChatArea();
        
        // Show success notification
        showNotification('Conversation opened successfully', 'success');
        
    } catch (error) {
        console.error('Error setting up listing chat:', error);
        showNotification('Failed to setup listing chat. Please try again.', 'error');
    }
}

// Update user's online status
function updateOnlineStatus(isOnline) {
    if (!db || !window.currentUser) {
        console.error('Cannot update online status - missing required data');
        return;
    }
    
    console.log('Updating online status:', isOnline);
    
    const presenceRef = db.collection('presence').doc(window.currentUser.uid);
    
    if (isOnline) {
        presenceRef.set({
            online: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            userId: window.currentUser.uid,
            displayName: window.currentUser.displayName || window.currentUser.email
        });
    } else {
        presenceRef.set({
            online: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            userId: window.currentUser.uid,
            displayName: window.currentUser.displayName || window.currentUser.email
        });
    }
}

// Show chat area on mobile
function showChatArea() {
    const chatMain = document.querySelector('.chat-main');
    const chatSidebar = document.querySelector('.chat-sidebar');
    
    console.log('Showing chat area, window width:', window.innerWidth);
    
    if (window.innerWidth <= 768) {
        console.log('Mobile view - showing chat area');
        chatMain.classList.add('show');
        chatMain.classList.remove('hide');
        chatSidebar.style.display = 'none';
        
        // Ensure chat area is visible
        setTimeout(() => {
            chatMain.style.transform = 'translateX(0)';
        }, 10);
    } else {
        console.log('Desktop view - chat area already visible');
    }
}

// Show conversations list on mobile
function showConversationsList() {
    const chatMain = document.querySelector('.chat-main');
    const chatSidebar = document.querySelector('.chat-sidebar');
    
    console.log('Showing conversations list, window width:', window.innerWidth);
    
    if (window.innerWidth <= 768) {
        console.log('Mobile view - showing conversations list');
        chatMain.classList.remove('show');
        chatMain.classList.add('hide');
        chatSidebar.style.display = 'flex';
        
        // Ensure chat area is hidden
        setTimeout(() => {
            chatMain.style.transform = 'translateX(100%)';
        }, 10);
        
        // Clear current chat
        currentChatId = null;
        
        // Clean up listeners
        if (chatUnsub) chatUnsub();
        if (typingUnsub) typingUnsub();
        if (onlineStatusUnsub) onlineStatusUnsub();
        
        // Clear typing timeout
        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }
        
        // Show empty state
        showEmptyState('Select a conversation');
    } else {
        console.log('Desktop view - conversations list already visible');
    }
}

// Initialize mobile state
function initializeMobileState() {
    const chatMain = document.querySelector('.chat-main');
    const chatSidebar = document.querySelector('.chat-sidebar');
    
    console.log('Initializing mobile state, window width:', window.innerWidth);
    
    if (window.innerWidth <= 768) {
        console.log('Mobile view - initializing conversations list view');
        // Mobile view - start with conversations list
        chatMain.classList.remove('show');
        chatMain.classList.add('hide');
        chatSidebar.style.display = 'flex';
        chatMain.style.transform = 'translateX(100%)';
    } else {
        console.log('Desktop view - initializing side-by-side view');
        // Desktop view - show both
        chatMain.classList.remove('show', 'hide');
        chatSidebar.style.display = 'flex';
        chatMain.style.transform = 'none';
    }
}

// Handle window resize for mobile navigation
function handleWindowResize() {
    const chatMain = document.querySelector('.chat-main');
    const chatSidebar = document.querySelector('.chat-sidebar');
    
    console.log('Window resized to:', window.innerWidth);
    
    if (window.innerWidth > 768) {
        // Desktop view - show both sidebar and chat
        console.log('Switching to desktop view');
        chatMain.classList.remove('show', 'hide');
        chatSidebar.style.display = 'flex';
        chatSidebar.style.position = 'relative';
        chatSidebar.style.transform = 'none';
        chatMain.style.transform = 'none';
    } else {
        // Mobile view - show conversations list by default
        console.log('Switching to mobile view');
        if (!currentChatId) {
            chatMain.classList.remove('show');
            chatMain.classList.add('hide');
            chatSidebar.style.display = 'flex';
            chatMain.style.transform = 'translateX(100%)';
        }
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





// Show notification
function showNotification(message, type = 'info') {
    const notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        // Create notification container if it doesn't exist
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.innerHTML = `
        <div class="notification-content">
            <div class="notification-header">
                <strong>${type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info'}</strong>
            </div>
            <div class="notification-body">${message}</div>
        </div>
    `;
    
    document.querySelector('.notification-container').appendChild(toast);
    
    // Show the toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    // Allow manual close
    toast.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
}

// Send offer message
async function sendOfferMessage(offerAmount, listingTitle) {
    if (!currentChatId || !db) {
        console.error('Cannot send offer - no active chat or database');
        return;
    }
    
    try {
        const offerMessage = {
            content: `I would like to make an offer of $${offerAmount} for your ${listingTitle || 'property'}. What do you think?`,
            type: 'text',
            senderId: window.currentUser.uid,
            senderName: window.currentUser.displayName || window.currentUser.email,
            senderAvatar: window.currentUser.photoURL,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            isOffer: true,
            offerAmount: offerAmount
        };
        
        // Add message to Firestore
        await db.collection('conversations').doc(currentChatId)
            .collection('messages').add(offerMessage);
        
        // Update chat's last message
        await db.collection('conversations').doc(currentChatId).update({
            lastMessage: `Made an offer of $${offerAmount}`,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessageSenderId: window.currentUser.uid,
            lastMessageDelivered: true,
            lastMessageRead: false
        });
        
        showNotification('Offer sent successfully!', 'success');
        
    } catch (error) {
        console.error('Error sending offer:', error);
        showNotification('Failed to send offer. Please try again.', 'error');
    }
}

// Export functions for global access
window.openChat = openChat;
window.removeFile = removeFile;
window.uploadAndSendFiles = uploadAndSendFiles;
window.showNotification = showNotification;
window.sendOfferMessage = sendOfferMessage;
