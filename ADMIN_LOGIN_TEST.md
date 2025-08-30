# Admin Login Test Guide

## Test Scenarios

### 1. Admin Login with Email/Password
**Steps:**
1. Go to `/pages/auth/login.html`
2. Enter admin credentials:
   - Email: `admin@starletproperties.ug` or `admin@starlet.co.ug`
   - Password: `Admin@Starletproperties1`
3. Click "Sign In"

**Expected Result:**
- ✅ Loading spinner appears on button
- ✅ Success message: "Login Successful! Welcome Admin! Redirecting to admin dashboard..."
- ✅ Automatic redirect to `/pages/admin/dashboard.html`

### 2. Admin Login with Google
**Steps:**
1. Go to `/pages/auth/login.html`
2. Click "Sign in with Google"
3. Complete Google authentication with admin email

**Expected Result:**
- ✅ Loading spinner appears on Google button
- ✅ Success message appears
- ✅ Automatic redirect to admin dashboard

### 3. Admin Accessing Login Page While Already Authenticated
**Steps:**
1. Login as admin
2. Navigate to `/pages/auth/login.html` while still authenticated

**Expected Result:**
- ✅ Info message: "Welcome Admin! Redirecting to admin dashboard..."
- ✅ Automatic redirect to admin dashboard

### 4. Non-Admin User Trying to Access Admin Pages
**Steps:**
1. Login as regular user
2. Try to access `/pages/admin/dashboard.html`

**Expected Result:**
- ✅ Access denied message appears
- ✅ Automatic redirect to login page with returnUrl

### 5. Admin with Return URL
**Steps:**
1. Try to access admin page while not logged in
2. Get redirected to login with returnUrl
3. Login as admin

**Expected Result:**
- ✅ Admin gets redirected to the original admin page (returnUrl)

### 6. Non-Admin with Admin Return URL
**Steps:**
1. Try to access admin page while not logged in
2. Get redirected to login with returnUrl
3. Login as regular user

**Expected Result:**
- ✅ User gets redirected to appropriate user dashboard (not admin page)

## Debug Information

### Console Logs to Look For:
- `🔐 Attempting login for: [email]`
- `✅ Firebase Auth successful for: [email]`
- `✅ Admin access granted based on email: [email]`
- `✅ User data stored, role: admin`
- `Handling login redirect for role: admin`
- `Admin redirecting to admin dashboard`

### Error Logs to Watch For:
- `❌ Login failed: [error]`
- `❌ Google sign-in failed: [error]`

## Common Issues and Solutions

### Issue: Admin not redirected to dashboard
**Possible Causes:**
- Admin email not in the allowed list
- Firebase not initialized
- Network connectivity issues

**Solutions:**
- Check browser console for errors
- Verify admin email is correct
- Refresh page and try again

### Issue: Non-admin can access admin pages
**Possible Causes:**
- Admin enhancement script not loaded
- Firebase authentication state not properly checked

**Solutions:**
- Check if `js/admin-auth-enhancement.js` is included
- Verify Firebase is initialized
- Check browser console for errors

### Issue: Redirect loops
**Possible Causes:**
- Incorrect base path detection
- Invalid returnUrl handling

**Solutions:**
- Check URL construction in console logs
- Verify GitHub Pages base path detection
- Clear browser cache and try again

## Test Files

### Primary Test Page
- `admin-test.html` - Simple admin status checker

### Comprehensive Test Page
- `test-admin-auth.html` - Full admin authentication test suite

## Manual Testing Checklist

- [ ] Admin can login with email/password
- [ ] Admin can login with Google
- [ ] Admin gets redirected to dashboard after login
- [ ] Admin gets auto-redirected from login page when already authenticated
- [ ] Non-admin users cannot access admin pages
- [ ] Non-admin users get redirected to appropriate dashboard
- [ ] Return URL handling works correctly for admins
- [ ] Return URL handling works correctly for regular users
- [ ] Error messages display properly
- [ ] Loading states work correctly
- [ ] Console logs show proper debugging information

## Browser Compatibility

Test in the following browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- Admin authentication check should complete within 2-3 seconds
- Redirect should happen within 1-2 seconds after successful login
- Loading states should be responsive and not freeze the UI
