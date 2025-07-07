// js/admin.js
// Firestore config and admin utilities for Starlet Properties Admin

const firebaseConfig = {
  apiKey: "AIzaSyDH1sMk2NwceMAEfvH07azxaoPXpOI1Sek",
  authDomain: "starlet-properties-41509.firebaseapp.com",
  projectId: "starlet-properties-41509",
  storageBucket: "starlet-properties-41509.appspot.com",
  messagingSenderId: "393372988481",
  appId: "1:393372988481:web:c92584d7408296457b02c0",
  measurementId: "G-F02K9SP07C"
};

// Initialize Firebase only after DOM is loaded and Firebase is available
let db, auth;

function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
    return false;
  }
  
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.firestore();
  auth = firebase.auth();
  return true;
}

// Utility: Show loading spinner in a container
function showLoading(container, message = "Loading...") {
  if (container) container.innerHTML = `<div class='text-center text-muted py-5'><div class='spinner-border text-primary'></div><div>${message}</div></div>`;
}

// Utility: Show error in a container
function showError(container, error) {
  if (container) container.innerHTML = `<div class='text-danger text-center py-5'>${error}</div>`;
}

// Utility: Show toast/alert
function showToast(message, type = 'success') {
  alert(message); // Replace with Bootstrap toast if desired
}

// Utility: Check if current user is admin (requires Firestore rules to enforce)
function requireAdminUser() {
  return new Promise((resolve, reject) => {
    if (!auth) {
      reject('Firebase not initialized');
      return;
    }
    
    auth.onAuthStateChanged(async user => {
      if (!user || user.isAnonymous) {
        window.location.href = '../../pages/auth/login.html';
        return reject('Not logged in');
      }
      
      // Check if user has admin email (primary check)
      const isAdminEmail = user.email && (
        user.email.toLowerCase() === 'admin@starletproperties.ug' ||
        user.email.toLowerCase().includes('admin')
      );
      
      if (isAdminEmail) {
        console.log('Admin access granted based on email:', user.email);
        resolve(user);
        return;
      }
      
      // Fallback: Check Firestore document for admin role
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
          console.log('Admin access granted based on Firestore role');
          resolve(user);
        } else {
          alert('You do not have admin access.');
          window.location.href = '../../index.html';
          reject('Not admin');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        // If there's an error checking Firestore, still allow admin email access
        if (isAdminEmail) {
          console.log('Admin access granted despite Firestore error');
          resolve(user);
        } else {
          reject('Error checking permissions');
        }
      }
    });
  });
}

// Utility: Format date
function formatDate(ts) {
  if (!ts) return '';
  if (ts.toDate) ts = ts.toDate();
  return ts instanceof Date ? ts.toLocaleDateString() : ts;
}

// Utility: Format price
function formatPrice(price) {
  if (price === undefined || price === null) return 'N/A';
  return 'USh ' + Number(price).toLocaleString();
}

// Utility: Confirm action
function confirmAction(message) {
  return window.confirm(message);
}

// Logout functionality
function logout() {
  if (!window.confirm('Are you sure you want to log out?')) return;
  if (auth) {
    auth.signOut().then(() => {
      window.location.href = '../../index.html';
    });
  } else {
    window.location.href = '../../index.html';
  }
}

