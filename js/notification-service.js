// Notification Service for Starlet Properties
// Handles notifications for listing approvals, rejections, and admin alerts

class NotificationService {
  constructor() {
    this.db = window.firebaseDB;
    this.auth = window.firebaseAuth;
  }

  // Send notification to admin when there are pending listings
  async notifyAdminOfPendingListings() {
    try {
      if (!this.db) {
        console.error('Firebase not initialized');
        return;
      }

      // Get count of pending listings
      const pendingSnap = await this.db.collection('listings')
        .where('status', '==', 'pending')
        .get();

      if (pendingSnap.size === 0) return;

      // Get admin users
      const adminUsers = await this.getAdminUsers();
      
      for (const adminUser of adminUsers) {
        // Create notification in admin's notification collection
        await this.createNotification({
          userId: adminUser.uid,
          type: 'admin_pending_listings',
          title: 'Listings Pending Approval',
          body: `You have ${pendingSnap.size} listing${pendingSnap.size > 1 ? 's' : ''} waiting for approval.`,
          data: {
            pendingCount: pendingSnap.size,
            actionUrl: '/pages/admin/listings.html?status=pending'
          },
          priority: 'high'
        });

        // Send email notification if admin has email
        if (adminUser.email) {
          await this.sendEmailNotification({
            to: adminUser.email,
            subject: `Starlet Properties - ${pendingSnap.size} Listing${pendingSnap.size > 1 ? 's' : ''} Pending Approval`,
            body: this.generatePendingListingsEmail(pendingSnap.size),
            type: 'admin_pending_listings'
          });
        }
      }

      console.log(`Notified ${adminUsers.length} admin(s) about ${pendingSnap.size} pending listings`);
    } catch (error) {
      console.error('Error notifying admin of pending listings:', error);
    }
  }

  // Send notification to user when their listing is approved
  async notifyUserOfApproval(listingId, listingData) {
    try {
      if (!this.db || !listingData.createdBy) {
        console.error('Missing required data for approval notification');
        return;
      }

      const userId = listingData.createdBy.uid || listingData.createdBy;
      const userEmail = listingData.createdBy.email;

      // Create notification for user
      await this.createNotification({
        userId: userId,
        type: 'listing_approved',
        title: 'Listing Approved! 🎉',
        body: `Your listing "${listingData.title}" has been approved and is now live on Starlet Properties.`,
        data: {
          listingId: listingId,
          listingTitle: listingData.title,
          finalPrice: listingData.finalPrice,
          actionUrl: `/pages/user/my-listings.html`
        },
        priority: 'high'
      });

      // Send email notification
      if (userEmail) {
        await this.sendEmailNotification({
          to: userEmail,
          subject: 'Starlet Properties - Your Listing Has Been Approved!',
          body: this.generateApprovalEmail(listingData),
          type: 'listing_approved'
        });
      }

      console.log(`Notified user ${userId} of listing approval`);
    } catch (error) {
      console.error('Error notifying user of approval:', error);
    }
  }

  // Send notification to user when their listing is rejected
  async notifyUserOfRejection(listingId, listingData, rejectionReason = '') {
    try {
      if (!this.db || !listingData.createdBy) {
        console.error('Missing required data for rejection notification');
        return;
      }

      const userId = listingData.createdBy.uid || listingData.createdBy;
      const userEmail = listingData.createdBy.email;

      // Create notification for user
      await this.createNotification({
        userId: userId,
        type: 'listing_rejected',
        title: 'Listing Update Required',
        body: `Your listing "${listingData.title}" needs some updates before it can be approved.`,
        data: {
          listingId: listingId,
          listingTitle: listingData.title,
          rejectionReason: rejectionReason,
          actionUrl: `/pages/user/my-listings.html`
        },
        priority: 'medium'
      });

      // Send email notification
      if (userEmail) {
        await this.sendEmailNotification({
          to: userEmail,
          subject: 'Starlet Properties - Listing Update Required',
          body: this.generateRejectionEmail(listingData, rejectionReason),
          type: 'listing_rejected'
        });
      }

      console.log(`Notified user ${userId} of listing rejection`);
    } catch (error) {
      console.error('Error notifying user of rejection:', error);
    }
  }

