/**
 * Enhanced Messaging Loader System
 * Progressive loading, smart caching, virtual scrolling, and modern loading states
 * for Starlet Properties messaging system
 */

class MessagingLoader {
    constructor() {
        this.cache = new Map();
        this.loadingStates = new Map();
        this.virtualScrollConfig = {
            itemHeight: 80,
            bufferSize: 10,
            threshold: 100
        };
        this.progressiveLoading = {
            conversations: true,
            messages: true,
            userDetails: true
        };
        this.retryConfig = {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2
        };
    }

    // ===== PROGRESSIVE LOADING STATES =====

    /**
     * Show progressive loading state for conversations
     */
    showConversationsLoading(container) {
        if (!container) return;
        
        const skeletonHTML = `
            <div class="conversations-loading">
                ${Array.from({length: 8}, (_, i) => `
                    <div class="conversation-skeleton" data-index="${i}">
                        <div class="skeleton-avatar loading-skeleton"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-name loading-skeleton"></div>
                            <div class="skeleton-preview loading-skeleton"></div>
                        </div>
                        <div class="skeleton-time loading-skeleton"></div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = skeletonHTML;
        this.animateSkeletons(container);
    }

    /**
     * Show progressive loading state for messages
     */
    showMessagesLoading(container, chatId) {
        if (!container) return;
        
        // Check cache first
        const cachedMessages = this.cache.get(`messages_${chatId}`);
        if (cachedMessages && cachedMessages.length > 0) {
            this.renderCachedMessages(container, cachedMessages);
            return;
        }

        const skeletonHTML = `
            <div class="messages-loading">
                <div class="loading-header">
                    <div class="star-loading">
                        <div class="star"></div>
                        <div class="star"></div>
                        <div class="star"></div>
                    </div>
                    <div class="loading-text">Loading conversation...</div>
                </div>
                <div class="messages-skeleton">
                    ${Array.from({length: 6}, (_, i) => `
                        <div class="message-skeleton ${i % 2 === 0 ? 'sent' : 'received'}" data-index="${i}">
                            <div class="skeleton-bubble loading-skeleton"></div>
                            <div class="skeleton-time loading-skeleton"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = skeletonHTML;
        this.animateSkeletons(container);
    }

    /**
     * Show progressive loading state for user details
     */
    showUserDetailsLoading(container) {
        if (!container) return;
        
        const skeletonHTML = `
            <div class="user-details-loading">
                <div class="skeleton-avatar-large loading-skeleton"></div>
                <div class="skeleton-user-info">
                    <div class="skeleton-name loading-skeleton"></div>
                    <div class="skeleton-status loading-skeleton"></div>
                </div>
            </div>
        `;
        
        container.innerHTML = skeletonHTML;
        this.animateSkeletons(container);
    }

    // ===== SMART CACHING SYSTEM =====

