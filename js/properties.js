// properties.js - Firebase-powered property listing for properties.html

// Ensure Firebase is loaded
if (typeof firebase === 'undefined' && typeof window.firebaseDB === 'undefined') {
  alert('Firebase SDK not loaded!');
}

const db = window.firebaseDB;

// Elements
const featuredList = document.getElementById('featured-properties-listings');
const propertiesList = document.getElementById('properties-listings');
const searchForm = document.getElementById('property-search-form');

// Render a property card
function renderPropertyCard(d, id) {
  const img = (d.imageUrls && d.imageUrls[0]) || (d.images && d.images[0]) || '../../images/listing-default.jpg';
  // Use propertyType for display if type is 'property'
  const typeLabel = d.type === 'property' && d.propertyType ? d.propertyType : d.type;
  return `
    <div class="col-md-4 col-lg-3 mb-4">
      <div class="listing-card card-modern">
        <div class="card-img-wrapper">
          <img src="${img}" class="card-img-top" alt="Property Image">
        </div>
        <div class="card-body">
          <h5 class="card-title">${d.title || 'Property Title'}</h5>
          <div class="location mb-2"><i class="bi bi-geo-alt"></i> ${d.location || ''}</div>
          <div class="mb-2"><span class="badge bg-secondary">${typeLabel || ''}</span></div>
          <div class="price-tag mb-2">${d.price ? 'USh ' + d.price.toLocaleString() : ''}</div>
          <a href="details.html?id=${id}" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>
    </div>
  `;
}

// Load featured properties
async function loadFeaturedProperties() {
  featuredList.innerHTML = '<div class="text-center text-muted">Loading...</div>';
  try {
    const snap = await db.collection('listings')
      .where('isFeatured', '==', true)
      .where('type', 'in', [
        'house_sale','house_rent','land_sale','land_rent','commercial','vacation_short_stay'])
      .orderBy('createdAt', 'desc').limit(6).get();
    if (snap.empty) {
      featuredList.innerHTML = '<div class="text-center text-muted">No featured properties found.</div>';
      return;
    }
    featuredList.innerHTML = '';
    snap.forEach(doc => {
      featuredList.innerHTML += renderPropertyCard(doc.data(), doc.id);
    });
  } catch (e) {
    featuredList.innerHTML = '<div class="text-center text-danger">Failed to load featured properties.</div>';
  }
}

// Load all properties (with optional filters)
async function loadProperties(filters = {}) {
  propertiesList.innerHTML = '<div class="text-center text-muted">Loading...</div>';
  try {
    let ref = db.collection('listings')
      .where('type', 'in', [
        'house_sale','house_rent','land_sale','land_rent','commercial','vacation_short_stay','property']);
    if (filters.type) {
      // Support both type and propertyType for filtering
      ref = ref.where('propertyType', '==', filters.type);
    }
    if (filters.location) ref = ref.where('location', '==', filters.location);
    if (filters.minPrice) ref = ref.where('price', '>=', filters.minPrice);
    if (filters.maxPrice) ref = ref.where('price', '<=', filters.maxPrice);
    // For keyword, do client-side filter after fetch
    const snap = await ref.orderBy('createdAt', 'desc').limit(24).get();
    let results = [];
    snap.forEach(doc => {
      results.push({id: doc.id, ...doc.data()});
    });
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      results = results.filter(d =>
        (d.title && d.title.toLowerCase().includes(kw)) ||
        (d.description && d.description.toLowerCase().includes(kw))
      );
    }
    if (results.length === 0) {
      propertiesList.innerHTML = '<div class="text-center text-muted">No properties found.</div>';
      return;
    }
    propertiesList.innerHTML = '';
    results.forEach(d => {
      propertiesList.innerHTML += renderPropertyCard(d, d.id);
    });
  } catch (e) {
    propertiesList.innerHTML = '<div class="text-center text-danger">Failed to load properties.</div>';
  }
}

// Handle search form
if (searchForm) {
  searchForm.onsubmit = function(e) {
    e.preventDefault();
    const filters = {
      keyword: searchForm.keyword.value.trim(),
      type: searchForm.type.value,
      location: searchForm.location.value.trim(),
      minPrice: searchForm.minPrice.value ? parseInt(searchForm.minPrice.value) : undefined,
      maxPrice: searchForm.maxPrice.value ? parseInt(searchForm.maxPrice.value) : undefined
    };
    loadProperties(filters);
  };
}

document.addEventListener('DOMContentLoaded', function() {
  loadFeaturedProperties();
  loadProperties();
}); 