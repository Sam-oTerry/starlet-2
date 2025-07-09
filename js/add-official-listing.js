const firebaseConfig = {
  apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
  authDomain: "starlet-properties-41509.firebaseapp.com",
  projectId: "starlet-properties-41509",
  storageBucket: "starlet-properties-41509.appspot.com",
  messagingSenderId: "393372988481",
  appId: "1:393372988481:web:c92584d7408296457b02c0",
  measurementId: "G-F02K9SP07C"
};
let db;
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
db = firebase.firestore();

const form = document.getElementById('addOfficialListingForm');
const listingTypeEl = document.getElementById('listingType');
const propertySection = document.getElementById('propertySection');
const vehicleSection = document.getElementById('vehicleSection');
const successMsg = document.getElementById('successMsg');

let vehicleMakesModels = [];
let propertyMeta = null;
const userAgentTier = 'Premium'; // Admin always premium

// --- Fetch Firestore Data ---
async function fetchVehicleMakesModels() {
  try {
    const snap = await db.collection('vehicleMakesModels').get();
    vehicleMakesModels = snap.docs.map(doc => doc.data());
  } catch (e) {
    vehicleMakesModels = [];
  }
}
async function fetchPropertyMeta() {
  try {
    const snap = await db.collection('propertyMeta').limit(1).get();
    if (!snap.empty) propertyMeta = snap.docs[0].data();
    else propertyMeta = null;
  } catch (e) {
    propertyMeta = null;
  }
}

// --- Populate Dropdowns ---
function populatePropertyTypeDropdown() {
  const el = document.getElementById('propertyType');
  if (!el) return;
  if (propertyMeta && propertyMeta.propertyTypes) {
    el.innerHTML = '<option value="">Select Property Type</option>' + propertyMeta.propertyTypes.map(pt => `<option value="${pt.value}">${pt.label}</option>`).join('');
  } else {
    el.innerHTML = '<option value="">Select Property Type</option>' +
      '<option value="house_sale">House for Sale</option>' +
      '<option value="house_rent">House for Rent</option>' +
      '<option value="land_sale">Land for Sale</option>' +
      '<option value="land_rent">Land for Rent</option>' +
      '<option value="vacation_short_stay">Vacation & Short Stay</option>';
  }
}
function populateHouseSubCategoryDropdown() {
  const el = document.getElementById('houseSubCategory');
  if (!el) return;
  if (propertyMeta && propertyMeta.houseSubCategories) {
    el.innerHTML = '<option value="">Select</option>' + propertyMeta.houseSubCategories.map(sc => `<option>${sc}</option>`).join('');
  } else {
    el.innerHTML = '<option value="">Select</option>' +
      '<option>Houses</option><option>Apartments</option><option>Condominiums</option><option>Townhouses</option><option>Villas</option><option>Single Rooms</option><option>Hostels</option><option>Serviced Apartments</option><option>Family Homes</option><option>Airbnbs</option><option>Cottages</option><option>Beach Houses</option><option>Lodges</option>';
  }
}
function populateLandSubCategoryDropdown() {
  const el = document.getElementById('landSubCategory');
  if (!el) return;
  if (propertyMeta && propertyMeta.landSubCategories) {
    el.innerHTML = '<option value="">Select</option>' + propertyMeta.landSubCategories.map(sc => `<option>${sc}</option>`).join('');
  } else {
    el.innerHTML = '<option value="">Select</option>' +
      '<option>Residential Land</option><option>Commercial Land</option><option>Agricultural Land</option><option>Industrial Land</option>';
  }
}
function populateVehicleCategories() {
  const el = document.getElementById('vehicleCategory');
  if (!el) return;
  el.length = 1;
  const allowedCategories = [
    'Cars', 'Motorcycles', 'Trucks & Lorries', 'Buses & Vans',
    'Heavy Machinery', 'Bicycles & E-bikes', 'Boats & Watercraft'
  ];
  allowedCategories.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    el.appendChild(opt);
  });
}
function populateVehicleSubCategoryDropdown(category) {
  const el = document.getElementById('vehicleSubCategory');
  if (!el) return;
  // Example: You can expand this with more detailed subcategories per category
  const subCategories = {
    'Cars': ['Sedans', 'SUVs', 'Pickups', 'Coupes', 'Hatchbacks'],
    'Motorcycles': ['Scooters', 'Sports Bikes', 'Cruisers', 'Off-road'],
    'Trucks & Lorries': ['Cargo Trucks', 'Dump Trucks', 'Box Trucks'],
    'Buses & Vans': ['Passenger Vans', 'Mini Buses', 'School Buses'],
    'Heavy Machinery': ['Tractors', 'Excavators', 'Loaders'],
    'Bicycles & E-bikes': ['Bicycles', 'E-bikes'],
    'Boats & Watercraft': ['Boats', 'Watercraft']
  };
  el.innerHTML = '<option value="">Select</option>' + (subCategories[category] || []).map(sc => `<option>${sc}</option>`).join('');
}
function populateVehicleMakeDropdown(category) {
  const el = document.getElementById('vehicleMake');
  if (!el) return;
  el.length = 1;
  const makes = vehicleMakesModels
    .filter(item => item.vehicleType && item.vehicleType.trim().toLowerCase() === category.trim().toLowerCase())
    .map(item => item.make)
    .filter((v, i, a) => v && a.indexOf(v) === i);
  makes.forEach(make => {
    const opt = document.createElement('option');
    opt.value = make;
    opt.textContent = make;
    el.appendChild(opt);
  });
}
function populateVehicleModelDropdown(category, make) {
  const el = document.getElementById('vehicleModel');
  if (!el) return;
  el.length = 1;
  const makeObj = vehicleMakesModels.find(
    item =>
      item.vehicleType &&
      item.make &&
      item.vehicleType.trim().toLowerCase() === category.trim().toLowerCase() &&
      item.make.trim().toLowerCase() === make.trim().toLowerCase()
  );
  if (makeObj && Array.isArray(makeObj.models)) {
    makeObj.models.forEach(model => {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = model;
      el.appendChild(opt);
    });
  }
}

