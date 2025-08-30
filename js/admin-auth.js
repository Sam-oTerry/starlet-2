// js/admin-auth.js
// Centralized Admin Authentication Utility for Starlet Properties

// Admin authentication configuration
const ADMIN_CONFIG = {
  // Admin email addresses (case-insensitive)
  adminEmails: [
    'admin@starletproperties.ug',
    'admin@starlet.co.ug'
  ],
  
  // Admin dashboard URL
  adminDashboardUrl: '/pages/admin/dashboard.html',
  
  // Login page URL
  loginUrl: '/pages/auth/login.html',
  
  // Home page URL
  homeUrl: '/index.html',
  
  // Redirect delay in milliseconds
  redirectDelay: 1000
};

// Initialize Firebase references
let db, auth;

function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
    return false;
  }
  
  // Check if Firebase is already initialized by firebase-config.js
  if (window.firebaseDB && window.firebaseAuth) {
    db = window.firebaseDB;
    auth = window.firebaseAuth;
    return true;
  } else if (firebase.apps && firebase.apps.length > 0) {
    db = firebase.firestore();
    auth = firebase.auth();
    return true;
  } else {
    return false;
  }
}

// Check if user is admin
async function isAdminUser(user) {
  if (!user || user.isAnonymous) {
    return false;
  }
  
  // Primary check: Admin email addresses
  const isAdminEmail = user.email && ADMIN_CONFIG.adminEmails.some(
    adminEmail => user.email.toLowerCase() === adminEmail.toLowerCase()
  );
  
  if (isAdminEmail) {
    console.log('✅ Admin access granted based on email:', user.email);
    return true;
  }
  
  // Secondary check: Firestore role
  try {
    if (!db) {
      console.warn('Firestore not initialized, cannot check Firestore role');
      return false;
    }
    
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data().role === 'admin') {
      console.log('✅ Admin access granted based on Firestore role');
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking Firestore admin role:', error);
  }
  
  return false;
}

// Require admin access - redirects non-admin users
async function requireAdminAccess() {
  return new Promise((resolve, reject) => {
    if (!initializeFirebase()) {
      reject('Firebase not initialized');
      return;
    }
    
    auth.onAuthStateChanged(async user => {
      if (!user || user.isAnonymous) {
        console.log('❌ User not logged in, redirecting to login');
        redirectToLogin();
        reject('Not logged in');
        return;
      }
      
      const isAdmin = await isAdminUser(user);
      if (isAdmin) {
        console.log('✅ Admin access verified');
        resolve(user);
      } else {
        console.log('❌ User is not admin, redirecting to home');
        showAccessDeniedMessage();
        setTimeout(() => {
          redirectToHome();
        }, ADMIN_CONFIG.redirectDelay);
        reject('Not admin');
      }
    });
  });
}

// Check admin status without redirecting
async function checkAdminStatus() {
  return new Promise((resolve) => {
    if (!initializeFirebase()) {
      resolve({ isAdmin: false, user: null, reason: 'Firebase not initialized' });
      return;
    }
    
    auth.onAuthStateChanged(async user => {
      if (!user || user.isAnonymous) {
        resolve({ isAdmin: false, user: null, reason: 'Not logged in' });
        return;
      }
      
      const isAdmin = await isAdminUser(user);
      resolve({ isAdmin, user, reason: isAdmin ? 'Admin access granted' : 'Not admin' });
    });
  });
}

// Redirect to admin dashboard
function redirectToAdminDashboard() {
  const base = getBasePath();
  window.location.href = base + ADMIN_CONFIG.adminDashboardUrl;
}

// Redirect to login page
function redirectToLogin() {
  const base = getBasePath();
  const currentUrl = encodeURIComponent(window.location.href);
  window.location.href = base + ADMIN_CONFIG.loginUrl + '?returnUrl=' + currentUrl;
}

// Redirect to home page
function redirectToHome() {
  const base = getBasePath();
  window.location.href = base + ADMIN_CONFIG.homeUrl;
}

// Get base path for GitHub Pages support
function getBasePath() {
  const path = window.location.pathname;
  return path.includes('/starlet-2/') ? '/starlet-2' : '';
}

// Show access denied message
function showAccessDeniedMessage() {
  // Create a modal or alert to show access denied
  const modal = document.createElement('div');
  modal.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
  modal.style.cssText = 'background: rgba(0,0,0,0.5); z-index: 9999;';
  modal.innerHTML = `
    <div class="card" style="max-width: 400px;">
      <div class="card-header bg-danger text-white">
        <h5 class="mb-0"><i class="bi bi-exclamation-triangle"></i> Access Denied</h5>
      </div>
      <div class="card-body">
        <p class="mb-0">You do not have admin access to this page. Redirecting to home page...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Remove modal after redirect
  setTimeout(() => {
    if (modal.parentNode) {
      modal.remove();
    }
  }, ADMIN_CONFIG.redirectDelay);
}

// Auto-enforce admin access on page load
function enforceAdminAccess() {
  requireAdminAccess()
    .then(user => {
      console.log('✅ Admin access enforced successfully');
      // Update UI to show admin info
      updateAdminUI(user);
    })
    .catch(error => {
      console.error('❌ Admin access enforcement failed:', error);
    });
}

// Update admin UI elements
function updateAdminUI(user) {
  // Update admin name in UI
  const adminNameElements = document.querySelectorAll('#adminName, .admin-name');
  adminNameElements.forEach(element => {
    if (user.displayName) {
      element.textContent = user.displayName;
    } else if (user.email) {
      element.textContent = user.email.split('@')[0];
    }
  });
  
  // Update admin email in UI
  const adminEmailElements = document.querySelectorAll('.admin-email');
  adminEmailElements.forEach(element => {
    if (user.email) {
      element.textContent = user.email;
    }
  });
  
  // Update admin avatar in UI
  const adminAvatarElements = document.querySelectorAll('.admin-avatar img');
  adminAvatarElements.forEach(element => {
    if (user.photoURL) {
      element.src = user.photoURL;
    }
  });
}

// Logout functionality for admin pages
function adminLogout() {
  if (!window.confirm('Are you sure you want to log out?')) {
    return;
  }
  
  if (auth) {
    auth.signOut().then(() => {
      console.log('✅ Admin logged out successfully');
      redirectToHome();
    }).catch(error => {
      console.error('❌ Logout error:', error);
      redirectToHome();
    });
  } else {
    redirectToHome();
  }
}

// Setup admin logout event listeners
function setupAdminLogout() {
  document.addEventListener('click', function(e) {
    if (e.target.closest('.logout-link') || e.target.closest('[data-admin-logout]')) {
      e.preventDefault();
      adminLogout();
    }
  });
}

// Initialize admin authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Setup logout functionality
  setupAdminLogout();
  
  // Auto-enforce admin access if we're on an admin page
  if (window.location.pathname.includes('/admin/')) {
    enforceAdminAccess();
  }
});

// Export functions for use in other scripts
window.AdminAuth = {
  requireAdminAccess,
  checkAdminStatus,
  isAdminUser,
  redirectToAdminDashboard,
  redirectToLogin,
  redirectToHome,
  enforceAdminAccess,
  adminLogout,
  ADMIN_CONFIG
};
