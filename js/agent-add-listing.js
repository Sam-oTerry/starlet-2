// agent-add-listing.js
// Dynamic logic for Add Listing page (property/vehicle) for agents

// Use window.firebaseDB and window.firebaseAuth for db and auth
let db, auth, currentUser;
function waitForFirebaseReady(callback) {
  if (window.firebaseDB && window.firebaseAuth) {
    db = window.firebaseDB;
    auth = window.firebaseAuth;
    callback();
  } else {
    setTimeout(() => waitForFirebaseReady(callback), 100);
  }
}

let vehicleMakesModels = [];

// Add property-related enums/constants for property listing forms
const propertyTypes = [
  { value: 'house_sale', label: 'House for Sale' },
  { value: 'house_rent', label: 'House for Rent' },
  { value: 'land_sale', label: 'Land for Sale' },
  { value: 'land_rent', label: 'Land for Rent' },
  { value: 'vacation_short_stay', label: 'Vacation & Short Stay' }
];
const houseSubCategories = [
  'Houses', 'Apartments', 'Condominiums', 'Townhouses', 'Villas', 'Single Rooms', 'Hostels', 'Serviced Apartments', 'Family Homes', 'Airbnbs', 'Cottages', 'Beach Houses', 'Lodges'
];
const furnishingStatuses = [
  'Fully Furnished', 'Semi-Furnished', 'Unfurnished'
];
const houseConditions = [
  'New', 'Renovated', 'Needs Repair'
];
const ownershipTypes = [
  'Freehold', 'Leasehold', 'Customary', 'Private Mailo'
];
const titleStatuses = [
  'Registered', 'Unregistered', 'Processing'
];
const essentialElectricity = [
  'UMEME', 'Solar', 'Grid', 'None'
];
const essentialWater = [
  'Piped', 'Borehole', 'Water Tank', 'Nearby Source', 'None'
];
const essentialToilet = [
  'Flush', 'Pit Latrine', 'None'
];
const landSubCategories = [
  'Residential Land', 'Commercial Land', 'Agricultural Land', 'Industrial Land'
];
const landTopographies = [
  'Flat', 'Sloped', 'Hilly', 'Wetland'
];
const landCurrentUses = [
  'Vacant', 'Farmland', 'Bush', 'Developed'
];
const landSoilTypes = [
  'Clay', 'Loam', 'Sandy', 'Unknown'
];
const landRoadAccess = [
  'Tarmac', 'Murram', 'Footpath', 'None'
];

document.addEventListener('DOMContentLoaded', () => {
  waitForFirebaseReady(() => {
    enforceAgentAuth();
    fetchVehicleMakesModels().then(() => {
      setupListingTypeSwitcher();
      setupImageUpload();
      setupFormSubmission();
    });
  });
});

async function fetchVehicleMakesModels() {
  if (!db) return;
  try {
    const snap = await db.collection('vehicleMakesModels').get();
    vehicleMakesModels = snap.docs.map(doc => doc.data());
    // Debug: log all vehicleType values and the full array
    console.log('Loaded vehicleMakesModels:', vehicleMakesModels);
    const allTypes = Array.from(new Set(vehicleMakesModels.map(vm => vm.vehicleType)));
    console.log('All vehicleType values in data:', allTypes);
    // Debug: log all vehicleMakesModels with vehicleType 'Cars'
    const carsObjs = vehicleMakesModels.filter(vm => vm.vehicleType === 'Cars');
    console.log('vehicleMakesModels with vehicleType "Cars":', carsObjs);
    if (carsObjs.length > 0) {
      console.log('subCategory property of first Cars object:', carsObjs[0].subCategory);
    }
  } catch (e) {
    vehicleMakesModels = [];
  }
}

function enforceAgentAuth() {
  if (!auth) return;
  auth.onAuthStateChanged(user => {
    if (!user) {
      window.location.href = '../auth/login.html';
      return;
    }
    currentUser = {
      id: user.uid,
      name: user.displayName || user.email || 'Agent',
      avatar: user.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg',
      email: user.email
    };
  });
}

function setupListingTypeSwitcher() {
  const listingType = document.getElementById('listingType');
  const dynamicFields = document.getElementById('dynamicFields');
  if (!listingType || !dynamicFields) return;
  listingType.addEventListener('change', function() {
    console.log('listingType change', this.value);
    if (this.value === 'property') {
      dynamicFields.innerHTML = propertyFieldsHTML();
      setupImageUpload();
      setupPropertyTypeFields();
    } else if (this.value === 'vehicle') {
      dynamicFields.innerHTML = vehicleFieldsHTML();
      setupImageUpload();
      setupMakeModelDropdowns();
    } else {
      dynamicFields.innerHTML = '';
    }
  });
}

