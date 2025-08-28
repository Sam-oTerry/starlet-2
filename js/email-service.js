// Email Service for Starlet Properties
// This service handles sending emails for notifications
// You can integrate this with SendGrid, Mailgun, AWS SES, or any other email service

class EmailService {
  constructor() {
    this.db = window.firebaseDB;
    this.config = {
      // Configure your email service here
      provider: 'sendgrid', // 'sendgrid', 'mailgun', 'ses', 'smtp'
      apiKey: '', // Add your API key
      fromEmail: 'noreply@starletproperties.ug',
      fromName: 'Starlet Properties',
      baseUrl: 'https://api.sendgrid.com/v3/mail/send' // Update for your provider
    };
  }

  // Send email using configured provider
  async sendEmail(emailData) {
    try {
      // Store email in Firestore for tracking
      const emailRecord = {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        type: emailData.type,
        status: 'pending',
        attempts: 0,
        createdAt: this.db.FieldValue.serverTimestamp(),
        sentAt: null,
        error: null
      };

      const emailId = await this.db.collection('emailNotifications').add(emailRecord);

      // Try to send the email
      const result = await this.sendEmailViaProvider(emailData);
      
      if (result.success) {
        // Update record as sent
        await this.db.collection('emailNotifications').doc(emailId.id).update({
          status: 'sent',
          sentAt: this.db.FieldValue.serverTimestamp(),
          attempts: 1
        });
        
        console.log(`Email sent successfully to ${emailData.to}`);
        return { success: true, emailId: emailId.id };
      } else {
        // Update record with error
        await this.db.collection('emailNotifications').doc(emailId.id).update({
          status: 'failed',
          error: result.error,
          attempts: 1
        });
        
        console.error(`Failed to send email to ${emailData.to}:`, result.error);
        return { success: false, error: result.error, emailId: emailId.id };
      }
    } catch (error) {
      console.error('Error in sendEmail:', error);
      return { success: false, error: error.message };
    }
  }

  // Send email via configured provider
  async sendEmailViaProvider(emailData) {
    switch (this.config.provider) {
      case 'sendgrid':
        return await this.sendViaSendGrid(emailData);
      case 'mailgun':
        return await this.sendViaMailgun(emailData);
      case 'ses':
        return await this.sendViaSES(emailData);
      case 'smtp':
        return await this.sendViaSMTP(emailData);
      default:
        return await this.sendViaSendGrid(emailData); // Default to SendGrid
    }
  }

  // SendGrid implementation
  async sendViaSendGrid(emailData) {
    try {
      const payload = {
        personalizations: [{
          to: [{ email: emailData.to }]
        }],
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject: emailData.subject,
        content: [{
          type: 'text/html',
          value: emailData.body
        }]
      };

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Mailgun implementation
  async sendViaMailgun(emailData) {
    try {
      const formData = new FormData();
      formData.append('from', `${this.config.fromName} <${this.config.fromEmail}>`);
      formData.append('to', emailData.to);
      formData.append('subject', emailData.subject);
      formData.append('html', emailData.body);

      const response = await fetch(`https://api.mailgun.net/v3/your-domain.mailgun.org/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.config.apiKey}`)}`
        },
        body: formData
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error: error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // AWS SES implementation
  async sendViaSES(emailData) {
    try {
      // This would require AWS SDK integration
      // For now, return a placeholder
      console.log('AWS SES integration not implemented yet');
      return { success: false, error: 'AWS SES integration not implemented' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // SMTP implementation
  async sendViaSMTP(emailData) {
    try {
      // This would require a server-side implementation
      // For now, return a placeholder
      console.log('SMTP integration not implemented yet');
      return { success: false, error: 'SMTP integration not implemented' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Process pending email notifications
  async processPendingEmails() {
    try {
      const pendingEmails = await this.db.collection('emailNotifications')
        .where('status', '==', 'pending')
        .where('attempts', '<', 3)
        .limit(10)
        .get();

      for (const doc of pendingEmails.docs) {
        const emailData = doc.data();
        
        // Try to send the email
        const result = await this.sendEmailViaProvider({
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          type: emailData.type
        });

        // Update the record
        await this.db.collection('emailNotifications').doc(doc.id).update({
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? this.db.FieldValue.serverTimestamp() : null,
          error: result.success ? null : result.error,
          attempts: emailData.attempts + 1
        });
      }
    } catch (error) {
      console.error('Error processing pending emails:', error);
    }
  }

  // Retry failed emails
  async retryFailedEmails() {
    try {
      const failedEmails = await this.db.collection('emailNotifications')
        .where('status', '==', 'failed')
        .where('attempts', '<', 3)
        .limit(5)
        .get();

      for (const doc of failedEmails.docs) {
        const emailData = doc.data();
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to send again
        const result = await this.sendEmailViaProvider({
          to: emailData.to,
          subject: emailData.subject,
          body: emailData.body,
          type: emailData.type
        });

        // Update the record
        await this.db.collection('emailNotifications').doc(doc.id).update({
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? this.db.FieldValue.serverTimestamp() : null,
          error: result.success ? null : result.error,
          attempts: emailData.attempts + 1
        });
      }
    } catch (error) {
      console.error('Error retrying failed emails:', error);
    }
  }

  // Get email statistics
  async getEmailStats() {
    try {
      const stats = {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0
      };

      const snapshots = await Promise.all([
        this.db.collection('emailNotifications').get(),
        this.db.collection('emailNotifications').where('status', '==', 'sent').get(),
        this.db.collection('emailNotifications').where('status', '==', 'failed').get(),
        this.db.collection('emailNotifications').where('status', '==', 'pending').get()
      ]);

      stats.total = snapshots[0].size;
      stats.sent = snapshots[1].size;
      stats.failed = snapshots[2].size;
      stats.pending = snapshots[3].size;

      return stats;
    } catch (error) {
      console.error('Error getting email stats:', error);
      return { total: 0, sent: 0, failed: 0, pending: 0 };
    }
  }
}

// Export the service
window.EmailService = EmailService;