    /**
     * Cache conversations with metadata
     */
    cacheConversations(conversations) {
        const cacheKey = 'conversations';
        const cacheData = {
            data: conversations,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        this.cache.set(cacheKey, cacheData);
        this.persistToLocalStorage(cacheKey, cacheData);
    }

    /**
     * Cache messages for a specific chat
     */
    cacheMessages(chatId, messages) {
        const cacheKey = `messages_${chatId}`;
        const cacheData = {
            data: messages,
            timestamp: Date.now(),
            version: '1.0'
        };
        
        this.cache.set(cacheKey, cacheData);
        this.persistToLocalStorage(cacheKey, cacheData);
    }

    /**
     * Get cached data with validation
     */
    getCachedData(key, maxAge = 5 * 60 * 1000) { // 5 minutes default
        const cached = this.cache.get(key) || this.getFromLocalStorage(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age > maxAge) {
            this.cache.delete(key);
            this.removeFromLocalStorage(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * Persist cache to localStorage
     */
    persistToLocalStorage(key, data) {
        try {
            localStorage.setItem(`starlet_messaging_${key}`, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to persist cache to localStorage:', error);
        }
    }

    /**
     * Get data from localStorage
     */
    getFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(`starlet_messaging_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn('Failed to get data from localStorage:', error);
            return null;
        }
    }

    /**
     * Remove data from localStorage
     */
    removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(`starlet_messaging_${key}`);
        } catch (error) {
            console.warn('Failed to remove data from localStorage:', error);
        }
    }

    // ===== VIRTUAL SCROLLING =====

    /**
     * Initialize virtual scrolling for messages
     */
    initVirtualScrolling(container, messages, itemHeight = 80) {
        if (!container || !messages || messages.length === 0) return;
        
        const containerHeight = container.clientHeight;
        const visibleItems = Math.ceil(containerHeight / itemHeight);
        const bufferSize = Math.min(10, Math.floor(visibleItems / 2));
        
        let startIndex = 0;
        let endIndex = Math.min(visibleItems + bufferSize, messages.length);
        
        const renderVisibleMessages = () => {
            const visibleMessages = messages.slice(startIndex, endIndex);
            const offsetY = startIndex * itemHeight;
            
            container.innerHTML = `
                <div class="virtual-scroll-spacer" style="height: ${offsetY}px;"></div>
                ${visibleMessages.map(message => this.renderMessage(message)).join('')}
                <div class="virtual-scroll-spacer" style="height: ${(messages.length - endIndex) * itemHeight}px;"></div>
            `;
        };
        
        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const newStartIndex = Math.floor(scrollTop / itemHeight);
            const newEndIndex = Math.min(newStartIndex + visibleItems + bufferSize, messages.length);
            
            if (newStartIndex !== startIndex || newEndIndex !== endIndex) {
                startIndex = newStartIndex;
                endIndex = newEndIndex;
                renderVisibleMessages();
            }
        };
        
        container.addEventListener('scroll', handleScroll);
        renderVisibleMessages();
        
        // Store virtual scroll data for cleanup
        container.virtualScrollData = {
            handleScroll,
            messages,
            itemHeight
        };
    }

    /**
     * Clean up virtual scrolling
     */
    cleanupVirtualScrolling(container) {
        if (container.virtualScrollData) {
            container.removeEventListener('scroll', container.virtualScrollData.handleScroll);
            delete container.virtualScrollData;
        }
    }

    // ===== OPTIMISTIC UPDATES =====

    /**
     * Add optimistic message to UI
     */
    addOptimisticMessage(container, message) {
        if (!container) {
            console.error('Container is null or undefined in addOptimisticMessage');
            return null;
        }
        
        const messageHtml = this.renderMessage({
            ...message,
            id: `temp_${Date.now()}`,
            status: 'sending',
            timestamp: new Date()
        });
        
        // Convert HTML string to DOM element
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = messageHtml;
        const messageElement = tempDiv.firstElementChild;
        
        if (!messageElement) {
            console.error('Failed to create message element from HTML');
            return null;
        }
        
        container.appendChild(messageElement);
        container.scrollTop = container.scrollHeight;
        
        return messageElement;
    }

    /**
     * Update message status
     */
    updateMessageStatus(messageId, status) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const statusElement = messageElement.querySelector('.message-status');
            if (statusElement) {
                statusElement.textContent = status;
                statusElement.className = `message-status ${status}`;
            }
        }
    }

    // ===== ERROR HANDLING & RETRY =====

    /**
     * Retry function with exponential backoff
     */
    async retryWithBackoff(operation, retryCount = 0) {
        try {
            return await operation();
        } catch (error) {
            if (retryCount >= this.retryConfig.maxRetries) {
                throw error;
            }
            
            const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.retryWithBackoff(operation, retryCount + 1);
        }
    }

    /**
     * Show error state with retry option
     */
    showErrorState(container, error, retryFunction) {
        const errorHTML = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>
                <div class="error-message">
                    <h5>Something went wrong</h5>
                    <p>${error.message || 'Failed to load content'}</p>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary btn-sm" onclick="this.retryFunction()">
                        <i class="bi bi-arrow-clockwise"></i> Try Again
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="this.refreshPage()">
                        <i class="bi bi-arrow-clockwise"></i> Refresh Page
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = errorHTML;
        
        // Bind retry function
        const retryBtn = container.querySelector('.btn-primary');
        if (retryBtn && retryFunction) {
            retryBtn.onclick = retryFunction;
        }
    }

    // ===== ANIMATION HELPERS =====

    /**
     * Animate skeleton loading elements
     */
    animateSkeletons(container) {
        const skeletons = container.querySelectorAll('.loading-skeleton');
        skeletons.forEach((skeleton, index) => {
            skeleton.style.animationDelay = `${index * 0.1}s`;
        });
    }

    /**
     * Render cached messages
     */
    renderCachedMessages(container, messages) {
        if (!messages || messages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-chat-dots"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = messages.map(message => this.renderMessage(message)).join('');
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Render a single message
     */
    renderMessage(message) {
        if (!window.currentUser || !window.currentUser.uid) {
            console.warn('Current user not available, using default message rendering');
            return `
                <div class="message received" data-message-id="${message.id}">
                    <div class="message-content">
                        ${message.content}
                        <div class="message-meta">
                            <span class="message-time">${this.formatTime(message.timestamp)}</span>
                            <span class="message-status ${message.status || 'sent'}">
                                ${this.getStatusIcon(message.status || 'sent')}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const isCurrentUser = message.senderId === window.currentUser.uid;
        const messageClass = isCurrentUser ? 'message sent' : 'message received';
        const statusClass = message.status || 'sent';
        
        return `
            <div class="${messageClass}" data-message-id="${message.id}">
                <div class="message-content">
                    ${message.content}
                    <div class="message-meta">
                        <span class="message-time">${this.formatTime(message.timestamp)}</span>
                        <span class="message-status ${statusClass}">
                            ${this.getStatusIcon(statusClass)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Format timestamp
     */
    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Get status icon
     */
    getStatusIcon(status) {
        switch (status) {
            case 'sending': return '<i class="bi bi-clock"></i>';
            case 'sent': return '<i class="bi bi-check"></i>';
            case 'delivered': return '<i class="bi bi-check-all"></i>';
            case 'read': return '<i class="bi bi-check-all text-primary"></i>';
            case 'error': return '<i class="bi bi-exclamation-circle text-danger"></i>';
            default: return '<i class="bi bi-check"></i>';
        }
    }

    /**
     * Refresh page
     */
    refreshPage() {
        window.location.reload();
    }

    // ===== UTILITY METHODS =====

    /**
     * Clear all caches
     */
    clearCache() {
        this.cache.clear();
        const keys = Object.keys(localStorage).filter(key => key.startsWith('starlet_messaging_'));
        keys.forEach(key => localStorage.removeItem(key));
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const stats = {
            memorySize: this.cache.size,
            localStorageSize: 0,
            totalSize: 0
        };
        
        const keys = Object.keys(localStorage).filter(key => key.startsWith('starlet_messaging_'));
        stats.localStorageSize = keys.length;
        stats.totalSize = stats.memorySize + stats.localStorageSize;
        
        return stats;
    }
}

// Initialize global messaging loader
window.MessagingLoader = new MessagingLoader();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessagingLoader;
}
