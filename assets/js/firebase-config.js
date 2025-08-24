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

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Wait for Firebase to be available
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

      // Enable offline persistence for Firestore using new cache settings
      db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
      });
      
      // Enable persistence with proper error handling
      db.enablePersistence()
        .catch((err) => {
          if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support persistence.');
          }
        });

      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase services:', error);
    }
  } else {
    setTimeout(initializeFirebaseServices, 100);
  }
}

// Start initialization
initializeFirebaseServices(); 