function setupMakeModelDropdowns() {
  const categorySelect = document.getElementById('vehicleCategory');
  const subCategorySelect = document.getElementById('vehicleSubCategory');
  const makeSelect = document.getElementById('vehicleMake');
  const modelSelect = document.getElementById('vehicleModel');
  if (!categorySelect || !makeSelect || !modelSelect || !subCategorySelect) return;

  // Populate Subcategory by Category
  categorySelect.addEventListener('change', function() {
    const selectedCategory = this.value;
    console.log('Selected category value:', selectedCategory);
    // Get all unique subcategories for this category
    const filteredMakes = vehicleMakesModels.filter(vm => vm.vehicleType === selectedCategory);
    console.log('Filtered makes/models for category:', filteredMakes);
    const subCatSet = new Set();
    filteredMakes.forEach(vm => {
      if (Array.isArray(vm.models)) {
        vm.models.forEach(modelObj => {
          if (modelObj.subCategory) subCatSet.add(modelObj.subCategory);
        });
      }
    });
    console.log('Subcategories found:', Array.from(subCatSet));
    subCategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
    Array.from(subCatSet).forEach(subCat => {
      const opt = document.createElement('option');
      opt.value = subCat;
      opt.textContent = subCat;
      subCategorySelect.appendChild(opt);
    });
    makeSelect.innerHTML = '<option value="">Select Make</option>';
    modelSelect.innerHTML = '<option value="">Select Model</option>';
  });

  // Populate Make by Category + Subcategory
  subCategorySelect.addEventListener('change', function() {
    const selectedCategory = categorySelect.value;
    const selectedSubCat = this.value;
    // Get all makes that have at least one model in this category and subcategory
    const makes = vehicleMakesModels.filter(vm => {
      if (vm.vehicleType !== selectedCategory) return false;
      if (!vm.subCategory) return false;
      // Check if any model maps to this subcategory
      return Object.values(vm.subCategory).includes(selectedSubCat);
    });
    makeSelect.innerHTML = '<option value="">Select Make</option>';
    makes.forEach(vm => {
      const opt = document.createElement('option');
      opt.value = vm.make;
      opt.textContent = vm.make;
      makeSelect.appendChild(opt);
    });
    modelSelect.innerHTML = '<option value="">Select Model</option>';
  });

  // Populate Model by Category + Subcategory + Make
  makeSelect.addEventListener('change', function() {
    const selectedCategory = categorySelect.value;
    const selectedSubCat = subCategorySelect.value;
    const selectedMake = this.value;
    // Find the make object
    const makeObj = vehicleMakesModels.find(vm => vm.make === selectedMake && vm.vehicleType === selectedCategory);
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    if (makeObj && Array.isArray(makeObj.models) && makeObj.subCategory) {
      makeObj.models.forEach(model => {
        if (makeObj.subCategory[model] === selectedSubCat) {
          const opt = document.createElement('option');
          opt.value = model;
          opt.textContent = model;
          modelSelect.appendChild(opt);
        }
      });
    }
  });
}

function setupPropertyTypeFields() {
  const propertyType = document.getElementById('propertyType');
  const detailsFields = document.getElementById('propertyDetailsFields');
  if (!propertyType || !detailsFields) return;
  propertyType.addEventListener('change', function() {
    const type = this.value;
    if (['house_sale', 'house_rent', 'vacation_short_stay'].includes(type)) {
      detailsFields.innerHTML = houseDetailsHTML();
      setupHouseDetailsListeners();
    } else if (['land_sale', 'land_rent'].includes(type)) {
      detailsFields.innerHTML = landDetailsHTML();
      setupLandDetailsListeners();
    } else {
      detailsFields.innerHTML = '';
    }
  });
}

