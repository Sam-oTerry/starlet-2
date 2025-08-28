# 🔥 Firebase Setup Complete Guide

## ✅ **What's Been Deployed**

### **1. Firestore Security Rules** ✅ DEPLOYED
- **File**: `firestore.rules`
- **Status**: Successfully deployed to `starlet-properties-41509`
- **Features**:
  - ✅ User authentication and authorization
  - ✅ Role-based access (user, agent, admin)
  - ✅ Listing management permissions
  - ✅ Conversation and messaging permissions
  - ✅ Notification system permissions
  - ✅ Admin-only collections (broadcasts, settings, analytics)

### **2. Storage Rules** ⚠️ NEEDS SETUP
- **File**: `storage.rules`
- **Status**: Ready to deploy (Storage not enabled yet)
- **Features**:
  - ✅ File upload permissions
  - ✅ Image/document/video validation
  - ✅ Size limits (10MB images, 50MB docs, 100MB videos)
  - ✅ User-specific upload paths

## 🚀 **Next Steps to Complete Setup**

### **Step 1: Enable Firebase Storage**
1. **Go to**: https://console.firebase.google.com/project/starlet-properties-41509/storage
2. **Click**: "Get Started"
3. **Choose**: "Start in test mode" (we'll secure it with our rules)
4. **Select**: A location (choose closest to Uganda)
5. **Click**: "Done"

### **Step 2: Deploy Storage Rules**
```bash
firebase deploy --only storage
```

### **Step 3: Fix Google Sign-In Issue**

The "Missing or insufficient permissions" error is likely due to OAuth configuration. Here's how to fix it:

#### **A. Enable Google Sign-In in Firebase Console**
1. **Go to**: https://console.firebase.google.com/project/starlet-properties-41509/authentication/providers
2. **Click**: "Google" provider
3. **Enable**: Google Sign-In
4. **Add**: Your authorized domain (`sam-oterry.github.io`)
5. **Save**: Changes

#### **B. Configure OAuth Consent Screen**
1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Select**: Your Firebase project
3. **Click**: "OAuth consent screen"
4. **Add**: `sam-oterry.github.io` to authorized domains
5. **Add**: Required scopes (email, profile)
6. **Save**: Changes

#### **C. Update OAuth Client ID**
1. **Go to**: https://console.cloud.google.com/apis/credentials
2. **Find**: Your OAuth 2.0 Client ID
3. **Add**: `https://sam-oterry.github.io` to authorized JavaScript origins
4. **Add**: `https://sam-oterry.github.io/**` to authorized redirect URIs
5. **Save**: Changes

### **Step 4: Test Google Sign-In**
1. **Clear**: Browser cache and cookies
2. **Visit**: https://sam-oterry.github.io/starlet-2/pages/auth/login.html
3. **Try**: Google Sign-In
4. **Check**: Browser console for any errors

## 🔧 **Firebase Rules Summary**

### **Firestore Rules Features**:
- ✅ **Users**: Can read own data, admins can read all
- ✅ **Listings**: Public read for approved, owners can manage own
- ✅ **Conversations**: Participants can access, admins can see all
- ✅ **Messages**: Secure messaging with participant validation
- ✅ **Notifications**: User-specific access
- ✅ **Admin Collections**: Admin-only access (broadcasts, settings, analytics)

### **Storage Rules Features**:
- ✅ **Profile Images**: Public read, owner write
- ✅ **Listing Media**: Public read, authenticated write
- ✅ **Chat Attachments**: Authenticated users only
- ✅ **File Validation**: Type and size restrictions
- ✅ **Admin Uploads**: Admin-only access

## 🛡️ **Security Features**

### **Authentication**:
- ✅ Google Sign-In enabled
- ✅ Role-based access control
- ✅ User data isolation
- ✅ Admin privilege escalation protection

### **Data Protection**:
- ✅ Input validation
- ✅ File type restrictions
- ✅ Size limits
- ✅ Owner-only modifications
- ✅ Admin oversight capabilities

### **Privacy**:
- ✅ User data privacy
- ✅ Conversation confidentiality
- ✅ Secure file uploads
- ✅ Audit trail for admin actions

## 📱 **Testing Checklist**

### **User Authentication**:
- [ ] Google Sign-In works
- [ ] User profile creation
- [ ] Role assignment
- [ ] Session management

### **Data Access**:
- [ ] Users can read approved listings
- [ ] Users can create own listings
- [ ] Users can manage own data
- [ ] Admins can access all data

### **Messaging**:
- [ ] Conversation creation
- [ ] Message sending
- [ ] Participant access
- [ ] Admin oversight

### **File Uploads** (after Storage setup):
- [ ] Profile image upload
- [ ] Listing image upload
- [ ] Document upload
- [ ] File validation

## 🚨 **Troubleshooting**

### **If Google Sign-In Still Fails**:
1. **Check**: Browser console for specific errors
2. **Verify**: OAuth client configuration
3. **Test**: In incognito/private mode
4. **Check**: Network connectivity
5. **Verify**: Firebase project settings

### **If Rules Deployment Fails**:
1. **Check**: Firebase CLI version
2. **Verify**: Project selection
3. **Check**: Authentication status
4. **Review**: Rule syntax

### **If Storage Uploads Fail**:
1. **Verify**: Storage is enabled
2. **Check**: Storage rules deployment
3. **Verify**: File type and size
4. **Check**: User authentication

## 📞 **Support**

If you encounter any issues:
1. **Check**: Browser console for errors
2. **Review**: Firebase console logs
3. **Test**: With different browsers
4. **Verify**: Network connectivity

## 🎉 **Success Indicators**

You'll know everything is working when:
- ✅ Google Sign-In completes without errors
- ✅ Users can create and manage listings
- ✅ Messaging system works properly
- ✅ File uploads function correctly
- ✅ Admin panel has full access
- ✅ No permission errors in console

---

**Last Updated**: $(date)
**Firebase Project**: starlet-properties-41509
**Status**: Firestore Rules Deployed ✅ | Storage Rules Ready ⚠️
