const admin = require('firebase-admin');
const serviceAccount = require('./starlet-properties-41509-firebase-adminsdk-fbsvc-f1712a2982.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function createAdminUser() {
  try {
    // Create the Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email: 'admin@starletproperties.ug',
      password: 'Admin@Starletproperties1',
      displayName: 'Admin User'
    });
    
    console.log('Created Firebase Auth user:', userRecord.uid);
    
    // Create the Firestore document with admin role
    await db.collection('users').doc(userRecord.uid).set({
      email: 'admin@starletproperties.ug',
      displayName: 'Admin User',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      firstName: 'Admin',
      lastName: 'User',
      username: 'admin',
      avatar: '',
      verified: true
    });
    
    console.log('Created Firestore admin document');
    console.log('Admin user created successfully!');
    console.log('Email: admin@starletproperties.ug');
    console.log('Password: Admin@Starletproperties1');
    console.log('UID:', userRecord.uid);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdminUser(); 