function houseDetailsHTML() {
  const subCatOptions = houseSubCategories.map(sc => `<option value="${sc}">${sc}</option>`).join('');
  const furnishOptions = furnishingStatuses.map(f => `<option value="${f}">${f}</option>`).join('');
  const condOptions = houseConditions.map(c => `<option value="${c}">${c}</option>`).join('');
  return `
    <div class="mb-3">
      <label class="form-label">Subcategory</label>
      <select class="form-select" id="houseSubCategory" required><option value="">Select Subcategory</option>${subCatOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Bedrooms</label>
      <input type="number" class="form-control" id="houseBedrooms" min="0" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Bathrooms</label>
      <input type="number" class="form-control" id="houseBathrooms" min="0" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Total Area (sqm)</label>
      <input type="number" class="form-control" id="houseTotalArea" min="0" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Furnishing Status</label>
      <select class="form-select" id="houseFurnishingStatus" required><option value="">Select</option>${furnishOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Condition</label>
      <select class="form-select" id="houseCondition" required><option value="">Select</option>${condOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Plot Size (acres)</label>
      <input type="number" class="form-control" id="housePlotAcres" min="0">
    </div>
    <div class="mb-3">
      <label class="form-label">Ownership Type</label>
      <select class="form-select" id="ownershipType" required><option value="">Select</option>${ownershipTypes.map(o => `<option value="${o}">${o}</option>`).join('')}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Title Status</label>
      <select class="form-select" id="titleStatus" required><option value="">Select</option>${titleStatuses.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Essential Utilities</label>
      <div class="row">
        <div class="col-md-4 mb-2">
          <select class="form-select" id="utilityElectricity" required><option value="">Electricity</option>${essentialElectricity.map(e => `<option value="${e}">${e}</option>`).join('')}</select>
        </div>
        <div class="col-md-4 mb-2">
          <select class="form-select" id="utilityWater" required><option value="">Water Supply</option>${essentialWater.map(w => `<option value="${w}">${w}</option>`).join('')}</select>
        </div>
        <div class="col-md-4 mb-2">
          <select class="form-select" id="utilityToilet" required><option value="">Toilet Type</option>${essentialToilet.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
        </div>
      </div>
    </div>
    <div class="mb-3">
      <label class="form-label">Security</label>
      <div id="houseSecurityCheckboxes">
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Gate" id="houseSecGate"><label class="form-check-label" for="houseSecGate">Gate</label></div>
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Guard" id="houseSecGuard"><label class="form-check-label" for="houseSecGuard">Guard</label></div>
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="CCTV" id="houseSecCCTV"><label class="form-check-label" for="houseSecCCTV">CCTV</label></div>
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Fence" id="houseSecFence"><label class="form-check-label" for="houseSecFence">Fence</label></div>
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="None" id="houseSecNone"><label class="form-check-label" for="houseSecNone">None</label></div>
      </div>
    </div>
  `;
}

function landDetailsHTML() {
  const subCatOptions = landSubCategories.map(sc => `<option value="${sc}">${sc}</option>`).join('');
  const topoOptions = landTopographies.map(t => `<option value="${t}">${t}</option>`).join('');
  const useOptions = landCurrentUses.map(u => `<option value="${u}">${u}</option>`).join('');
  const soilOptions = landSoilTypes.map(s => `<option value="${s}">${s}</option>`).join('');
  const roadOptions = landRoadAccess.map(r => `<option value="${r}">${r}</option>`).join('');
  return `
    <div class="mb-3">
      <label class="form-label">Subcategory</label>
      <select class="form-select" id="landSubCategory" required><option value="">Select Subcategory</option>${subCatOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Plot Size (acres)</label>
      <input type="number" class="form-control" id="landPlotAcres" min="0">
    </div>
    <div class="mb-3">
      <label class="form-label">Topography</label>
      <select class="form-select" id="landTopography" required><option value="">Select</option>${topoOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Soil Type</label>
      <select class="form-select" id="landSoilType"><option value="">Select</option>${soilOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Current Use</label>
      <select class="form-select" id="landCurrentUse" required><option value="">Select</option>${useOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Road Access</label>
      <select class="form-select" id="landRoadAccess" required><option value="">Select</option>${roadOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Ownership Type</label>
      <select class="form-select" id="ownershipType" required><option value="">Select</option>${ownershipTypes.map(o => `<option value="${o}">${o}</option>`).join('')}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Title Status</label>
      <select class="form-select" id="titleStatus" required><option value="">Select</option>${titleStatuses.map(t => `<option value="${t}">${t}</option>`).join('')}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Essential Utilities</label>
      <div class="row">
        <div class="col-md-4 mb-2">
          <select class="form-select" id="utilityElectricity" required><option value="">Electricity</option>${essentialElectricity.map(e => `<option value="${e}">${e}</option>`).join('')}</select>
        </div>
        <div class="col-md-4 mb-2">
          <select class="form-select" id="utilityWater" required><option value="">Water Supply</option>${essentialWater.map(w => `<option value="${w}">${w}</option>`).join('')}</select>
        </div>
      </div>
    </div>
    <div class="mb-3">
      <label class="form-label">Security</label>
      <div id="landSecurityCheckboxes">
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Gate" id="landSecGate"><label class="form-check-label" for="landSecGate">Gate</label></div>
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Guard" id="landSecGuard"><label class="form-check-label" for="landSecGuard">Guard</label></div>
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="CCTV" id="landSecCCTV"><label class="form-check-label" for="landSecCCTV">CCTV</label></div>
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="Fence" id="landSecFence"><label class="form-check-label" for="landSecFence">Fence</label></div>
        <div class="form-check form-check-inline"><input class="form-check-input" type="checkbox" value="None" id="landSecNone"><label class="form-check-label" for="landSecNone">None</label></div>
      </div>
    </div>
  `;
}

