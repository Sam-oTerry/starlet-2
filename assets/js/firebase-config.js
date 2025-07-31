// Firebase configuration and initialization for Starlet Properties
const firebaseConfig = {
  apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
  authDomain: "starlet-properties-41509.firebaseapp.com",
  projectId: "starlet-properties-41509",
  storageBucket: "starlet-properties-41509.appspot.com",
  messagingSenderId: "393372988481",
  appId: "1:393372988481:web:c92584d7408296457b02c0",
  measurementId: "G-F02K9SP07C"
};

// Wait for Firebase SDK to load and initialize
function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded yet, retrying...');
    setTimeout(initializeFirebase, 100);
    return;
  }
  
  // Only initialize if not already initialized
  if (!window.firebaseAppInitialized) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      window.firebaseAuth = firebase.auth();
      window.firebaseDB = firebase.firestore();
      window.firebaseAppInitialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }
  
  // Initialize additional Firebase services if available
  if (firebase.storage && !window.firebaseStorage) {
    window.firebaseStorage = firebase.storage();
  }
  
  if (firebase.messaging && !window.firebaseMessaging) {
    try {
      window.firebaseMessaging = firebase.messaging();
    } catch (e) {
      console.warn('Firebase Messaging not available:', e);
    }
  }
}

// Start initialization
initializeFirebase(); 