  // Get all admin users
  async getAdminUsers() {
    try {
      const adminSnap = await this.db.collection('users')
        .where('role', '==', 'admin')
        .get();

      const adminUsers = [];
      adminSnap.forEach(doc => {
        adminUsers.push({
          uid: doc.id,
          ...doc.data()
        });
      });

      // Also include hardcoded admin emails
      const hardcodedAdmins = [
        'admin@starletproperties.ug',
        'admin@starlet.co.ug'
      ];

      for (const email of hardcodedAdmins) {
        try {
          const userRecord = await this.auth.getUserByEmail(email);
          if (userRecord) {
            adminUsers.push({
              uid: userRecord.uid,
              email: email,
              role: 'admin'
            });
          }
        } catch (error) {
          console.log(`Admin user ${email} not found:`, error.message);
        }
      }

      return adminUsers;
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  // Create notification in Firestore
  async createNotification(notificationData) {
    try {
      const notification = {
        ...notificationData,
        createdAt: this.db.FieldValue.serverTimestamp(),
        read: false,
        id: this.generateNotificationId()
      };

      await this.db.collection('users')
        .doc(notificationData.userId)
        .collection('notifications')
        .doc(notification.id)
        .set(notification);

      return notification.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send email notification using Firebase Extensions
  async sendEmailNotification(emailData) {
    try {
      // Use Firebase Extensions "Trigger Email" collection
      // This will automatically trigger email sending when a document is added
      await this.db.collection('mail').add({
        to: emailData.to,
        message: {
          subject: emailData.subject,
          html: emailData.body
        },
        // Optional: Add metadata for tracking
        metadata: {
          type: emailData.type,
          createdAt: this.db.FieldValue.serverTimestamp()
        }
      });

      console.log(`Email notification sent to ${emailData.to}`);
    } catch (error) {
      console.error('Error sending email notification:', error);
      
      // Fallback: Store in emailNotifications collection for manual processing
      try {
        await this.db.collection('emailNotifications').add({
          ...emailData,
          createdAt: this.db.FieldValue.serverTimestamp(),
          status: 'failed',
          error: error.message,
          attempts: 1
        });
      } catch (fallbackError) {
        console.error('Error storing failed email notification:', fallbackError);
      }
    }
  }

  // Generate unique notification ID
  generateNotificationId() {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate email content for pending listings
  generatePendingListingsEmail(pendingCount) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Starlet Properties - Admin Alert</h2>
        <p>Hello Admin,</p>
        <p>You have <strong>${pendingCount} listing${pendingCount > 1 ? 's' : ''}</strong> waiting for approval in the Starlet Properties system.</p>
        <p>Please log in to the admin panel to review and approve these listings.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Action Required:</strong></p>
          <p style="margin: 10px 0 0 0;">Review and approve pending listings</p>
        </div>
        <p>Best regards,<br>Starlet Properties Team</p>
      </div>
    `;
  }

  // Generate email content for approved listings
  generateApprovalEmail(listingData) {
    const price = listingData.finalPrice || listingData.askingPrice || listingData.price;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">🎉 Your Listing Has Been Approved!</h2>
        <p>Congratulations! Your listing has been approved and is now live on Starlet Properties.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Listing Details:</h3>
          <p><strong>Title:</strong> ${listingData.title}</p>
          <p><strong>Type:</strong> ${this.getTypeLabel(listingData.listingType)}</p>
          <p><strong>Price:</strong> ${price ? price.toLocaleString() + ' UGX' : 'Contact for price'}</p>
          <p><strong>Status:</strong> <span style="color: #27ae60;">Approved</span></p>
        </div>
        <p>Your listing is now visible to potential buyers/renters. You can manage your listing from your dashboard.</p>
        <p>Best regards,<br>Starlet Properties Team</p>
      </div>
    `;
  }

  // Generate email content for rejected listings
  generateRejectionEmail(listingData, rejectionReason) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Listing Update Required</h2>
        <p>Your listing needs some updates before it can be approved and published.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Listing Details:</h3>
          <p><strong>Title:</strong> ${listingData.title}</p>
          <p><strong>Type:</strong> ${this.getTypeLabel(listingData.listingType)}</p>
          <p><strong>Status:</strong> <span style="color: #e74c3c;">Needs Updates</span></p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
        </div>
        <p>Please review your listing and make the necessary changes. You can edit your listing from your dashboard.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>Starlet Properties Team</p>
      </div>
    `;
  }

  // Get type label for listings
  getTypeLabel(listingType) {
    const types = {
      'property': 'Property',
      'vehicle': 'Vehicle',
      'house_sale': 'House for Sale',
      'house_rent': 'House for Rent',
      'land_sale': 'Land for Sale',
      'land_rent': 'Land for Rent',
      'vacation_short_stay': 'Vacation & Short Stay'
    };
    return types[listingType] || listingType || 'Unknown';
  }

  // Check for pending listings and notify admin (called periodically)
  async checkAndNotifyPendingListings() {
    try {
      const pendingSnap = await this.db.collection('listings')
        .where('status', '==', 'pending')
        .get();

      if (pendingSnap.size > 0) {
        // Check if we've already notified recently
        const lastNotification = await this.getLastAdminNotification('admin_pending_listings');
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        if (!lastNotification || lastNotification.createdAt.toDate() < oneHourAgo) {
          await this.notifyAdminOfPendingListings();
        }
      }
    } catch (error) {
      console.error('Error checking pending listings:', error);
    }
  }

  // Get last admin notification of specific type
  async getLastAdminNotification(type) {
    try {
      const adminUsers = await this.getAdminUsers();
      if (adminUsers.length === 0) return null;

      const lastNotifications = await Promise.all(
        adminUsers.map(async (admin) => {
          const notifSnap = await this.db.collection('users')
            .doc(admin.uid)
            .collection('notifications')
            .where('type', '==', type)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

          return notifSnap.empty ? null : notifSnap.docs[0].data();
        })
      );

      return lastNotifications.filter(n => n !== null)[0] || null;
    } catch (error) {
      console.error('Error getting last admin notification:', error);
      return null;
    }
  }
}

// Export the service
window.NotificationService = NotificationService;