function setupHouseDetailsListeners() {
  // Add listeners for house-specific dynamic fields if needed
}
function setupLandDetailsListeners() {
  // Add listeners for land-specific dynamic fields if needed
}

function propertyFieldsHTML() {
  const propertyTypeOptions = propertyTypes.map(pt => `<option value="${pt.value}">${pt.label}</option>`).join('');
  return `
    <div class="mb-3">
      <label class="form-label">Title</label>
      <input type="text" class="form-control" id="listingTitle" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Description</label>
      <textarea class="form-control" id="listingDescription" rows="3" required></textarea>
    </div>
    <div class="mb-3">
      <label class="form-label">Price (UGX)</label>
      <input type="number" class="form-control" id="listingPrice" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Property Type</label>
      <select class="form-select" id="propertyType" required><option value="">Select Type</option>${propertyTypeOptions}</select>
    </div>
    <div id="propertyDetailsFields"></div>
    <div class="mb-3">
      <label class="form-label">Images</label>
      <input type="file" class="form-control" id="listingImages" multiple accept="image/*">
      <div id="imagePreview" class="d-flex flex-wrap mt-2"></div>
    </div>
  `;
}

function vehicleFieldsHTML() {
  // Generate category options matching Firestore vehicleType values
  const categoryOptions = [
    'Cars',
    'Motorcycles',
    'Trucks',
    'Buses',
    'Vans',
    'Heavy Machinery',
    'Bicycles',
    'E-bikes',
    'Boats',
    'Watercraft'
  ].map(cat => `<option value="${cat}">${cat}</option>`).join('');
  // Generate other dropdowns
  const conditionOptions = ['New', 'Used', 'For Parts'].map(c => `<option value="${c}">${c}</option>`).join('');
  const transmissionOptions = ['Manual', 'Automatic', 'Semi-Automatic', 'None'].map(t => `<option value="${t}">${t}</option>`).join('');
  const fuelTypeOptions = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'None'].map(f => `<option value="${f}">${f}</option>`).join('');
  const colorOptions = ['Silver', 'Black', 'White', 'Blue', 'Red', 'Grey', 'Pearl White', 'Green'].map(c => `<option value="${c}">${c}</option>`).join('');
  return `
    <div class="mb-3">
      <label class="form-label">Title</label>
      <input type="text" class="form-control" id="listingTitle" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Description</label>
      <textarea class="form-control" id="listingDescription" rows="3" required></textarea>
    </div>
    <div class="mb-3">
      <label class="form-label">Price (UGX)</label>
      <input type="number" class="form-control" id="listingPrice" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Category</label>
      <select class="form-select" id="vehicleCategory" required><option value="">Select Category</option>${categoryOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Subcategory</label>
      <input type="text" class="form-control" id="vehicleSubCategory" placeholder="e.g. SUVs, Sedans" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Make</label>
      <input type="text" class="form-control" id="vehicleMake" placeholder="e.g. Toyota, Nissan" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Model</label>
      <input type="text" class="form-control" id="vehicleModel" placeholder="e.g. Land Cruiser, Hilux" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Year</label>
      <input type="number" class="form-control" id="vehicleYear" required>
    </div>
    <div class="mb-3">
      <label class="form-label">Condition</label>
      <select class="form-select" id="vehicleCondition" required><option value="">Select Condition</option>${conditionOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Transmission</label>
      <select class="form-select" id="vehicleTransmission" required><option value="">Select Transmission</option>${transmissionOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Fuel Type</label>
      <select class="form-select" id="vehicleFuelType" required><option value="">Select Fuel Type</option>${fuelTypeOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Mileage (km)</label>
      <input type="number" class="form-control" id="vehicleMileage">
    </div>
    <div class="mb-3">
      <label class="form-label">Color</label>
      <select class="form-select" id="vehicleColor" required><option value="">Select Color</option>${colorOptions}</select>
    </div>
    <div class="mb-3">
      <label class="form-label">Images</label>
      <input type="file" class="form-control" id="listingImages" multiple accept="image/*">
      <div id="imagePreview" class="d-flex flex-wrap mt-2"></div>
    </div>
  `;
}

