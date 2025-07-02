const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./starlet-properties-41509-firebase-adminsdk-fbsvc-f1712a2982.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importVehicleMakesModelsUpdated() {
  const makes = JSON.parse(fs.readFileSync('./vehicleMakesModels_starlet_properties(1).json', 'utf8'));
  for (const make of makes) {
    const modelsArray = (make.models || []).map(model => ({
      model: model,
      subCategory: (make.subCategory && make.subCategory[model]) || null,
      features: (make.features && make.features[model]) || [],
      fuelTypes: (make.fuelTypes && make.fuelTypes[model]) || [],
      years: make.years || [],
      transmissions: make.transmissions || [],
      conditions: make.conditions || [],
      colors: make.colors || [],
      createdAt: make.createdAt || new Date().toISOString(),
      updatedAt: make.updatedAt || new Date().toISOString()
    }));
    const docData = {
      make: make.make,
      models: modelsArray,
      years: make.years || [],
      transmissions: make.transmissions || [],
      conditions: make.conditions || [],
      colors: make.colors || [],
      createdAt: make.createdAt || new Date().toISOString(),
      updatedAt: make.updatedAt || new Date().toISOString()
    };
    await db.collection('vehicleMakesModels').doc(make.make).set(docData);
    console.log(`Imported vehicleMakesModels/${make.make}`);
  }
  console.log('VehicleMakesModels import (updated structure) complete!');
}

importVehicleMakesModelsUpdated().catch(console.error); 