const admin = require('firebase-admin');
const serviceAccount = require('./starlet-properties-41509-firebase-adminsdk-fbsvc-f1712a2982.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

admin.auth().createUser({
  email: 'admin@starletproperties.ug',
  password: 'Admin@Starletproperties1'
}).then(user => {
  console.log('Created:', user.uid);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
}); 