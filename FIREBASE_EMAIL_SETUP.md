# Firebase Email Setup Guide

## Overview
This guide explains how to set up email functionality using Firebase Extensions for the Starlet Properties notification system.

## Option 1: Firebase Extensions (Recommended)

### 1. Install Firebase Extensions
1. Go to your Firebase Console
2. Navigate to Extensions
3. Search for "Trigger Email"
4. Install the extension

### 2. Configure the Extension
- **Collection path**: `mail` (this is what our code uses)
- **Email provider**: Choose your preferred provider (SendGrid, Mailgun, etc.)
- **SMTP connection**: Configure your email service credentials

### 3. Security Rules
Add these Firestore security rules for the `mail` collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /mail/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Option 2: Firebase Functions (Alternative)

If you prefer to use Firebase Functions instead of Extensions:

### 1. Create Firebase Functions
```bash
firebase init functions
```

### 2. Install Email Dependencies
```bash
cd functions
npm install nodemailer
```

### 3. Create Email Function
```javascript
// functions/index.js
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');

exports.sendEmail = functions.firestore
  .document('emailNotifications/{docId}')
  .onCreate(async (snap, context) => {
    const emailData = snap.data();
    
    // Configure your email transport
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // or your preferred service
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
      }
    });
    
    try {
      await transporter.sendMail({
        from: 'noreply@starletproperties.ug',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.body
      });
      
      // Update status to sent
      await snap.ref.update({
        status: 'sent',
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending email:', error);
      await snap.ref.update({
        status: 'failed',
        error: error.message
      });
    }
  });
```

## Email Service Configuration

### For SendGrid:
1. Create a SendGrid account
2. Get your API key
3. Configure the extension with your API key

### For Mailgun:
1. Create a Mailgun account
2. Get your API key and domain
3. Configure the extension with your credentials

### For Gmail:
1. Enable 2-factor authentication
2. Generate an app password
3. Use the app password in your configuration

## Testing the Email System

1. Create a test listing
2. Approve or reject it as an admin
3. Check the `mail` collection in Firestore
4. Verify emails are being sent

## Troubleshooting

### Common Issues:
1. **Permission denied**: Check Firestore security rules
2. **Email not sending**: Verify email service credentials
3. **Extension not working**: Check Firebase Extensions logs

### Debug Steps:
1. Check Firebase Console > Extensions > Trigger Email > Logs
2. Verify the `mail` collection is being populated
3. Test email credentials manually
4. Check Firestore security rules

## Security Considerations

1. **API Keys**: Never expose email service API keys in client-side code
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Email Validation**: Validate email addresses before sending
4. **Spam Prevention**: Follow email best practices to avoid spam filters

## Cost Considerations

- **Firebase Extensions**: May have usage-based costs
- **Email Service**: Most providers offer free tiers (e.g., SendGrid: 100 emails/day free)
- **Firebase Functions**: Pay per invocation if using Functions approach

## Next Steps

1. Set up your preferred email service
2. Configure Firebase Extensions
3. Test the notification system
4. Monitor email delivery rates
5. Set up email templates for better branding
