// Sample data for testing messaging functionality
// This file contains sample conversations and messages for development

const sampleConversations = [
  {
    id: 'chat1',
    participants: ['user1', 'agent1'],
    participantDetails: [
      {
        uid: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
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
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    unread: {
      user1: 2
    }
  },
  {
    id: 'chat2',
    participants: ['user1', 'agent2'],
    participantDetails: [
      {
        uid: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
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
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    unread: {}
  },
  {
    id: 'chat3',
    participants: ['user1', 'agent3'],
    participantDetails: [
      {
        uid: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
      },
      {
        uid: 'agent3',
        name: 'Emma Wilson',
        email: 'emma@starletproperties.ug',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
      }
    ],
    listingTitle: 'Commercial Land in Entebbe',
    lastMessage: 'I have some additional photos of the property. Let me send them to you.',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    unread: {}
  }
];

const sampleMessages = {
  chat1: [
    {
      id: 'msg1',
      content: 'Hi Sarah, I\'m interested in the 3-bedroom house you have listed. Is it still available?',
      type: 'text',
      senderId: 'user1',
      senderName: 'John Doe',
      senderAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: 'msg2',
      content: 'Hello John! Yes, the house is still available. It\'s a beautiful property with great amenities.',
      type: 'text',
      senderId: 'agent1',
      senderName: 'Sarah Johnson',
      senderAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5)
    },
    {
      id: 'msg3',
      content: 'That sounds great! What\'s the asking price and what\'s included?',
      type: 'text',
      senderId: 'user1',
      senderName: 'John Doe',
      senderAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1)
    },
    {
      id: 'msg4',
      content: 'The asking price is $150,000. It includes all appliances, furniture, and a parking space.',
      type: 'text',
      senderId: 'agent1',
      senderName: 'Sarah Johnson',
      senderAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 45)
    },
    {
      id: 'msg5',
      content: 'Thank you for your interest! When would you like to schedule a viewing?',
      type: 'text',
      senderId: 'agent1',
      senderName: 'Sarah Johnson',
      senderAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    }
  ],
  chat2: [
    {
      id: 'msg1',
      content: 'Hi Michael, I saw your listing for the luxury SUV. Is it still available?',
      type: 'text',
      senderId: 'user1',
      senderName: 'John Doe',
      senderAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4)
    },
    {
      id: 'msg2',
      content: 'Hello! Yes, the vehicle is still available. It\'s in excellent condition with low mileage.',
      type: 'text',
      senderId: 'agent2',
      senderName: 'Michael Chen',
      senderAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3.5)
    },
    {
      id: 'msg3',
      content: 'The vehicle is still available. Would you like to see it this weekend?',
      type: 'text',
      senderId: 'agent2',
      senderName: 'Michael Chen',
      senderAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    }
  ],
  chat3: [
    {
      id: 'msg1',
      content: 'Hi Emma, I\'m interested in the commercial land in Entebbe. Can you provide more details?',
      type: 'text',
      senderId: 'user1',
      senderName: 'John Doe',
      senderAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      id: 'msg2',
      content: 'Hello John! The commercial land is 2 acres with road access and utilities available.',
      type: 'text',
      senderId: 'agent3',
      senderName: 'Emma Wilson',
      senderAvatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5)
    },
    {
      id: 'msg3',
      content: 'I have some additional photos of the property. Let me send them to you.',
      type: 'text',
      senderId: 'agent3',
      senderName: 'Emma Wilson',
      senderAvatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
    }
  ]
};

// Function to populate sample data (for development/testing)
async function populateSampleData() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase not available');
    return;
  }

  const db = firebase.firestore();
  
  try {
    // Add sample conversations
    for (const conversation of sampleConversations) {
      await db.collection('chats').doc(conversation.id).set(conversation);
      
      // Add sample messages for each conversation
      const messages = sampleMessages[conversation.id] || [];
      for (const message of messages) {
        await db.collection('chats').doc(conversation.id)
          .collection('messages').add(message);
      }
    }
    
    console.log('Sample data populated successfully');
  } catch (error) {
    console.error('Error populating sample data:', error);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sampleConversations, sampleMessages, populateSampleData };
} else {
  window.sampleConversations = sampleConversations;
  window.sampleMessages = sampleMessages;
  window.populateSampleData = populateSampleData;
} 