// --- Dynamic Section Logic ---
listingTypeEl.addEventListener('change', function() {
  if (listingTypeEl.value === 'property') {
    propertySection.classList.remove('d-none');
    vehicleSection.classList.add('d-none');
    populatePropertyTypeDropdown();
    updateRequiredAttributes();
  } else if (listingTypeEl.value === 'vehicle') {
    vehicleSection.classList.remove('d-none');
    propertySection.classList.add('d-none');
    populateVehicleCategories();
    updateRequiredAttributes();
  } else {
    propertySection.classList.add('d-none');
    vehicleSection.classList.add('d-none');
    updateRequiredAttributes();
  }
});

// Property type logic
const propertyTypeEl = document.getElementById('propertyType');
const houseSubCategoryEl = document.getElementById('houseSubCategory');
const landSubCategoryEl = document.getElementById('landSubCategory');

if (propertyTypeEl) {
  let lastPropertyType = propertyTypeEl.value;
  propertyTypeEl.addEventListener('change', function() {
    const propertyType = propertyTypeEl.value;
    const houseDetailsSection = document.getElementById('houseDetailsSection');
    const landDetailsSection = document.getElementById('landDetailsSection');
    const ownershipDetailsSection = document.getElementById('ownershipDetailsSection');
    const amenitiesSection = document.getElementById('amenitiesSection');
    if (["house_sale","house_rent","vacation_short_stay"].includes(propertyType)) {
      houseDetailsSection.classList.remove('d-none');
      landDetailsSection.classList.add('d-none');
      // Only repopulate if propertyType actually changed
      if (propertyType !== lastPropertyType) {
        const prev = houseSubCategoryEl.value;
        populateHouseSubCategoryDropdown();
        if ([...houseSubCategoryEl.options].some(opt => opt.value === prev)) {
          houseSubCategoryEl.value = prev;
        }
      }
    } else if (["land_sale","land_rent"].includes(propertyType)) {
      landDetailsSection.classList.remove('d-none');
      houseDetailsSection.classList.add('d-none');
      if (propertyType !== lastPropertyType) {
        const prev = landSubCategoryEl.value;
        populateLandSubCategoryDropdown();
        if ([...landSubCategoryEl.options].some(opt => opt.value === prev)) {
          landSubCategoryEl.value = prev;
        }
      }
    } else {
      houseDetailsSection.classList.add('d-none');
      landDetailsSection.classList.add('d-none');
    }
    ownershipDetailsSection.classList.remove('d-none');
    amenitiesSection.classList.remove('d-none');
    lastPropertyType = propertyType;
    updateRequiredAttributes();
  });
}

// Vehicle category logic
const vehicleCategoryEl = document.getElementById('vehicleCategory');
const vehicleSubCategoryEl = document.getElementById('vehicleSubCategory');
const vehicleMakeEl = document.getElementById('vehicleMake');
const vehicleModelEl = document.getElementById('vehicleModel');

if (vehicleCategoryEl) {
  vehicleCategoryEl.addEventListener('change', function() {
    const vehicleCategory = vehicleCategoryEl.value;
    populateVehicleSubCategoryDropdown(vehicleCategory);
    populateVehicleMakeDropdown(vehicleCategory);
    if (vehicleModelEl) vehicleModelEl.length = 1;
    updateRequiredAttributes();
  });
}
if (vehicleMakeEl) {
  vehicleMakeEl.addEventListener('change', function() {
    const vehicleCategory = vehicleCategoryEl.value;
    const vehicleMake = vehicleMakeEl.value;
    populateVehicleModelDropdown(vehicleCategory, vehicleMake);
    updateRequiredAttributes();
  });
}

