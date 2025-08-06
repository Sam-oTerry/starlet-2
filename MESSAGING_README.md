# Messaging System Documentation

## Overview

The messaging system for Starlet Properties provides real-time communication between users, agents, and sellers. It features a modern, responsive interface with comprehensive functionality for property and vehicle inquiries.

## Features

### ✅ Core Messaging Features
- **Real-time messaging** with Firebase Firestore
- **Conversation management** with multiple participants
- **File uploads** (images, documents, etc.)
- **Emoji picker** integration
- **Typing indicators** for real-time feedback
- **Message status** (sent, delivered, read)
- **Unread message counters**
- **Message timestamps** with relative time display

### ✅ UI/UX Features
- **Responsive design** for all devices (mobile, tablet, desktop)
- **Modern chat interface** with message bubbles
- **Conversation sidebar** with search functionality
- **Smooth animations** and transitions
- **Loading states** and error handling
- **Empty states** for better UX
- **Accessibility features** (ARIA labels, keyboard navigation)

### ✅ Technical Features
- **Firebase Authentication** integration
- **Firebase Firestore** for real-time data
- **Firebase Storage** for file uploads
- **Offline persistence** for better reliability
- **Security rules** for data protection
- **Error handling** and retry mechanisms

## File Structure

```
pages/user/
├── messaging.html          # Main messaging page
└── messaging.js           # Core messaging functionality

assets/js/
└── firebase-config.js     # Firebase configuration

js/
├── messaging-sample-data.js  # Sample data for testing
└── user-messages.js         # Additional messaging utilities
```

## Implementation Details

### 1. Firebase Configuration (`assets/js/firebase-config.js`)
- Initializes Firebase services (Auth, Firestore, Storage)
- Enables offline persistence
- Makes services globally available

### 2. Main Messaging Logic (`pages/user/messaging.js`)
- **Authentication handling** with redirect to login
- **Conversation loading** with real-time updates
- **Message sending/receiving** with proper error handling
- **File upload** functionality with progress tracking
- **Emoji picker** integration
- **Typing indicators** for real-time feedback
- **Message rendering** with different content types
- **Responsive design** handling

### 3. Sample Data (`js/messaging-sample-data.js`)
- Sample conversations and messages for testing
- Function to populate test data
- Realistic conversation scenarios

## Database Schema

### Chats Collection
```javascript
{
  id: "chat_id",
  participants: ["user1", "agent1"],
  participantDetails: [
    {
      uid: "user1",
      name: "John Doe",
      email: "john@example.com",
      avatar: "https://..."
    }
  ],
  listingTitle: "Beautiful 3-Bedroom House",
  lastMessage: "Thank you for your interest!",
  lastMessageAt: timestamp,
  unread: {
    user1: 2,
    agent1: 0
  }
}
```

### Messages Subcollection
```javascript
{
  id: "message_id",
  content: "Hello! Is this property still available?",
  type: "text", // text, image, file
  senderId: "user1",
  senderName: "John Doe",
  senderAvatar: "https://...",
  timestamp: timestamp,
  // For files:
  fileName: "document.pdf",
  fileSize: 1024000,
  fileType: "application/pdf"
}
```

## Usage

### 1. Authentication
Users must be logged in to access messaging. Unauthenticated users are redirected to the login page.

### 2. Starting a Conversation
- Conversations are automatically created when users message agents/sellers
- Each conversation is linked to a specific listing
- Participants include the user and the listing owner/agent

### 3. Sending Messages
- **Text messages**: Type and press Enter or click Send
- **Files**: Click attachment button to upload files
- **Emojis**: Click emoji button to add emojis
- **Images**: Automatically displayed in chat
- **Documents**: Downloadable with file info

### 4. Real-time Features
- **Live updates**: Messages appear instantly
- **Typing indicators**: Shows when someone is typing
- **Unread counters**: Tracks unread messages
- **Online status**: Shows user availability

## Responsive Design

### Desktop (1024px+)
- Side-by-side layout with conversation list and chat
- Full feature set with emoji picker and file uploads
- Hover effects and detailed information

### Tablet (768px - 1023px)
- Adjusted layout with smaller conversation panel
- Maintained functionality with touch-friendly controls
- Optimized spacing and typography

### Mobile (320px - 767px)
- Single-column layout with conversation list at top
- Horizontal scrolling conversation list
- Simplified interface with essential features
- Touch-optimized buttons and interactions

## Security Features

### Firebase Security Rules
```javascript
// Chats collection
match /chats/{chatId} {
  allow read, write: if request.auth != null && 
    request.auth.uid in resource.data.participants;
}

// Messages subcollection
match /chats/{chatId}/messages/{messageId} {
  allow read, write: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
}
```

### Data Protection
- User authentication required for all operations
- Participants can only access their conversations
- File uploads are restricted to authenticated users
- Message content is sanitized to prevent XSS

## Error Handling

### Network Issues
- Automatic retry for failed operations
- Offline persistence for message queuing
- Graceful degradation when services unavailable

### User Feedback
- Loading indicators for all operations
- Error messages with retry options
- Success confirmations for important actions

## Performance Optimizations

### Real-time Updates
- Efficient Firestore listeners
- Minimal data transfer with selective updates
- Connection state management

### File Handling
- Image compression for uploads
- Progressive loading for large files
- Caching for frequently accessed content

### UI Performance
- Virtual scrolling for large message lists
- Debounced typing indicators
- Optimized re-renders

## Testing

### Sample Data
Use the sample data function to populate test conversations:
```javascript
// In browser console
populateSampleData();
```

### Manual Testing
1. **Authentication**: Verify login redirect
2. **Conversations**: Test conversation loading and selection
3. **Messaging**: Send text, files, and emojis
4. **Real-time**: Test typing indicators and live updates
5. **Responsive**: Test on different screen sizes

## Future Enhancements

### Planned Features
- **Voice messages** with audio recording
- **Video calls** integration
- **Message reactions** (like, heart, etc.)
- **Message search** functionality
- **Message forwarding** and sharing
- **Read receipts** with timestamps
- **Message editing** and deletion
- **Push notifications** for new messages

### Technical Improvements
- **WebRTC** for peer-to-peer communication
- **Message encryption** for enhanced security
- **Advanced file handling** with previews
- **Message threading** for organized conversations
- **Bot integration** for automated responses

## Troubleshooting

### Common Issues

1. **Messages not loading**
   - Check Firebase connection
   - Verify authentication status
   - Check browser console for errors

2. **File uploads failing**
   - Verify Firebase Storage rules
   - Check file size limits
   - Ensure proper file types

3. **Real-time updates not working**
   - Check Firestore security rules
   - Verify listener setup
   - Check network connectivity

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## Support

For technical support or feature requests, please contact:
- **Email**: dev@starletproperties.ug
- **Documentation**: [Internal Wiki]
- **Issue Tracking**: [GitHub Issues]

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Compatibility**: Modern browsers (Chrome 80+, Firefox 75+, Safari 13+) 