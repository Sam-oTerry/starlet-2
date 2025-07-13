// Remove Firebase config and initialization
// Use window.firebaseDB and window.firebaseAuth from firebase-config.js
let db = window.firebaseDB;

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

// --- Only require visible fields before submit ---
function updateRequiredAttributes() {
  // Remove required from all fields first
  form.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
  // Add required only to visible fields
  form.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.offsetParent !== null && el.hasAttribute('data-always-required')) {
      el.setAttribute('required', 'required');
    } else if (el.offsetParent !== null && el.getAttribute('data-always-required') === null && el.getAttribute('type') !== 'checkbox') {
      // Only set required if not a checkbox and not data-always-required
      if (el.getAttribute('name')) {
        el.setAttribute('required', 'required');
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

// Helper to safely get value or checked state
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}
function getChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

// --- Form Submission ---
form.addEventListener('submit', function(e) {
  updateRequiredAttributes();
  let listing = {};
  let valid = true;
  if (listingTypeEl.value === 'property') {
    // Validate required property fields
    valid = validateRequired([
      'propertyType','propertyTitle','propertyAskingPrice','propertyDistrict','propertyPriceType','propertyDescription'
    ]);
    const propertyType = getValue('propertyType');
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
    listing.propertyType = getValue('propertyType');
    listing.title = getValue('propertyTitle');
    listing.askingPrice = Number(getValue('propertyAskingPrice').replace(/,/g, ''));
    listing.location = { district: getValue('propertyDistrict') };
    listing.description = getValue('propertyDescription');
    listing.priceType = getValue('propertyPriceType');
    // House details
    if (["house_sale","house_rent","vacation_short_stay"].includes(listing.propertyType)) {
      listing.houseDetails = {
        subCategory: getValue('houseSubCategory'),
        bedrooms: Number(getValue('houseBedrooms')),
        bathrooms: Number(getValue('houseBathrooms')),
        totalArea: Number(getValue('houseTotalArea')),
        plotSize: {
          width: Number(getValue('housePlotWidth')),
          length: Number(getValue('housePlotLength')),
          acres: Number(getValue('housePlotAcres')),
          hectares: Number(getValue('housePlotHectares'))
        },
        furnishingStatus: getValue('houseFurnishingStatus'),
        condition: getValue('houseCondition')
      };
    }
    // Land details
    if (["land_sale","land_rent"].includes(listing.propertyType)) {
      listing.landDetails = {
        subCategory: getValue('landSubCategory'),
        plotSize: {
          acres: Number(getValue('landPlotAcres')),
          hectares: Number(getValue('landPlotHectares')),
          dimensions: {
            width: Number(getValue('landPlotWidth')),
            length: Number(getValue('landPlotLength'))
          }
        },
        topography: getValue('landTopography'),
        soilType: getValue('landSoilType'),
        currentUse: getValue('landCurrentUse')
      };
    }
    // Ownership details
    listing.ownershipDetails = {
      ownershipType: getValue('ownershipType'),
      titleStatus: getValue('titleStatus'),
      leaseYearsRemaining: Number(getValue('leaseYearsRemaining'))
    };
    // Amenities
    listing.amenities = {
      essentialUtilities: {
        electricity: getValue('amenityElectricity'),
        waterSupply: getValue('amenityWater'),
        toiletType: getValue('amenityToilet')
      },
      additionalFeatures: {
        security: Array.from(document.querySelectorAll('#amenitySecurityCheckboxes input[type=checkbox]:checked')).map(cb => cb.value),
        parking: getValue('amenityParking'),
        internetReady: getValue('amenityInternet'),
        backupPower: getValue('amenityBackup'),
        kitchen: getValue('amenityKitchen'),
        tiled: getChecked('amenityTiled')
      },
      roadAccess: getValue('amenityRoadAccess'),
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
      vehicleCategory: getValue('vehicleCategory'),
      subCategory: getValue('vehicleSubCategory'),
      make: getValue('vehicleMake'),
      model: getValue('vehicleModel'),
      year: Number(getValue('vehicleYear')),
      color: getValue('vehicleColor'),
      condition: getValue('vehicleCondition'),
      transmission: getValue('vehicleTransmission'),
      fuelType: getValue('vehicleFuelType'),
      mileage: Number(getValue('vehicleMileage'))
    };
    listing.title = getValue('vehicleTitle');
    listing.askingPrice = Number(getValue('vehicleAskingPrice').replace(/,/g, ''));
    listing.description = getValue('vehicleDescription');
    listing.priceType = getValue('vehiclePriceType');
  }
  listing.isOfficial = true;
  listing.officialStore = true;
  listing.status = 'pending';
  // Set createdBy to admin's UID and email if available
  let adminUser = (window.firebaseAuth && window.firebaseAuth.currentUser) ? window.firebaseAuth.currentUser : null;
  listing.createdBy = adminUser ? { uid: adminUser.uid, email: adminUser.email } : { uid: 'admin', email: 'admin@starlet.co.ug' };
  listing.createdAt = new Date();
  try {
    db.collection('listings').add(listing);
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
});

// Call this after DOMContentLoaded and after amenitiesSection is shown
// --- Init ---
document.addEventListener('DOMContentLoaded', function() {
  fetchVehicleMakesModels();
  fetchPropertyMeta();
  renderAmenityCheckboxes();
  initializeRequiredAttributes();
}); 