// --- Helper: Remove required from hidden fields before validation ---
function updateRequiredAttributes() {
  // For all form controls, if hidden, remove required
  document.querySelectorAll('#addOfficialListingForm [required]').forEach(el => {
    if (el.offsetParent === null || el.closest('.d-none')) {
      el.required = false;
    } else {
      // Only add required back if it was originally required
      const originalRequired = el.getAttribute('data-original-required');
      if (originalRequired === 'true' || originalRequired === null) {
        el.required = true;
      }
    }
  });
}

// --- Initialize required attributes ---
function initializeRequiredAttributes() {
  // Store original required state
  document.querySelectorAll('#addOfficialListingForm [required]').forEach(el => {
    el.setAttribute('data-original-required', 'true');
  });
  // Update based on current visibility
  updateRequiredAttributes();
}

// --- Validation Helper (updated) ---
function validateRequired(ids) {
  updateRequiredAttributes();
  let valid = true;
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.offsetParent !== null && !el.closest('.d-none') && !el.value) {
      el.classList.add('is-invalid');
      valid = false;
    } else if (el) {
      el.classList.remove('is-invalid');
    }
  });
  return valid;
}

// --- Checkbox rendering for amenities, security, features ---
// (Assume amenitiesSection, amenitySecurityCheckboxes, amenityNearbyCheckboxes already exist in HTML)
// If you want to dynamically render checkboxes, you can do so here:
function renderAmenityCheckboxes() {
  // Security
  const securityOptions = ['Gate', 'Guard', 'CCTV', 'Fence', 'None'];
  const securityContainer = document.getElementById('amenitySecurityCheckboxes');
  if (securityContainer) {
    securityContainer.innerHTML = '';
    securityOptions.forEach(opt => {
      const id = 'security_' + opt.replace(/\s+/g, '').toLowerCase();
      securityContainer.innerHTML += `<input class="form-check-input" type="checkbox" value="${opt}" id="${id}">
        <label class="form-check-label me-2" for="${id}">${opt}</label>`;
    });
  }
  // Nearby Amenities
  const nearbyOptions = ['Schools', 'Hospitals', 'Markets', 'Public Transport', 'None'];
  const nearbyContainer = document.getElementById('amenityNearbyCheckboxes');
  if (nearbyContainer) {
    nearbyContainer.innerHTML = '';
    nearbyOptions.forEach(opt => {
      const id = 'nearby_' + opt.replace(/\s+/g, '').toLowerCase();
      nearbyContainer.innerHTML += `<input class="form-check-input" type="checkbox" value="${opt}" id="${id}">
        <label class="form-check-label me-2" for="${id}">${opt}</label>`;
    });
  }
}

