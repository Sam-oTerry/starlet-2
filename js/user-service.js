/**
 * User Service - Centralized user data management
 * Provides consistent user name fetching with caching and graceful fallbacks
 */

class UserService {
  constructor() {
    // Cache for user names to avoid repeated Firestore queries
    this.userNamesCache = new Map();
    // Cache for user avatars to avoid repeated Firestore queries
    this.userAvatarsCache = new Map();
    // Cache for full user data
    this.userDataCache = new Map();
    
    console.log('🔧 UserService initialized with caching');
  }

  /**
   * Fetch user name from users collection with caching
   * @param {string} userId - The user ID to fetch
   * @returns {Promise<string|null>} - User name or null if not found
   */
  async fetchUserName(userId) {
    if (!userId) {
      console.warn('⚠️ fetchUserName called with null/undefined userId');
      return null;
    }

    // Check cache first
    if (this.userNamesCache.has(userId)) {
      console.log(`📋 Using cached user name for ${userId}:`, this.userNamesCache.get(userId));
      return this.userNamesCache.get(userId);
    }

    try {
      console.log(`🔍 Fetching user name for ID: ${userId}`);
      
      if (!window.firebaseDB) {
        console.warn('⚠️ Firebase DB not available for user name fetch');
        return null;
      }

      const userDoc = await window.firebaseDB.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userName = userData.displayName || userData.name || userData.email || 'User';
        
        // Cache the result
        this.userNamesCache.set(userId, userName);
        console.log(`✅ Fetched user name for ${userId}:`, userName);
        return userName;
      } else {
        console.log(`⚠️ User document not found for ID: ${userId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error fetching user name for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Fetch user avatar from users collection with caching
   * @param {string} userId - The user ID to fetch
   * @returns {Promise<string|null>} - User avatar URL or null if not found
   */
  async fetchUserAvatar(userId) {
    if (!userId) {
      console.warn('⚠️ fetchUserAvatar called with null/undefined userId');
      return null;
    }

    // Check cache first
    if (this.userAvatarsCache.has(userId)) {
      console.log(`📋 Using cached user avatar for ${userId}:`, this.userAvatarsCache.get(userId));
      return this.userAvatarsCache.get(userId);
    }

    try {
      console.log(`🔍 Fetching user avatar for ID: ${userId}`);
      
      if (!window.firebaseDB) {
        console.warn('⚠️ Firebase DB not available for user avatar fetch');
        return null;
      }

      const userDoc = await window.firebaseDB.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userAvatar = userData.avatar || userData.profileImage || userData.photoURL || null;
        
        // Cache the result
        this.userAvatarsCache.set(userId, userAvatar);
        console.log(`✅ Fetched user avatar for ${userId}:`, userAvatar);
        return userAvatar;
      } else {
        console.log(`⚠️ User document not found for ID: ${userId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error fetching user avatar for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Fetch full user data from users collection with caching
   * @param {string} userId - The user ID to fetch
   * @returns {Promise<Object|null>} - Full user data or null if not found
   */
  async fetchUserData(userId) {
    if (!userId) {
      console.warn('⚠️ fetchUserData called with null/undefined userId');
      return null;
    }

    // Check cache first
    if (this.userDataCache.has(userId)) {
      console.log(`📋 Using cached user data for ${userId}`);
      return this.userDataCache.get(userId);
    }

    try {
      console.log(`🔍 Fetching full user data for ID: ${userId}`);
      
      if (!window.firebaseDB) {
        console.warn('⚠️ Firebase DB not available for user data fetch');
        return null;
      }

      const userDoc = await window.firebaseDB.collection('users').doc(userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Cache the result
        this.userDataCache.set(userId, userData);
        console.log(`✅ Fetched user data for ${userId}:`, userData);
        return userData;
      } else {
        console.log(`⚠️ User document not found for ID: ${userId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error fetching user data for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user display name with fallbacks
   * @param {Object} userData - User data object
   * @returns {string} - Display name
   */
  getDisplayName(userData) {
    if (!userData) return 'Unknown User';
    
    return userData.displayName || 
           userData.name || 
           userData.email || 
           (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'Unknown User') ||
           'Unknown User';
  }

  /**
   * Get user avatar with fallbacks
   * @param {Object} userData - User data object
   * @returns {string} - Avatar URL
   */
  getAvatar(userData) {
    if (!userData) return '../../img/default-avatar.svg';
    
    return userData.avatar || 
           userData.profileImage || 
           userData.photoURL || 
           '../../img/default-avatar.svg';
  }

  /**
   * Extract user IDs from conversation ID patterns
   * @param {string} convId - Conversation ID
   * @returns {Array<string>} - Array of potential user IDs
   */
  extractUserIdsFromConversationId(convId) {
    if (!convId) return [];
    
    const userIds = [];
    
    if (convId.startsWith('listing_')) {
      const parts = convId.split('_');
      if (parts.length >= 3) {
        userIds.push(parts[2]); // User ID
        if (parts.length >= 4) {
          userIds.push(parts[3]); // Agent ID
        }
      }
    } else if (convId.startsWith('support_')) {
      const parts = convId.split('_');
      if (parts.length >= 2) {
        userIds.push(parts[1]); // User ID
      }
    } else {
      // Direct conversation ID might be a user ID
      userIds.push(convId);
    }
    
    return userIds;
  }

  /**
   * Get user name with intelligent fallbacks
   * @param {string} userId - User ID
   * @param {string} convId - Conversation ID (optional, for fallback names)
   * @returns {Promise<string>} - User name with fallbacks
   */
  async getUserNameWithFallbacks(userId, convId = null) {
    if (!userId) {
      console.warn('⚠️ getUserNameWithFallbacks called with null/undefined userId');
      return 'Unknown User';
    }

    // Try to fetch from users collection first
    const userName = await this.fetchUserName(userId);
    if (userName && userName !== 'User') {
      return userName;
    }

    // If no name found and we have conversation ID, try to extract more user IDs
    if (convId) {
      const userIds = this.extractUserIdsFromConversationId(convId);
      for (const extractedUserId of userIds) {
        if (extractedUserId !== userId) {
          const extractedUserName = await this.fetchUserName(extractedUserId);
          if (extractedUserName && extractedUserName !== 'User') {
            return extractedUserName;
          }
        }
      }
    }

    // Apply intelligent fallback names based on context
    if (convId) {
      if (convId.startsWith('listing_')) {
        return 'Property Inquirer';
      } else if (convId.startsWith('support_')) {
        return 'Support User';
      } else {
        return 'Chat User';
      }
    }

    return 'Unknown User';
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.userNamesCache.clear();
    this.userAvatarsCache.clear();
    this.userDataCache.clear();
    console.log('🧹 UserService cache cleared');
  }

  /**
   * Clear cache for specific user
   * @param {string} userId - User ID to clear from cache
   */
  clearUserCache(userId) {
    this.userNamesCache.delete(userId);
    this.userAvatarsCache.delete(userId);
    this.userDataCache.delete(userId);
    console.log(`🧹 Cache cleared for user: ${userId}`);
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    return {
      userNames: this.userNamesCache.size,
      userAvatars: this.userAvatarsCache.size,
      userData: this.userDataCache.size
    };
  }
}

// Create global instance
window.userService = new UserService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserService;
}
