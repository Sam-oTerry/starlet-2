const admin = require('firebase-admin');
const serviceAccount = require('./starlet-properties-41509-firebase-adminsdk-fbsvc-f1712a2982.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

async function checkAdminUser() {
  try {
    // Check if admin user exists in Firebase Auth
    const userRecord = await admin.auth().getUserByEmail('admin@starletproperties.ug');
    console.log('✅ Admin user exists in Firebase Auth:', userRecord.uid);
    
    // Check if admin user exists in Firestore
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ Admin user exists in Firestore');
      console.log('User data:', userData);
      
      if (userData.role === 'admin') {
        console.log('✅ Admin role is correctly set');
      } else {
        console.log('❌ Admin role is NOT set correctly');
        console.log('Current role:', userData.role);
        
        // Fix the admin role
        await db.collection('users').doc(userRecord.uid).update({
          role: 'admin',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Fixed admin role');
      }
    } else {
      console.log('❌ Admin user does NOT exist in Firestore');
      console.log('Creating admin user document...');
      
      // Create the admin user document
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
      console.log('✅ Created admin user document with admin role');
    }
    
    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log('❌ Admin user does not exist in Firebase Auth');
      console.log('Run: node create_admin_user.js');
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

checkAdminUser(); 