// --- Form Submission ---
form.onsubmit = async function(e) {
  e.preventDefault();
  // Update required attributes before validation
  updateRequiredAttributes();
  let listing = {};
  let valid = true;
  if (listingTypeEl.value === 'property') {
    // Validate required property fields
    valid = validateRequired([
      'propertyType','propertyTitle','propertyAskingPrice','propertyDistrict','propertyPriceType','propertyDescription'
    ]);
    const propertyType = document.getElementById('propertyType').value;
    if (["house_sale","house_rent","vacation_short_stay"].includes(propertyType)) {
      valid = validateRequired([
        'houseSubCategory','houseBedrooms','houseBathrooms','houseTotalArea','houseFurnishingStatus','houseCondition'
      ]) && valid;
    }
    if (["land_sale","land_rent"].includes(propertyType)) {
      valid = validateRequired([
        'landSubCategory','landTopography','landCurrentUse'
      ]) && valid;
    }
    valid = validateRequired(['ownershipType','titleStatus','amenityElectricity','amenityWater','amenityToilet']) && valid;
    if (!valid) return;
    // Build property listing object
    listing.listingType = 'property';
    listing.propertyType = document.getElementById('propertyType').value;
    listing.title = document.getElementById('propertyTitle').value;
    listing.askingPrice = Number(document.getElementById('propertyAskingPrice').value.replace(/,/g, ''));
    listing.location = { district: document.getElementById('propertyDistrict').value };
    listing.description = document.getElementById('propertyDescription').value;
    listing.priceType = document.getElementById('propertyPriceType').value;
    // House details
    if (["house_sale","house_rent","vacation_short_stay"].includes(listing.propertyType)) {
      listing.houseDetails = {
        subCategory: document.getElementById('houseSubCategory').value,
        bedrooms: Number(document.getElementById('houseBedrooms').value),
        bathrooms: Number(document.getElementById('houseBathrooms').value),
        totalArea: Number(document.getElementById('houseTotalArea').value),
        plotSize: {
          width: Number(document.getElementById('housePlotWidth').value),
          length: Number(document.getElementById('housePlotLength').value),
          acres: Number(document.getElementById('housePlotAcres').value),
          hectares: Number(document.getElementById('housePlotHectares').value)
        },
        furnishingStatus: document.getElementById('houseFurnishingStatus').value,
        condition: document.getElementById('houseCondition').value
      };
    }
    // Land details
    if (["land_sale","land_rent"].includes(listing.propertyType)) {
      listing.landDetails = {
        subCategory: document.getElementById('landSubCategory').value,
        plotSize: {
          acres: Number(document.getElementById('landPlotAcres').value),
          hectares: Number(document.getElementById('landPlotHectares').value),
          dimensions: {
            width: Number(document.getElementById('landPlotWidth').value),
            length: Number(document.getElementById('landPlotLength').value)
          }
        },
        topography: document.getElementById('landTopography').value,
        soilType: document.getElementById('landSoilType').value,
        currentUse: document.getElementById('landCurrentUse').value
      };
    }
    // Ownership details
    listing.ownershipDetails = {
      ownershipType: document.getElementById('ownershipType').value,
      titleStatus: document.getElementById('titleStatus').value,
      leaseYearsRemaining: Number(document.getElementById('leaseYearsRemaining').value)
    };
    // Amenities
    listing.amenities = {
      essentialUtilities: {
        electricity: document.getElementById('amenityElectricity').value,
        waterSupply: document.getElementById('amenityWater').value,
        toiletType: document.getElementById('amenityToilet').value
      },
      additionalFeatures: {
        security: Array.from(document.querySelectorAll('#amenitySecurityCheckboxes input[type=checkbox]:checked')).map(cb => cb.value),
        parking: document.getElementById('amenityParking').value,
        internetReady: document.getElementById('amenityInternet').value,
        backupPower: document.getElementById('amenityBackup').value,
        kitchen: document.getElementById('amenityKitchen').value,
        tiled: document.getElementById('amenityTiled').checked
      },
      roadAccess: document.getElementById('amenityRoadAccess').value,
      nearbyAmenities: Array.from(document.querySelectorAll('#amenityNearbyCheckboxes input[type=checkbox]:checked')).map(cb => cb.value)
    };
  } else if (listingTypeEl.value === 'vehicle') {
    // Validate required vehicle fields
    valid = validateRequired([
      'vehicleCategory','vehicleSubCategory','vehicleMake','vehicleModel','vehicleYear','vehicleColor','vehicleCondition','vehicleTransmission','vehicleFuelType','vehicleTitle','vehicleAskingPrice','vehicleDescription','vehiclePriceType'
    ]);
    if (!valid) return;
    // Build vehicle listing object
    listing.listingType = 'vehicle';
    listing.vehicleDetails = {
      vehicleCategory: document.getElementById('vehicleCategory').value,
      subCategory: document.getElementById('vehicleSubCategory').value,
      make: document.getElementById('vehicleMake').value,
      model: document.getElementById('vehicleModel').value,
      year: Number(document.getElementById('vehicleYear').value),
      color: document.getElementById('vehicleColor').value,
      condition: document.getElementById('vehicleCondition').value,
      transmission: document.getElementById('vehicleTransmission').value,
      fuelType: document.getElementById('vehicleFuelType').value,
      mileage: Number(document.getElementById('vehicleMileage').value)
    };
    listing.title = document.getElementById('vehicleTitle').value;
    listing.askingPrice = Number(document.getElementById('vehicleAskingPrice').value.replace(/,/g, ''));
    listing.description = document.getElementById('vehicleDescription').value;
    listing.priceType = document.getElementById('vehiclePriceType').value;
  }
  listing.isOfficial = true;
  listing.status = 'pending';
  listing.createdAt = new Date();
  try {
    await db.collection('listings').add(listing);
    form.reset();
    propertySection.classList.add('d-none');
    vehicleSection.classList.add('d-none');
    successMsg.textContent = 'Listing added successfully!';
    successMsg.classList.remove('d-none');
    setTimeout(() => successMsg.classList.add('d-none'), 4000);
  } catch (e) {
    successMsg.textContent = 'Error adding listing.';
    successMsg.classList.remove('d-none');
  }
};

// Call this after DOMContentLoaded and after amenitiesSection is shown
// --- Init ---
document.addEventListener('DOMContentLoaded', function() {
  fetchVehicleMakesModels();
  fetchPropertyMeta();
  renderAmenityCheckboxes();
  initializeRequiredAttributes();
}); 