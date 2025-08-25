# Starlet Properties Messaging System

## Overview

The Starlet Properties messaging system is a comprehensive real-time chat application built with Firebase that enables users to communicate with property/vehicle sellers and support staff. It features a modern WhatsApp-style interface with advanced functionality for property and vehicle marketplaces.

## Features

### Core Messaging Features
- **Real-time messaging** using Firebase Firestore
- **File uploads and sharing** via Firebase Storage
- **Emoji picker** with extensive emoji library
- **Typing indicators** to show when someone is typing
- **Online/offline status** with last seen timestamps
- **Message read receipts** with delivery status
- **Conversation search** functionality
- **Mobile responsive design** with touch-optimized interface

### Business Features
- **Property listing chats** - Direct messaging with property sellers
- **Vehicle listing chats** - Direct messaging with vehicle sellers
- **Support chat** - Customer support integration
- **Offer messaging** - Make offers through the chat system
- **Conversation management** - Organize chats by listing type

### Technical Features
- **Firebase Authentication** for user management
- **Firebase Firestore** for real-time data synchronization
- **Firebase Storage** for file uploads
- **Offline persistence** with multi-tab support
- **Push notifications** (ready for implementation)
- **Security rules** for data protection

## Architecture

### Frontend Structure
```
pages/user/
├── messaging.html          # Main messaging interface
├── messaging.js           # Core messaging functionality
└── firebase-config.js     # Firebase configuration
```

### Database Structure
```
conversations/
├── {conversationId}/
│   ├── participants: [uid1, uid2]
│   ├── participantDetails: [user1, user2]
│   ├── listingId: string
│   ├── listingTitle: string
│   ├── listingQuote: object
│   ├── lastMessage: string
│   ├── lastMessageAt: timestamp
│   ├── isSupportChat: boolean
│   ├── isListingChat: boolean
│   └── messages/
│       ├── {messageId}/
│       │   ├── content: string
│       │   ├── type: string (text, image, file)
│       │   ├── senderId: string
│       │   ├── timestamp: timestamp
│       │   └── isOffer: boolean
```

## Usage

### Basic Messaging
1. Navigate to `/pages/user/messaging.html`
2. The system will automatically authenticate users
3. View existing conversations or start new ones
4. Send messages, files, and emojis

### Property Listing Chat
```javascript
// URL format for property chat
/pages/user/messaging.html?listingId={listingId}&listerId={listerId}

// Example
/pages/user/messaging.html?listingId=tSguk1ItYwXTvJcBCwOm&listerId=seller123
```

### Support Chat
```javascript
// URL format for support chat
/pages/user/messaging.html?support=1

// Example
/pages/user/messaging.html?support=1
```

### Make Offer Chat
```javascript
// URL format for offer chat
/pages/user/messaging.html?listingId={listingId}&listerId={listerId}&makeOffer=1

// Example
/pages/user/messaging.html?listingId=offer123&listerId=seller789&makeOffer=1
```

## Integration

### Property Details Page
Add a "Message Seller" button to property detail pages:

```html
<button class="btn btn-success" id="chatWithSellerBtn">
    <i class="bi bi-chat-dots"></i> Message Seller
</button>
```

```javascript
document.getElementById('chatWithSellerBtn').addEventListener('click', function() {
    const listingId = getListingId();
    const listerId = getListerId();
    const messagingUrl = `/pages/user/messaging.html?listingId=${listingId}&listerId=${listerId}`;
    window.location.href = messagingUrl;
});
```

### Vehicle Details Page
Similar integration for vehicle detail pages:

```html
<button class="btn btn-success" id="chatWithSellerBtn">
    <i class="bi bi-chat-dots"></i> Message Seller
</button>
```

### Floating Support Button
Add a floating support button to any page:

```html
<button class="floating-support-btn" id="floatingSupportBtn">
    <i class="bi bi-headset"></i>
    <span class="tooltip">Chat with Support</span>
</button>
```

## API Functions

### Core Functions
- `openChat(chatId)` - Open a specific conversation
- `sendMessage()` - Send a text message
- `uploadAndSendFiles()` - Upload and send files
- `setupSupportChat()` - Initialize support conversation
- `setupListingChat(listingId, listerId, makeOffer)` - Initialize listing conversation
- `sendOfferMessage(offerAmount, listingTitle)` - Send an offer message

### Utility Functions
- `showNotification(message, type)` - Display notifications
- `formatTime(timestamp)` - Format timestamps
- `formatFileSize(bytes)` - Format file sizes
- `updateOnlineStatus(isOnline)` - Update user online status

## Configuration

### Firebase Setup
1. Configure Firebase in `assets/js/firebase-config.js`
2. Enable Firestore, Authentication, and Storage
3. Set up security rules for data protection

### Security Rules
```javascript
// Firestore rules for conversations
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId} {
  allow read, write: if request.auth != null && 
    request.auth.uid in resource.data.participants;
}
  }
}
```

## Testing

### Test Page
Use the provided test page to verify functionality:
- Navigate to `messaging-test.html`
- Test different scenarios (support, property, vehicle, offers)
- Verify real-time messaging works
- Test file uploads and emoji picker

### Test Scenarios
1. **Support Chat**: `?support=1`
2. **Property Chat**: `?listingId=prop123&listerId=seller456`
3. **Vehicle Chat**: `?listingId=vehicle123&listerId=dealer789`
4. **Offer Chat**: `?listingId=offer123&listerId=seller999&makeOffer=1`

## Mobile Responsiveness

The messaging system is fully responsive with:
- **Mobile-first design** for small screens
- **Touch-optimized interface** for mobile devices
- **Swipe gestures** for navigation
- **Adaptive layouts** for different screen sizes
- **Optimized performance** for mobile networks

## Browser Support

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## Performance

### Optimization Features
- **Lazy loading** of conversations
- **Pagination** for large message histories
- **Image compression** for file uploads
- **Offline caching** for better performance
- **Debounced typing indicators** to reduce API calls

### Monitoring
- Real-time error tracking
- Performance metrics
- User engagement analytics
- Message delivery statistics

## Security

### Data Protection
- **End-to-end encryption** for sensitive data
- **User authentication** required for all operations
- **Input validation** and sanitization
- **Rate limiting** to prevent abuse
- **Secure file uploads** with type validation

### Privacy
- **User consent** for data collection
- **Data retention** policies
- **GDPR compliance** features
- **User data export** capabilities

## Future Enhancements

### Planned Features
- **Video calling** integration
- **Voice messages** support
- **Message reactions** (like, love, etc.)
- **Group conversations** for multiple buyers/sellers
- **Advanced search** with filters
- **Message translation** for international users
- **AI-powered responses** for support
- **Analytics dashboard** for sellers

### Technical Improvements
- **WebRTC** for real-time communication
- **Service workers** for offline functionality
- **Progressive Web App** features
- **Push notifications** for mobile
- **Advanced caching** strategies

## Troubleshooting

### Common Issues

1. **Messages not sending**
   - Check Firebase connection
   - Verify user authentication
   - Check browser console for errors

2. **File uploads failing**
   - Verify Firebase Storage is enabled
   - Check file size limits
   - Validate file types

3. **Real-time updates not working**
   - Check Firestore rules
   - Verify internet connection
   - Check for JavaScript errors

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('messagingDebug', 'true');
```

## Support

For technical support or questions about the messaging system:
- Check the Firebase console for errors
- Review the browser console for JavaScript errors
- Test with the provided test page
- Contact the development team

## License

This messaging system is part of the Starlet Properties platform and is proprietary software.

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Author**: Starlet Properties Development Team 