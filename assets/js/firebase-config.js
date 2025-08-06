// Firebase Configuration for Starlet Properties
// This file initializes Firebase services for the application

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
  authDomain: "starlet-properties-41509.firebaseapp.com",
  projectId: "starlet-properties-41509",
  storageBucket: "starlet-properties-41509.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize services
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Make services globally available
window.firebaseDB = db;
window.firebaseAuth = auth;
window.firebaseStorage = storage;

// Enable offline persistence for Firestore
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.log('The current browser does not support persistence.');
    }
  });

console.log('Firebase initialized successfully'); 