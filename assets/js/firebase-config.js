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

if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  window.firebaseAuth = firebase.auth();
  window.firebaseDB = firebase.firestore();
  window.firebaseAppInitialized = true;
  if (firebase.storage) {
    window.firebaseStorage = firebase.storage();
  }
  if (firebase.messaging) {
    try {
      window.firebaseMessaging = firebase.messaging();
    } catch (e) {
      console.warn('Firebase Messaging not available:', e);
    }
  }
  console.log('Firebase initialized successfully');
} else {
  console.error('Firebase SDK not loaded!');
} 