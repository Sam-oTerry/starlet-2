// Firebase configuration for Starlet Properties
// Single initialization to prevent conflicts

(function() {
  // Only run if Firebase is available and not already initialized
  if (typeof firebase === 'undefined') {
    console.log('Firebase SDK not loaded yet');
    return;
  }
  
  if (firebase.apps && firebase.apps.length > 0) {
    console.log('Firebase already initialized');
    return;
  }
  
  // Initialize Firebase
  try {
    firebase.initializeApp({
      apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
      authDomain: "starlet-properties-41509.firebaseapp.com",
      projectId: "starlet-properties-41509",
      storageBucket: "starlet-properties-41509.appspot.com",
      messagingSenderId: "393372988481",
      appId: "1:393372988481:web:c92584d7408296457b02c0"
    });
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.log('Firebase initialization error:', error.message);
  }
})();
