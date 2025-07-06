const admin = require('firebase-admin');
const serviceAccount = require('./starlet-properties-41509-firebase-adminsdk-fbsvc-f1712a2982.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function setAdminRole(email) {
  try {
    // Find the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('Found user:', userRecord.uid);
    
    // Update the Firestore document to set admin role
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: userRecord.displayName || 'Admin User',
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      avatar: userRecord.photoURL || '',
      verified: true
    }, { merge: true });
    
    console.log('Successfully set admin role for:', email);
    console.log('User UID:', userRecord.uid);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'admin@starletproperties.ug';
console.log('Setting admin role for:', email);
setAdminRole(email); 