# Admin Authentication & Redirect System

## Overview

The Starlet Properties admin authentication system ensures that only authorized admin users can access admin pages and automatically redirects admin users to the appropriate dashboard.

## Admin User Configuration

### Admin Email Addresses
The system recognizes the following admin email addresses:
- `admin@starletproperties.ug`
- `admin@starlet.co.ug`

### Admin Role in Firestore
Admin users should have `role: 'admin'` in their Firestore user document.

## Authentication Flow

### 1. Login Page (`pages/auth/login.html`)

**Current Implementation:**
- ✅ Detects admin emails during login
- ✅ Checks Firestore role for admin access
- ✅ Automatically redirects admin users to `/pages/admin/dashboard.html`
- ✅ Respects return URLs but defaults to admin dashboard for admins
- ✅ Supports GitHub Pages deployment with base path detection

**Key Features:**
```javascript
// Admin email detection
const isAdminEmail = user.email && (
    user.email.toLowerCase() === 'admin@starletproperties.ug' ||
    user.email.toLowerCase() === 'admin@starlet.co.ug'
);

// Admin redirect logic
if (role === 'admin') {
    if (returnUrl) {
        window.location.href = returnUrl;
    } else {
        window.location.href = base + '/pages/admin/dashboard.html';
    }
    return;
}
```

### 2. Admin Pages Protection

**Enhanced Implementation:**
- ✅ All admin pages include `js/admin-auth-enhancement.js`
- ✅ Automatically enforces admin access on `/admin/` pages
- ✅ Redirects non-admin users to login page
- ✅ Shows access denied messages with redirect countdown

**Protected Pages:**
- `/pages/admin/dashboard.html`
- `/pages/admin/users.html`
- `/pages/admin/listings.html`
- `/pages/admin/messages.html`
- `/pages/admin/stores.html`
- `/pages/admin/analytics.html`
- `/pages/admin/reviews.html`
- `/pages/admin/settings.html`
- `/pages/admin/official-store.html`
- `/pages/admin/add-official-listing.html`

## Files Modified

### 1. Enhanced Authentication Script
**File:** `js/admin-auth-enhancement.js`
- Centralized admin authentication logic
- Automatic admin access enforcement
- Admin redirect from login page
- Consistent error handling

### 2. Login Page
**File:** `pages/auth/login.html`
- Added admin authentication enhancement script
- Existing admin redirect logic maintained
- Enhanced with automatic admin detection

### 3. Admin Pages
**Files:** All pages in `/pages/admin/`
- Added admin authentication enhancement script
- Automatic access enforcement
- Consistent admin protection

## How It Works

### 1. Admin Login Flow
1. User enters admin credentials on login page
2. System checks email against admin email list
3. System checks Firestore role for admin access
4. If admin, automatically redirects to admin dashboard
5. If not admin, redirects to appropriate user dashboard

### 2. Admin Page Access
1. User tries to access admin page
2. System checks authentication status
3. System verifies admin privileges
4. If admin, allows access
5. If not admin, shows access denied and redirects to login

### 3. Auto-Redirect from Login
1. Admin user visits login page while already authenticated
2. System detects admin status
3. Automatically redirects to admin dashboard
4. Shows welcome message during redirect

## Testing

### Test Page
**File:** `admin-test.html`
- Simple test page to verify admin authentication
- Shows current admin status
- Provides quick links to login and admin dashboard

### Manual Testing
1. Visit `admin-test.html` to check current admin status
2. Try accessing admin pages without admin privileges
3. Login with admin credentials and verify redirect
4. Test admin page access enforcement

## Security Features

### 1. Multiple Authentication Layers
- Firebase Auth for user authentication
- Admin email verification
- Firestore role verification
- Page-level access enforcement

### 2. Automatic Redirects
- Non-admin users redirected from admin pages
- Admin users redirected to appropriate dashboard
- Return URL handling for seamless navigation

### 3. Error Handling
- Graceful fallbacks for Firebase errors
- Clear error messages for users
- Logging for debugging

## Configuration

### Admin Emails
To add new admin emails, modify the `ADMIN_EMAILS` array in `js/admin-auth-enhancement.js`:

```javascript
const ADMIN_EMAILS = [
    'admin@starletproperties.ug',
    'admin@starlet.co.ug',
    'newadmin@starletproperties.ug'  // Add new admin emails here
];
```

### Redirect URLs
To modify redirect URLs, update the constants in `js/admin-auth-enhancement.js`:

```javascript
const ADMIN_CONFIG = {
    adminDashboardUrl: '/pages/admin/dashboard.html',
    loginUrl: '/pages/auth/login.html',
    homeUrl: '/index.html'
};
```

## Troubleshooting

### Common Issues

1. **Admin not redirected to dashboard**
   - Check if admin email is in the `ADMIN_EMAILS` array
   - Verify Firestore role is set to 'admin'
   - Check browser console for errors

2. **Non-admin can access admin pages**
   - Ensure `js/admin-auth-enhancement.js` is included in admin pages
   - Check if Firebase is properly initialized
   - Verify authentication state

3. **Redirect loops**
   - Check return URL validation logic
   - Ensure proper base path detection for GitHub Pages
   - Verify redirect URL construction

### Debug Mode
Enable debug logging by checking browser console for:
- `🔒 Enforcing admin access on: [page]`
- `✅ Admin access verified: [reason]`
- `❌ Access denied: [reason]`

## Future Enhancements

### Planned Improvements
1. **Session Management**
   - Admin session timeout
   - Remember admin login
   - Secure session storage

2. **Role-based Permissions**
   - Different admin roles (super admin, moderator, etc.)
   - Granular page access control
   - Feature-level permissions

3. **Audit Logging**
   - Admin action logging
   - Access attempt tracking
   - Security event monitoring

4. **Two-Factor Authentication**
   - SMS/Email verification for admin access
   - Enhanced security for admin accounts
   - Backup authentication methods

## Support

For issues with admin authentication:
1. Check browser console for error messages
2. Verify Firebase configuration
3. Test with `admin-test.html`
4. Review this documentation
5. Check admin user configuration in Firestore
