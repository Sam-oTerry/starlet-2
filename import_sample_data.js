const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./starlet-properties-41509-firebase-adminsdk-fbsvc-f1712a2982.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importCollection(collectionName, docs) {
  if (docs && docs.length > 0) {
    console.log(`Importing ${docs.length} docs into ${collectionName}...`);
    for (const doc of docs) {
      const id = doc._id || undefined;
      const data = { ...doc };
      delete data._id;
      try {
        await db.collection(collectionName).doc(id).set(data);
        console.log(`  Imported ${collectionName}/${id}`);
      } catch (err) {
        console.error(`  Error importing ${collectionName}/${id}:`, err);
      }
    }
  } else {
    // Create and delete a dummy doc to ensure collection exists
    const dummyRef = db.collection(collectionName).doc('_dummy');
    try {
      await dummyRef.set({ createdAt: new Date(), dummy: true });
      await dummyRef.delete();
      console.log(`  Initialized empty collection: ${collectionName}`);
    } catch (err) {
      console.error(`  Error initializing collection ${collectionName}:`, err);
    }
  }
}

async function main() {
  try {
    console.log('Reading sample_data.json...');
    const sampleData = JSON.parse(fs.readFileSync('./sample_data.json', 'utf8'));
    // List of all collections from your schema
    const allCollections = [
      'users', 'stores', 'storeReviews', 'agentReviews', 'storeSubscriptions', 'listings', 'deals', 'feeSettings', 'analytics', 'inspections', 'vehicleMakesModels', 'inquiries', 'resources'
    ];
    for (const collection of allCollections) {
      const docs = sampleData[collection] || [];
      await importCollection(collection, docs);
    }
    console.log('Sample data import complete!');
  } catch (err) {
    console.error('Error in import script:', err);
  }
}

main(); 