function setupImageUpload() {
  const imageInput = document.getElementById('listingImages');
  const preview = document.getElementById('imagePreview');
  if (!imageInput || !preview) return;
  imageInput.addEventListener('change', function() {
    preview.innerHTML = '';
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'me-2 mb-2';
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });
}

function setupFormSubmission() {
  const form = document.getElementById('addListingForm');
  if (!form) return;
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!currentUser) return alert('Not authenticated.');
    const type = document.getElementById('listingType').value;
    let data = {
      agentId: currentUser.id,
      createdAt: new Date(),
      type
    };
    if (type === 'property') {
      data.title = document.getElementById('listingTitle').value;
      data.description = document.getElementById('listingDescription').value;
      data.price = parseInt(document.getElementById('listingPrice').value);
      data.propertyType = document.getElementById('propertyType').value;
      // House details
      if (['house_sale', 'house_rent', 'vacation_short_stay'].includes(data.propertyType)) {
        data.houseDetails = {
          subCategory: document.getElementById('houseSubCategory').value,
          bedrooms: parseInt(document.getElementById('houseBedrooms').value),
          bathrooms: parseInt(document.getElementById('houseBathrooms').value),
          totalArea: parseFloat(document.getElementById('houseTotalArea').value),
          plotAcres: parseFloat(document.getElementById('housePlotAcres').value),
          furnishingStatus: document.getElementById('houseFurnishingStatus').value,
          condition: document.getElementById('houseCondition').value
        };
      }
      // Land details
      if (['land_sale', 'land_rent'].includes(data.propertyType)) {
        data.landDetails = {
          subCategory: document.getElementById('landSubCategory').value,
          plotAcres: parseFloat(document.getElementById('landPlotAcres').value),
          topography: document.getElementById('landTopography').value,
          soilType: document.getElementById('landSoilType').value,
          currentUse: document.getElementById('landCurrentUse').value,
          roadAccess: document.getElementById('landRoadAccess').value
        };
      }
      // Ownership
      data.ownershipDetails = {
        ownershipType: document.getElementById('ownershipType').value,
        titleStatus: document.getElementById('titleStatus').value
      };
      // Essential Utilities
      data.amenities = {
        essentialUtilities: {
          electricity: document.getElementById('utilityElectricity').value,
          waterSupply: document.getElementById('utilityWater').value,
          toiletType: document.getElementById('utilityToilet') ? document.getElementById('utilityToilet').value : ''
        },
        additionalFeatures: {
          security: []
        }
      };
      // Collect security checkboxes
      if (['house_sale', 'house_rent', 'vacation_short_stay'].includes(data.propertyType)) {
        data.amenities.additionalFeatures.security = Array.from(document.querySelectorAll('#houseSecurityCheckboxes input[type=checkbox]:checked')).map(cb => cb.value);
      }
      if (['land_sale', 'land_rent'].includes(data.propertyType)) {
        data.amenities.additionalFeatures.security = Array.from(document.querySelectorAll('#landSecurityCheckboxes input[type=checkbox]:checked')).map(cb => cb.value);
      }
    } else if (type === 'vehicle') {
      data.title = document.getElementById('listingTitle').value;
      data.description = document.getElementById('listingDescription').value;
      data.price = parseInt(document.getElementById('listingPrice').value);
      data.vehicleCategory = document.getElementById('vehicleCategory').value;
      data.subCategory = document.getElementById('vehicleSubCategory').value;
      data.make = document.getElementById('vehicleMake').value;
      data.model = document.getElementById('vehicleModel').value;
      data.year = document.getElementById('vehicleYear').value;
      data.condition = document.getElementById('vehicleCondition').value;
      data.transmission = document.getElementById('vehicleTransmission').value;
      data.fuelType = document.getElementById('vehicleFuelType').value;
      data.mileage = document.getElementById('vehicleMileage').value;
      data.color = document.getElementById('vehicleColor').value;
    } else {
      return alert('Please select a listing type.');
    }
    // Handle image upload (placeholder: just file names)
    const imageInput = document.getElementById('listingImages');
    if (imageInput && imageInput.files.length) {
      data.images = Array.from(imageInput.files).map(f => f.name); // TODO: Upload to storage and save URLs
    } else {
      data.images = [];
    }
    // Save to Firestore
    try {
      await db.collection('listings').add(data);
      alert('Listing created successfully!');
      form.reset();
      document.getElementById('dynamicFields').innerHTML = '';
    } catch (err) {
      alert('Error creating listing: ' + err.message);
    }
  });
}