// Enforce admin authentication
function enforceAdminAuth() {
  return new Promise((resolve, reject) => {
    if (!auth) {
      reject('Firebase not initialized');
      return;
    }
    
    auth.onAuthStateChanged(async user => {
      if (!user || user.isAnonymous) {
        window.location.href = '../../pages/auth/login.html';
        return reject('Not logged in');
      }
      
      // Check if user has admin email (primary check)
      const isAdminEmail = user.email && (
        user.email.toLowerCase() === 'admin@starletproperties.ug' ||
        user.email.toLowerCase().includes('admin')
      );
      
      if (isAdminEmail) {
        console.log('Admin access granted based on email:', user.email);
        resolve(user);
        return;
      }
      
      // Fallback: Check Firestore document for admin role
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
          console.log('Admin access granted based on Firestore role');
          resolve(user);
        } else {
          alert('You do not have admin access.');
          window.location.href = '../../index.html';
          reject('Not admin');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        // If there's an error checking Firestore, still allow admin email access
        if (isAdminEmail) {
          console.log('Admin access granted despite Firestore error');
          resolve(user);
        } else {
          reject('Error checking permissions');
        }
      }
    });
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase
  if (!initializeFirebase()) {
    console.error('Failed to initialize Firebase');
    return;
  }
  
  // Expose utilities globally for use in inline event handlers
  window.showLoading = showLoading;
  window.showError = showError;
  window.showToast = showToast;
  window.requireAdminUser = requireAdminUser;
  window.formatDate = formatDate;
  window.formatPrice = formatPrice;
  window.confirmAction = confirmAction;
  window.logout = logout;
  window.enforceAuth = enforceAdminAuth;
  
  // Attach logout handler to all .logout-link elements
  document.querySelectorAll('.logout-link').forEach(el => {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  });
  
  // Enforce admin authentication
  enforceAdminAuth().then(user => {
    console.log('Admin authenticated:', user);
    // ... existing admin page logic ...
  }).catch(error => {
    console.error('Admin auth failed:', error);
  });

  // --- Official Store Add/Edit Listing Modal Logic (Advanced) ---
  if (window.location.pathname.includes('official-store.html')) {
    document.addEventListener('DOMContentLoaded', function() {
      // Modal elements
      const addEditListingModal = document.getElementById('addEditListingModal');
      const addEditListingForm = document.getElementById('addEditListingForm');
      const modalListingType = document.getElementById('modalListingType');
      const modalPropertySection = document.getElementById('modalPropertySection');
      const modalVehicleSection = document.getElementById('modalVehicleSection');
      let officialStoreId = null;
      let vehicleMakesModels = [];
      let propertyMeta = null;
      const userAgentTier = 'Premium'; // For admin, always premium

      // Helper: Show modal
      function showModal() {
        const modal = new bootstrap.Modal(addEditListingModal);
        modal.show();
      }

      // Helper: Clear form
      function clearModalForm() {
        addEditListingForm.reset();
        modalPropertySection.classList.add('d-none');
        modalVehicleSection.classList.add('d-none');
        modalPropertySection.innerHTML = '';
        modalVehicleSection.innerHTML = '';
      }

      // --- Dynamic Property Form Fields ---
      function renderPropertyFields() {
        modalPropertySection.innerHTML = `
          <div class="row g-3">
            <div class="col-lg-6 col-md-12 col-12">
              <label class="form-label">Property Type</label>
              <select id="modalPropertyType" class="form-select" required></select>
            </div>
            <div class="col-lg-6 col-md-12 col-12">
              <label class="form-label">Title</label>
              <input id="modalPropertyTitle" type="text" class="form-control" required>
            </div>
            <div class="col-lg-6 col-md-12 col-12">
              <label class="form-label">Asking Price (UGX)</label>
              <input id="modalPropertyAskingPrice" type="number" class="form-control" required>
            </div>
            <div class="col-lg-6 col-md-12 col-12">
              <label class="form-label">District</label>
              <input id="modalPropertyDistrict" type="text" class="form-control" required>
            </div>
          </div>
          <div id="modalHouseDetailsSection" class="row g-3 mt-3 d-none"></div>
          <div id="modalLandDetailsSection" class="row g-3 mt-3 d-none"></div>
          <div id="modalOwnershipDetailsSection" class="row g-3 mt-3 d-none"></div>
          <div id="modalAmenitiesSection" class="row g-3 mt-3 d-none"></div>
          <div class="row g-3 mt-3" id="modalPropertyDescPriceRow">
            <div class="col-md-8">
              <label class="form-label">Description</label>
              <textarea id="modalPropertyDescription" class="form-control" rows="2"></textarea>
            </div>
            <div class="col-md-4">
              <label class="form-label">Price Type</label>
              <select id="modalPropertyPriceType" class="form-select">
                <option value="fixed">Fixed</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
          </div>
        `;
        modalPropertySection.classList.remove('d-none');
        populatePropertyTypeDropdown();
        setupPropertyDropdownListeners();
      }

      // --- Dynamic Vehicle Form Fields ---
      function renderVehicleFields() {
        modalVehicleSection.innerHTML = `
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Vehicle Category</label>
              <select id="modalVehicleCategory" class="form-select" required></select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Sub Category</label>
              <select id="modalVehicleSubCategory" class="form-select"></select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Make</label>
              <select id="modalVehicleMake" class="form-select"></select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Model</label>
              <select id="modalVehicleModel" class="form-select"></select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Title</label>
              <input id="modalVehicleTitle" type="text" class="form-control" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Asking Price (UGX)</label>
              <input id="modalVehicleAskingPrice" type="number" class="form-control" required>
            </div>
          </div>
          <div id="modalVehicleStandardFields" class="row g-3 mt-3 d-none"></div>
          <div id="modalVehiclePremiumFields" class="row g-3 mt-3 d-none"></div>
          <div class="row g-3 mt-3" id="modalVehicleDescPriceRow">
            <div class="col-md-8">
              <label class="form-label">Description</label>
              <textarea id="modalVehicleDescription" class="form-control" rows="2"></textarea>
            </div>
            <div class="col-md-4">
              <label class="form-label">Price Type</label>
              <select id="modalVehiclePriceType" class="form-select">
                <option value="fixed">Fixed</option>
                <option value="negotiable">Negotiable</option>
              </select>
            </div>
          </div>
        `;
        modalVehicleSection.classList.remove('d-none');
        populateVehicleCategories();
        setupVehicleDropdownListeners();
      }

      // --- Firestore Fetches ---
      async function fetchVehicleMakesModels() {
        try {
          const snap = await db.collection('vehicleMakesModels').get();
          vehicleMakesModels = snap.docs.map(doc => doc.data());
        } catch (e) {
          vehicleMakesModels = [];
          console.error('Error fetching vehicleMakesModels:', e);
        }
      }
      async function fetchPropertyMeta() {
        try {
          const snap = await db.collection('propertyMeta').limit(1).get();
          if (!snap.empty) {
            propertyMeta = snap.docs[0].data();
          } else {
            propertyMeta = null;
          }
        } catch (e) {
          propertyMeta = null;
          console.error('Error fetching propertyMeta:', e);
        }
      }

      // --- Populate Dropdowns ---
      function populatePropertyTypeDropdown() {
        const el = document.getElementById('modalPropertyType');
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
      function populateVehicleCategories() {
        const el = document.getElementById('modalVehicleCategory');
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

      // --- Setup Property Dropdown Listeners ---
      function setupPropertyDropdownListeners() {
        const propertyTypeEl = document.getElementById('modalPropertyType');
        const houseDetailsSection = document.getElementById('modalHouseDetailsSection');
        const landDetailsSection = document.getElementById('modalLandDetailsSection');
        const ownershipDetailsSection = document.getElementById('modalOwnershipDetailsSection');
        const amenitiesSection = document.getElementById('modalAmenitiesSection');
        // ... (implement dynamic field logic as in add.html) ...
        // For brevity, only the main dropdowns and visibility logic are shown here. You can expand this to include all advanced fields as needed.
        propertyTypeEl.addEventListener('change', function() {
          const type = propertyTypeEl.value;
          // House details
          if (["house_sale","house_rent","vacation_short_stay"].includes(type)) {
            houseDetailsSection.classList.remove('d-none');
            landDetailsSection.classList.add('d-none');
            // Populate house subcategories, etc.
          } else if (["land_sale","land_rent"].includes(type)) {
            landDetailsSection.classList.remove('d-none');
            houseDetailsSection.classList.add('d-none');
            // Populate land subcategories, etc.
          } else {
            houseDetailsSection.classList.add('d-none');
            landDetailsSection.classList.add('d-none');
          }
          ownershipDetailsSection.classList.remove('d-none');
          amenitiesSection.classList.remove('d-none');
        });
      }
      // --- Setup Vehicle Dropdown Listeners ---
      function setupVehicleDropdownListeners() {
        const vehicleCategoryEl = document.getElementById('modalVehicleCategory');
        const vehicleMakeEl = document.getElementById('modalVehicleMake');
        const vehicleModelEl = document.getElementById('modalVehicleModel');
        // ... (implement dynamic field logic as in add.html) ...
        vehicleCategoryEl.addEventListener('change', function() {
          const selectedType = vehicleCategoryEl.value.trim();
          const makes = vehicleMakesModels
            .filter(item => item.vehicleType && item.vehicleType.trim().toLowerCase() === selectedType.toLowerCase())
            .map(item => item.make)
            .filter((v, i, a) => v && a.indexOf(v) === i);
          vehicleMakeEl.length = 1;
          makes.forEach(make => {
            const opt = document.createElement('option');
            opt.value = make;
            opt.textContent = make;
            vehicleMakeEl.appendChild(opt);
          });
          vehicleModelEl.length = 1;
        });
        vehicleMakeEl.addEventListener('change', function() {
          const selectedType = vehicleCategoryEl.value.trim();
          const selectedMake = vehicleMakeEl.value.trim();
          const makeObj = vehicleMakesModels.find(
            item =>
              item.vehicleType &&
              item.make &&
              item.vehicleType.trim().toLowerCase() === selectedType.toLowerCase() &&
              item.make.trim().toLowerCase() === selectedMake.toLowerCase()
          );
          vehicleModelEl.length = 1;
          if (makeObj && Array.isArray(makeObj.models)) {
            makeObj.models.forEach(model => {
              const opt = document.createElement('option');
              opt.value = model;
              opt.textContent = model;
              vehicleModelEl.appendChild(opt);
            });
          }
        });
      }

      // Show modal on Add Listing button click (robust)
      const addListingBtn = document.getElementById('addListingBtn');
      if (addListingBtn) {
        addListingBtn.addEventListener('click', function() {
          console.log('Add Listing button clicked');
          clearModalForm();
          showModal();
        });
      }

      // Fetch official store ID (assume only one official store)
      async function fetchOfficialStoreId() {
        const snap = await db.collection('stores').where('isOfficial', '==', true).limit(1).get();
        if (!snap.empty) {
          officialStoreId = snap.docs[0].id;
        }
      }
      fetchOfficialStoreId();
      fetchVehicleMakesModels();
      fetchPropertyMeta();

      // Listing type change logic
      modalListingType.addEventListener('change', function() {
        if (modalListingType.value === 'property') {
          renderPropertyFields();
          modalVehicleSection.classList.add('d-none');
        } else if (modalListingType.value === 'vehicle') {
          renderVehicleFields();
          modalPropertySection.classList.add('d-none');
        } else {
          modalPropertySection.classList.add('d-none');
          modalVehicleSection.classList.add('d-none');
        }
      });

      // Handle form submit (advanced fields)
      addEditListingForm.onsubmit = async function(e) {
        e.preventDefault();
        let listing = {};
        if (modalListingType.value === 'property') {
          listing.listingType = 'property';
          listing.propertyType = document.getElementById('modalPropertyType').value;
          listing.title = document.getElementById('modalPropertyTitle').value;
          listing.askingPrice = Number(document.getElementById('modalPropertyAskingPrice').value);
          listing.location = { district: document.getElementById('modalPropertyDistrict').value };
          listing.description = document.getElementById('modalPropertyDescription').value;
          listing.priceType = document.getElementById('modalPropertyPriceType').value;
          // TODO: Collect advanced property fields (houseDetails, landDetails, ownershipDetails, amenities, etc.)
        } else if (modalListingType.value === 'vehicle') {
          listing.listingType = 'vehicle';
          listing.vehicleCategory = document.getElementById('modalVehicleCategory').value;
          listing.subCategory = document.getElementById('modalVehicleSubCategory').value;
          listing.make = document.getElementById('modalVehicleMake').value;
          listing.model = document.getElementById('modalVehicleModel').value;
          listing.title = document.getElementById('modalVehicleTitle').value;
          listing.askingPrice = Number(document.getElementById('modalVehicleAskingPrice').value);
          listing.description = document.getElementById('modalVehicleDescription').value;
          listing.priceType = document.getElementById('modalVehiclePriceType').value;
          // TODO: Collect advanced vehicle fields (condition, mileage, color, transmission, fuelType, etc.)
        }
        listing.isOfficial = true;
        listing.storeId = officialStoreId;
        listing.status = 'pending';
        listing.createdAt = new Date();
        try {
          await db.collection('listings').add(listing);
          showToast('Listing added successfully');
          const modal = bootstrap.Modal.getInstance(addEditListingModal);
          if (modal) modal.hide();
          if (typeof fetchAndRenderOfficialListings === 'function') fetchAndRenderOfficialListings();
        } catch (e) {
          showToast('Error adding listing', 'danger');
        }
      };
    });
    window.showAddEditListingModal = function() {
      document.getElementById('addListingBtn').click();
    };
  }
}); 