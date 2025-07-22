// Firebase configuration for Starlet Properties
// Prevent redeclaration and multiple initialization

// Only declare config if not already declared
if (typeof firebaseConfig === 'undefined') {
  var firebaseConfig = {
    apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
    authDomain: "starlet-properties-41509.firebaseapp.com",
    projectId: "starlet-properties-41509",
    storageBucket: "starlet-properties-41509.appspot.com",
    messagingSenderId: "393372988481",
    appId: "1:393372988481:web:c92584d7408296457b02c0"
  };
}

// Initialize Firebase only if not already initialized
if (typeof firebase !== 'undefined' && (!firebase.apps || firebase.apps.length === 0)) {
  firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
  console.log('Firebase already initialized');
}
