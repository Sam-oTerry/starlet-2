// Firebase Configuration for Starlet Properties
// This file initializes Firebase services for the application

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
  authDomain: "starlet-properties-41509.firebaseapp.com",
  projectId: "starlet-properties-41509",
  storageBucket: "starlet-properties-41509.appspot.com",
  messagingSenderId: "393372988481",
  appId: "1:393372988481:web:c92584d7408296457b02c0",
  measurementId: "G-F02K9SP07C"
};

// Wait for Firebase SDKs to be loaded and then initialize
function waitForFirebase() {
  if (typeof firebase !== 'undefined') {
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    // Initialize services
    initializeFirebaseServices();
  } else {
    // Retry after a short delay
    setTimeout(waitForFirebase, 100);
  }
}

// Initialize Firebase services
function initializeFirebaseServices() {
  if (typeof firebase !== 'undefined') {
    try {
      const db = firebase.firestore();
      const auth = firebase.auth();
      
      // Check if storage is available
      let storage;
      if (typeof firebase.storage === 'function') {
        storage = firebase.storage();
      } else {
        console.warn('Firebase Storage not available, file uploads will be disabled');
        storage = null;
      }

      // Make services globally available
      window.firebaseDB = db;
      window.firebaseAuth = auth;
      window.firebaseStorage = storage;

      // Enable offline persistence for Firestore with proper error handling
      try {
        db.enablePersistence({
          synchronizeTabs: true
        })
          .then(() => {
            console.log('Firestore persistence enabled successfully with multi-tab support.');
          })
          .catch((err) => {
            if (err.code == 'failed-precondition') {
              console.log('Multiple tabs detected, disabling persistence to avoid conflicts.');
            } else if (err.code == 'unimplemented') {
              console.log('The current browser does not support persistence.');
            } else {
              console.log('Persistence error:', err.message);
            }
          });
      } catch (error) {
        console.log('Could not enable persistence:', error.message);
      }

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase services:', error);
    }
  } else {
    setTimeout(initializeFirebaseServices, 100);
  }
}

// Start waiting for Firebase SDKs to load
waitForFirebase(); 