const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./starlet-properties-41509-firebase-adminsdk-fbsvc-f1712a2982.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importVehicleMakesWithSubcollections() {
  const makes = JSON.parse(fs.readFileSync('./vehicleMakesModels_starlet_properties(1).json', 'utf8'));
  for (const make of makes) {
    // Create the make document
    const makeDoc = {
      make: make.make,
      years: make.years || [],
      transmissions: make.transmissions || [],
      conditions: make.conditions || [],
      colors: make.colors || [],
      createdAt: make.createdAt || new Date().toISOString(),
      updatedAt: make.updatedAt || new Date().toISOString()
    };
    await db.collection('vehicleMakes').doc(make.make).set(makeDoc);
    console.log(`Created vehicleMakes/${make.make}`);
    // Create subcollection 'models' for each model
    for (const model of make.models || []) {
      const modelDoc = {
        model: model,
        make: make.make,
        subCategory: (make.subCategory && make.subCategory[model]) || null,
        features: (make.features && make.features[model]) || [],
        fuelTypes: (make.fuelTypes && make.fuelTypes[model]) || [],
        years: make.years || [],
        transmissions: make.transmissions || [],
        conditions: make.conditions || [],
        colors: make.colors || [],
        createdAt: make.createdAt || new Date().toISOString(),
        updatedAt: make.updatedAt || new Date().toISOString()
      };
      await db.collection('vehicleMakes').doc(make.make).collection('models').doc(model).set(modelDoc);
      console.log(`  Created vehicleMakes/${make.make}/models/${model}`);
    }
  }
  console.log('Vehicle makes with subcollections import complete!');
}

importVehicleMakesWithSubcollections().catch(console.error); 