const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./starlet-properties-41509-firebase-adminsdk-fbsvc-f1712a2982.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importVehicleModels() {
  const makes = JSON.parse(fs.readFileSync('./vehicleMakesModels_starlet_properties(1).json', 'utf8'));
  for (const make of makes) {
    for (const model of make.models || []) {
      const docId = `${make.make}_${model}`.replace(/\s+/g, '_');
      const docData = {
        model: model,
        make: make.make,
        subCategory: (make.subCategory && make.subCategory[model]) || null,
        features: (make.features && make.features[model]) || [],
        fuelTypes: (make.fuelTypes && make.fuelTypes[model]) || [],
        years: make.years || []
      };
      await db.collection('vehicleModels').doc(docId).set(docData);
      console.log(`Imported vehicleModels/${docId}`);
    }
  }
  console.log('Vehicle models import complete!');
}

importVehicleModels().catch(console.error); 