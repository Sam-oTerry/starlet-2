// js/admin.js
// Firestore config and admin utilities for Starlet Properties Admin

const firebaseConfig = {
  apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
  authDomain: "starlet-properties-41509.firebaseapp.com",
  projectId: "starlet-properties-41509",
  storageBucket: "starlet-properties-41509.appspot.com",
  messagingSenderId: "393372988481",
  appId: "1:393372988481:web:c92584d7408296457b02c0",
  measurementId: "G-F02K9SP07C"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();

// Utility: Show loading spinner in a container
function showLoading(container, message = "Loading...") {
  if (container) container.innerHTML = `<div class='text-center text-muted py-5'><div class='spinner-border text-primary'></div><div>${message}</div></div>`;
}

// Utility: Show error in a container
function showError(container, error) {
  if (container) container.innerHTML = `<div class='text-danger text-center py-5'>${error}</div>`;
}

// Utility: Show toast/alert
function showToast(message, type = 'success') {
  alert(message); // Replace with Bootstrap toast if desired
}

// Utility: Check if current user is admin (requires Firestore rules to enforce)
function requireAdminUser() {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(async user => {
      if (!user || user.isAnonymous) {
        window.location.href = '/login.html';
        return reject('Not logged in');
      }
      // Check custom claims or Firestore user doc for admin role
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists && userDoc.data().role === 'admin') {
        resolve(user);
      } else {
        alert('You do not have admin access.');
        window.location.href = '/';
        reject('Not admin');
      }
    });
  });
}

// Utility: Format date
function formatDate(ts) {
  if (!ts) return '';
  if (ts.toDate) ts = ts.toDate();
  return ts instanceof Date ? ts.toLocaleDateString() : ts;
}

// Utility: Format price
function formatPrice(price) {
  if (price === undefined || price === null) return 'N/A';
  return 'USh ' + Number(price).toLocaleString();
}

// Utility: Confirm action
function confirmAction(message) {
  return window.confirm(message);
}

// Expose utilities globally for use in inline event handlers
window.showLoading = showLoading;
window.showError = showError;
window.showToast = showToast;
window.requireAdminUser = requireAdminUser;
window.formatDate = formatDate;
window.formatPrice = formatPrice;
window.confirmAction = confirmAction;

// Logout functionality
function logout() {
  if (!window.confirm('Are you sure you want to log out?')) return;
  auth.signOut().then(() => {
    window.location.href = '/index.html';
  });
}
window.logout = logout;

// Enforce admin authentication
window.addEventListener('DOMContentLoaded', function() {
  // Attach logout handler to all .logout-link elements
  document.querySelectorAll('.logout-link').forEach(el => {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  });
  enforceAuth('admin').then(user => {
    // ... existing admin page logic ...
  });
}); 