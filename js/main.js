// Starlet Properties - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeAnimations();
    initializeStatistics();
    initializeSearchTabs();
    initializeLanguageSelector();
    initializeNavbar();
    initializeScrollEffects();
    initializeTooltips();
    initializePopovers();
    renderFeaturedListings();
});

// Animation Initialization
function initializeAnimations() {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.tier-card, .stat-item, .listing-card, .section-header');
    animateElements.forEach(el => observer.observe(el));
}

// Statistics Counter Animation
function initializeStatistics() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const countUp = (element, target) => {
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 20);
    };

    // Trigger counter animation when statistics section is visible
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statItems = entry.target.querySelectorAll('.stat-item');
                statItems.forEach(item => {
                    const numberElement = item.querySelector('.stat-number');
                    const target = parseInt(numberElement.getAttribute('data-target'));
                    countUp(numberElement, target);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const statisticsSection = document.querySelector('.statistics-section');
    if (statisticsSection) {
        statsObserver.observe(statisticsSection);
    }
}

// Search Tabs Functionality
function initializeSearchTabs() {
    const searchTabs = document.querySelectorAll('.search-tab');
    const searchForm = document.getElementById('search-form');
    
    searchTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            searchTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Update form based on tab
            const tabType = this.getAttribute('data-tab');
            updateSearchForm(tabType);
        });
    });
}

// Update search form based on selected tab
function updateSearchForm(type) {
    const typeSelect = document.getElementById('search-type');
    
    if (type === 'properties') {
        typeSelect.innerHTML = `
            <option value="">All Property Types</option>
            <option value="house_sale">House for Sale</option>
            <option value="house_rent">House for Rent</option>
            <option value="land_sale">Land for Sale</option>
            <option value="land_rent">Land for Rent</option>
            <option value="commercial">Commercial Property</option>
            <option value="vacation_short_stay">Vacation & Short Stay</option>
        `;
    } else if (type === 'vehicles') {
        typeSelect.innerHTML = `
            <option value="">All Vehicle Types</option>
            <option value="vehicle_sale">Cars</option>
            <option value="motorcycle_sale">Motorcycles</option>
            <option value="truck_sale">Trucks</option>
            <option value="bus_sale">Buses</option>
            <option value="heavy_machinery_sale">Heavy Machinery</option>
            <option value="bicycle_ebike_sale">Bicycles & E-bikes</option>
            <option value="boat_watercraft_sale">Boats & Watercraft</option>
        `;
    }
}

// Language Selector
function initializeLanguageSelector() {
    const languageSelect = document.getElementById('language-select');
    
    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLanguage = this.value;
            changeLanguage(selectedLanguage);
        });
    }
}

// Language Change Function
function changeLanguage(language) {
    // Store language preference
    localStorage.setItem('preferredLanguage', language);
    
    // Update UI based on language
    if (language === 'ach') {
        // Switch to Acholi
        updateUIToAcholi();
    } else {
        // Switch to English
        updateUIToEnglish();
    }
    
    // Show language change notification
    showNotification(`Language changed to ${language === 'ach' ? 'Acholi' : 'English'}`, 'success');
}

// Update UI to Acholi
function updateUIToAcholi() {
    // This would contain translations for Acholi
    const translations = {
        'hero-title': 'Nyuta Piny ki Moto ma Ber',
        'hero-subtitle': 'Nyuta piny ki moto ma ber i Uganda. Ki piny ki moto ma ber - wa tye ki gin.',
        // Add more translations as needed
    };
    
    // Apply translations
    Object.keys(translations).forEach(key => {
        const element = document.querySelector(`[data-translate="${key}"]`);
        if (element) {
            element.textContent = translations[key];
        }
    });
}

// Update UI to English
function updateUIToEnglish() {
    // Reset to English (default)
    const translations = {
        'hero-title': 'Find Your Perfect Property and Vehicle in Uganda',
        'hero-subtitle': 'Discover premium real estate and vehicle listings across Uganda. From residential properties to commercial spaces, cars to heavy machinery - we\'ve got you covered.',
        // Add more translations as needed
    };
    
    // Apply translations
    Object.keys(translations).forEach(key => {
        const element = document.querySelector(`[data-translate="${key}"]`);
        if (element) {
            element.textContent = translations[key];
        }
    });
}

// Navbar Functionality
function initializeNavbar() {
    const navbar = document.querySelector('.navbar');
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (!navbar) return; // Add this line to prevent errors if navbar is missing
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });
    
    // Active nav link highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Scroll Effects
function initializeScrollEffects() {
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero-section');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        if (heroSection) {
            heroSection.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
    
    // Smooth scroll for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Bootstrap Tooltips
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Bootstrap Popovers
function initializePopovers() {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Search Form Handling
function initializeSearchForm() {
    const searchForm = document.getElementById('search-form');
    
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const searchData = Object.fromEntries(formData);
            
            // Perform search
            performSearch(searchData);
        });
    }
}

// Perform Search
function performSearch(searchData) {
    // Show loading state
    showLoadingState();
    
    // Simulate search (replace with actual API call)
    setTimeout(() => {
        hideLoadingState();
        
        // Redirect to search results page with parameters
        const params = new URLSearchParams(searchData);
        window.location.href = `search-results.html?${params.toString()}`;
    }, 1000);
}

// Loading States
function showLoadingState() {
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Searching...';
        searchBtn.disabled = true;
    }
}

function hideLoadingState() {
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.innerHTML = '<i class="bi bi-search"></i> Search';
        searchBtn.disabled = false;
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Lazy Loading for Images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Initialize lazy loading
initializeLazyLoading();

// Export functions for use in other modules
window.StarletProperties = {
    showNotification,
    changeLanguage,
    performSearch,
    debounce,
    throttle
};

// Firebase Auth state observer and global user
let currentUser = null;

// Wait for Firebase to be initialized before setting up auth observer
function initializeAuthObserver() {
  if (window.firebase && firebase.apps && firebase.apps.length > 0 && firebase.auth) {
    firebase.auth().onAuthStateChanged(function(user) {
      currentUser = user;
      window.currentUser = user;
      // Optionally, update UI for logged-in state here
      // e.g., show/hide login/signup buttons
      renderFeaturedListings(); // re-render listings to show save/message buttons
    });
  } else {
    // Retry after a short delay if Firebase isn't ready yet
    setTimeout(initializeAuthObserver, 100);
  }
}

// Start the auth observer initialization
initializeAuthObserver();

// Enhanced renderFeaturedListings with approved listings only
async function renderFeaturedListings() {
  const container = document.getElementById('featured-listings');
  if (!container) return;
  container.innerHTML = '<div class="text-center w-100 py-4">Loading approved listings...</div>';
  
  try {
    const db = window.firebaseDB || (window.firebase && firebase.firestore());
    if (!db) {
      container.innerHTML = '<div class="text-danger text-center">Firestore not initialized. Please check your Firebase setup.</div>';
      return;
    }

    console.log('Starting approved listings query...');
    
    // Only get approved listings with priority order
    let allListings = [];
    let seenIds = new Set(); // Track seen listing IDs to prevent duplicates
    let queryType = 'approved';
    
    // Create a map to store the highest priority for each listing
    let listingPriorityMap = new Map();
    
    // 1. Get Official Store listings (highest priority) - approved only
    try {
      console.log('Fetching approved official store listings...');
      const officialSnap = await db.collection('listings')
        .where('officialStore', '==', true)
        .where('status', '==', 'approved')
        .limit(6).get();
      if (!officialSnap.empty) {
        officialSnap.forEach(doc => {
          // Store the highest priority for this listing
          if (!listingPriorityMap.has(doc.id) || listingPriorityMap.get(doc.id).priority > 1) {
            listingPriorityMap.set(doc.id, { 
              data: doc.data(), 
              priority: 1, 
              source: 'official' 
            });
          }
        });
        console.log(`Found ${officialSnap.size} approved official store listings`);
      }
    } catch (err) {
      console.log('Official store listings query failed:', err);
    }
    
    // 2. Get Featured listings (second priority) - approved only
    try {
      console.log('Fetching approved featured listings...');
      const featuredSnap = await db.collection('listings')
        .where('featured', '==', true)
        .where('status', '==', 'approved')
        .limit(4).get();
      if (!featuredSnap.empty) {
        featuredSnap.forEach(doc => {
          // Store the highest priority for this listing (only if not already official store)
          if (!listingPriorityMap.has(doc.id) || listingPriorityMap.get(doc.id).priority > 2) {
            listingPriorityMap.set(doc.id, { 
              data: doc.data(), 
              priority: 2, 
              source: 'featured' 
            });
          }
        });
        console.log(`Found ${featuredSnap.size} approved featured listings`);
      }
    } catch (err) {
      console.log('Featured listings query failed:', err);
    }
    
    // 3. Get Trending listings (third priority) - approved only
    try {
      console.log('Fetching approved trending listings...');
      const trendingSnap = await db.collection('listings')
        .where('trending', '==', true)
        .where('status', '==', 'approved')
        .limit(4).get();
      if (!trendingSnap.empty) {
        trendingSnap.forEach(doc => {
          // Store the highest priority for this listing (only if not already higher priority)
          if (!listingPriorityMap.has(doc.id) || listingPriorityMap.get(doc.id).priority > 3) {
            listingPriorityMap.set(doc.id, { 
              data: doc.data(), 
              priority: 3, 
              source: 'trending' 
            });
          }
        });
        console.log(`Found ${trendingSnap.size} approved trending listings`);
      }
    } catch (err) {
      console.log('Trending listings query failed:', err);
    }
    
    // 4. If we don't have enough listings, get recent approved listings
    if (allListings.length < 8) {
      try {
        console.log('Fetching recent approved listings to fill gaps...');
        const recentSnap = await db.collection('listings')
          .where('status', '==', 'approved')
          .orderBy('createdAt', 'desc')
          .limit(8).get();
        if (!recentSnap.empty) {
          recentSnap.forEach(doc => {
            // Store the highest priority for this listing (only if not already higher priority)
            if (!listingPriorityMap.has(doc.id) || listingPriorityMap.get(doc.id).priority > 4) {
              listingPriorityMap.set(doc.id, { 
                data: doc.data(), 
                priority: 4, 
                source: 'recent' 
              });
            }
          });
          console.log(`Found ${recentSnap.size} recent approved listings`);
        }
      } catch (err) {
        console.log('Recent listings query failed:', err);
      }
    }
    
    // 5. Last resort: Any approved listings
    if (allListings.length === 0) {
      try {
        console.log('Trying any approved listings query...');
        const approvedSnap = await db.collection('listings')
          .where('status', '==', 'approved')
          .limit(12).get();
        if (!approvedSnap.empty) {
          approvedSnap.forEach(doc => {
            // Store the highest priority for this listing (only if not already higher priority)
            if (!listingPriorityMap.has(doc.id) || listingPriorityMap.get(doc.id).priority > 5) {
              listingPriorityMap.set(doc.id, { 
                data: doc.data(), 
                priority: 5, 
                source: 'approved' 
              });
            }
          });
          queryType = 'approved';
          console.log(`Found ${approvedSnap.size} approved listings`);
        }
      } catch (err) {
        console.log('Approved listings query failed:', err);
      }
    }

    // Convert priority map to array and ensure no duplicates
    for (const [listingId, listingInfo] of listingPriorityMap) {
      allListings.push({
        ...listingInfo.data,
        id: listingId,
        priority: listingInfo.priority,
        source: listingInfo.source
      });
    }
    
    if (allListings.length === 0) {
      container.innerHTML = '<div class="text-muted text-center">No listings available at the moment.</div>';
      console.log('No listings found after trying all fallback queries');
      return;
    }

    // Sort listings by priority (official store first, then featured, then trending, etc.)
    allListings.sort((a, b) => a.priority - b.priority);
    
    // Limit to 8 listings maximum (2 rows of 4)
    allListings = allListings.slice(0, 8);
    
    console.log(`Found ${allListings.length} total approved listings`);
    console.log('Listing sources:', allListings.map(l => ({ id: l.id, source: l.source, priority: l.priority })));
    


         // Update section header to reflect approved listings
     const sectionHeader = document.querySelector('.section-header h2');
     if (sectionHeader) {
       // Keep the approved listings heading
       sectionHeader.textContent = 'Approved Listings';
     }

    container.innerHTML = '';
    let savedIds = new Set();
    if (window.currentUser) {
      // Fetch saved listings for the user
      const savedSnap = await db.collection('users').doc(window.currentUser.uid).collection('savedListings').get();
      savedIds = new Set(savedSnap.docs.map(doc => doc.id));
    }
    
    allListings.forEach(listing => {
      const isSaved = savedIds.has(listing.id);
      const card = document.createElement('div');
       card.className = 'col-md-6 col-lg-3 mb-3';
      
      // Determine listing type for display
      let typeLabel = listing.type || listing.listingType || '';
      if (listing.type === 'property' && listing.propertyType) {
        typeLabel = listing.propertyType;
      } else if (listing.listingType === 'vehicle' && listing.vehicleType) {
        typeLabel = listing.vehicleType;
      }
      
      // Get appropriate icon for the listing type
      function getListingIcon(listing) {
        const type = listing.type || listing.listingType || '';
        const propertyType = listing.propertyType || '';
        const vehicleType = listing.vehicleType || '';
        
        // Property icons
        if (type === 'property' || type.includes('house') || type.includes('land')) {
          if (propertyType.includes('house') || type.includes('house')) {
            return 'bi-house-door-fill';
          } else if (propertyType.includes('land') || type.includes('land')) {
            return 'bi-tree-fill';
          } else if (propertyType.includes('commercial') || type.includes('commercial')) {
            return 'bi-building-fill';
          } else if (propertyType.includes('vacation') || type.includes('vacation')) {
            return 'bi-umbrella-beach-fill';
          } else {
            return 'bi-house-door-fill';
          }
        }
        
        // Vehicle icons
        if (type === 'vehicle' || type.includes('vehicle') || type.includes('car') || type.includes('motorcycle')) {
          if (vehicleType.includes('car') || type.includes('car')) {
            return 'bi-car-front-fill';
          } else if (vehicleType.includes('motorcycle') || type.includes('motorcycle')) {
            return 'bi-bicycle';
          } else if (vehicleType.includes('truck') || type.includes('truck')) {
            return 'bi-truck-flatbed';
          } else if (vehicleType.includes('bus') || type.includes('bus')) {
            return 'bi-bus-front-fill';
          } else if (vehicleType.includes('heavy') || type.includes('machinery')) {
            return 'bi-gear-fill';
          } else if (vehicleType.includes('boat') || type.includes('boat')) {
            return 'bi-water';
          } else if (vehicleType.includes('bicycle') || type.includes('bicycle')) {
            return 'bi-bicycle';
          } else {
            return 'bi-car-front-fill';
          }
        }
        
        // Default icon
        return 'bi-tag-fill';
      }
      
      const listingIcon = getListingIcon(listing);
      const hasImage = listing.image || listing.imageUrls?.[0] || listing.images?.[0];
      
      // Determine the correct details page URL
      let detailsUrl = '/starlet-2/pages/properties/details.html?id=' + listing.id;
      if (listing.listingType === 'vehicle' || listing.type === 'vehicle') {
        detailsUrl = '/starlet-2/pages/vehicles/details.html?id=' + listing.id;
      } else if (listing.type === 'property' || listing.listingType === 'property') {
        detailsUrl = '/starlet-2/pages/properties/details.html?id=' + listing.id;
      }
      
      card.innerHTML = `
        <div class="card listing-card h-100 border-0 rounded-4 shadow-sm overflow-hidden position-relative card-modern">
          <div class="position-relative" style="aspect-ratio: 4/3; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
            ${hasImage ? 
              `<img src="${hasImage}" class="card-img-top w-100 h-100 object-fit-cover" alt="${listing.title || 'Listing Image'}" style="object-fit: cover; min-height: 180px;" onerror="this.parentElement.innerHTML='<div class=\'d-flex align-items-center justify-content-center h-100\'><i class=\'${listingIcon}\' style=\'font-size: 4rem; color: #6c757d;\'></i></div>'">` :
              `<div class="d-flex align-items-center justify-content-center h-100">
                <i class="${listingIcon}" style="font-size: 4rem; color: #6c757d;"></i>
              </div>`
            }
            <span class="position-absolute top-0 start-0 m-2 px-3 py-1 badge bg-dark bg-opacity-75 text-white rounded-pill fs-6 shadow-sm">${typeLabel}</span>
            <span class="position-absolute bottom-0 end-0 m-2 px-3 py-1 badge bg-primary bg-opacity-90 text-white rounded-pill fs-6 shadow price-badge">USh ${listing.price ? Number(listing.price).toLocaleString() : 'N/A'}</span>
            ${listing.officialStore ? '<span class=\'position-absolute top-0 end-0 m-2 px-2 py-1 badge bg-info text-white rounded-pill fs-6 shadow-sm\'><i class=\'bi bi-patch-check\'></i> Official Store</span>' : ''}
            ${listing.featured ? '<span class=\'position-absolute top-0 end-0 m-2 px-2 py-1 badge bg-warning text-dark rounded-pill fs-6 shadow-sm\' style=\'right: 90px !important;\'><i class=\'bi bi-star\'></i> Featured</span>' : ''}
            ${listing.trending ? '<span class=\'position-absolute top-0 end-0 m-2 px-2 py-1 badge bg-success text-white rounded-pill fs-6 shadow-sm\' style=\'right: 180px !important;\'><i class=\'bi bi-fire\'></i> Trending</span>' : ''}
            ${window.currentUser ? `
              <button class="btn btn-light btn-sm position-absolute top-0 end-0 m-2 save-btn" data-id="${listing.id}" title="${isSaved ? 'Remove from saved' : 'Save listing'}">
                <i class="${isSaved ? 'bi bi-heart-fill text-danger' : 'bi bi-heart'}"></i>
              </button>
            ` : ''}
          </div>
          <div class="card-body d-flex flex-column p-3">
            <h5 class="card-title fw-bold mb-1 fs-5">${listing.title || 'Untitled Listing'}</h5>
            <div class="mb-2 text-muted small"><i class="bi bi-geo-alt"></i> ${listing.location || listing.location?.district || listing.location?.city || listing.location?.neighborhood || 'Location not specified'}</div>
            <div class="d-flex align-items-center mb-2 gap-2">
              <img src="${(listing.agent && listing.agent.avatar) || (listing.storeName ? 'https://randomuser.me/api/portraits/lego/1.jpg' : 'https://randomuser.me/api/portraits/lego/2.jpg')}" alt="${(listing.agent && listing.agent.name) || listing.storeName || 'Agent'}" class="rounded-circle border border-2" width="32" height="32">
              <span class="fw-semibold small">${(listing.agent && listing.agent.name) || listing.storeName || 'Agent'}</span>
              ${(listing.agent && listing.agent.verified) || listing.officialStore ? '<i class="bi bi-patch-check-fill text-primary ms-1" title="Verified"></i>' : ''}
            </div>
            <div class="mb-2 text-secondary small">
              ${listing.bedrooms ? `<i class='bi bi-house-door'></i> ${listing.bedrooms} bd` : ''}
              ${listing.bathrooms ? `&nbsp; <i class='bi bi-droplet'></i> ${listing.bathrooms} ba` : ''}
              ${listing.year ? `<i class='bi bi-calendar'></i> ${listing.year}` : ''}
              ${listing.mileage ? `&nbsp; <i class='bi bi-speedometer2'></i> ${Number(listing.mileage).toLocaleString()} km` : ''}
            </div>
            <div class="mb-2 text-truncate" title="${listing.description || ''}">
              <span class="small">${listing.description && listing.description.length > 60 ? listing.description.slice(0, 60) + '…' : (listing.description || 'No description available')}</span>
            </div>
            <a href="${detailsUrl}" class="btn btn-primary mt-auto w-100 rounded-pill">View Details</a>
            ${window.currentUser ? `<a href="${getMessagingUrl(listing.id)}" class="btn btn-outline-secondary mt-2 w-100 rounded-pill"><i class="bi bi-chat-dots"></i> Message Agent</a>` : ''}
          </div>
        </div>
      `;
      container.appendChild(card);
    });
    
    // Add event listeners for save buttons
    if (window.currentUser) {
      container.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
          e.preventDefault();
          const listingId = this.getAttribute('data-id');
          const isSaved = this.querySelector('i').classList.contains('bi-heart-fill');
          try {
            const userDoc = db.collection('users').doc(window.currentUser.uid).collection('savedListings').doc(listingId);
            if (isSaved) {
              await userDoc.delete();
              showNotification('Removed from saved listings', 'info');
            } else {
              await userDoc.set({ savedAt: new Date() });
              showNotification('Saved listing!', 'success');
            }
            renderFeaturedListings(); // Refresh
          } catch (err) {
            showNotification('Error saving listing: ' + err.message, 'danger');
          }
        });
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="text-danger text-center">Error loading listings: ${err.message}</div>`;
  }
}

function isGuestUser() {
  return firebase.auth().currentUser && firebase.auth().currentUser.isAnonymous;
}

function restrictGuestFeatures() {
  if (!isGuestUser()) return;
  // Hide or disable add listing buttons/links
  document.querySelectorAll('.add-listing-btn, .add-listing-link').forEach(el => el.style.display = 'none');
  // Hide or disable store creation
  document.querySelectorAll('.create-store-btn, .create-store-link').forEach(el => el.style.display = 'none');
  // Hide or disable review forms/links
  document.querySelectorAll('.add-review-btn, .add-review-link, .review-form').forEach(el => el.style.display = 'none');
  // Hide agent/store contact info and contact buttons
  document.querySelectorAll('.agent-contact, .store-contact, .contact-agent-btn, .contact-store-btn').forEach(el => el.style.display = 'none');
  // Hide or disable messaging links
  document.querySelectorAll('.messaging-link, .messages-link').forEach(el => el.style.display = 'none');
  // Optionally, show a tooltip or toast if guest tries to access
  document.querySelectorAll('[data-requires-auth]').forEach(el => {
    el.onclick = function(e) {
      e.preventDefault();
      alert('You must be signed in to use this feature.');
    };
  });
}

// --- Auth Enforcement and My Listings Logic ---
function getStarletUser() {
    // Try localStorage first
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('starletUser'));
    } catch (e) {}
    return user;
}

function enforceAuth(loginPath = '/pages/auth/login.html') {
    const user = getStarletUser();
    if (user && user.uid) return;
    // Try Firebase Auth as fallback
    if (window.firebaseAuth && window.firebaseAuth.currentUser && window.firebaseAuth.currentUser.uid) return;
    // Not logged in, redirect to login with returnUrl
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
    // Dynamically detect base path for GitHub Pages subfolder support
    var path = window.location.pathname;
    var base = path.includes('/starlet-2/') ? '/starlet-2' : '';
    var fullLoginPath = base + loginPath;
    window.location.href = fullLoginPath + '?returnUrl=' + returnUrl;
}

function setupMyListingsLink(myListingsSelector = '#myListingsLink', loginPath = '/pages/auth/login.html', agentDashboardPath = '/pages/user/my-listings.html', createStorePath = '/pages/user/my-listings.html') {
    const link = document.querySelector(myListingsSelector);
    if (!link) return;
    link.addEventListener('click', async function(e) {
        e.preventDefault();
        let user = getStarletUser();
        if (!user || !user.uid) {
                    // Not logged in, go to login
        // Dynamically detect base path for GitHub Pages subfolder support
        var path = window.location.pathname;
        var base = path.includes('/starlet-2/') ? '/starlet-2' : '';
        var fullLoginPath = base + loginPath;
        window.location.href = fullLoginPath + '?returnUrl=' + encodeURIComponent(window.location.pathname);
        return;
        }
        // User is logged in, go to my-listings page
                    window.location.href = agentDashboardPath;
    });
}

// Global Auth Button Logic for all navbars
(function() {
  function updateAuthButton(user) {
    var authButton = document.getElementById('authButton');
    if (!authButton) return;
    if (user && !user.isAnonymous) {
      authButton.textContent = 'Logout';
      authButton.classList.remove('btn-outline-primary');
      authButton.classList.add('btn-danger');
      authButton.href = '#';
      authButton.onclick = function(e) {
        e.preventDefault();
        if (window.firebase && firebase.auth) {
          firebase.auth().signOut().then(function() {
            window.location.reload();
          });
        }
      };
    } else {
      authButton.textContent = 'Login / Signup';
      authButton.classList.remove('btn-danger');
      authButton.classList.add('btn-outline-primary');
      // Try to use the closest login page path
      var loginHref = authButton.getAttribute('data-login-href') || authButton.getAttribute('href') || '/pages/auth/login.html';
      // Dynamically detect base path for GitHub Pages subfolder support
      var path = window.location.pathname;
      var base = path.includes('/starlet-2/') ? '/starlet-2' : '';
      if (loginHref.startsWith('/pages/')) {
        loginHref = base + loginHref;
      }
      authButton.href = loginHref;
      authButton.onclick = null;
    }
  }
  if (window.firebase && firebase.auth) {
    firebase.auth().onAuthStateChanged(updateAuthButton);
  } else {
    updateAuthButton(null);
  }
})();

// Add this helper function at the top-level in main.js
function getMessagingUrl(listingId, listerId) {
  // Dynamically detect base path for GitHub Pages subfolder support
  var path = window.location.pathname;
  var base = path.includes('/starlet-2/') ? '/starlet-2' : '';
  let url = `${base}/pages/user/messaging.html?listingId=${listingId}`;
  if (listerId) url += `&listerId=${listerId}`;
  return url;
}

// Inject floating support button if not present
(function() {
  function injectFloatingSupportButton() {
    if (!document.getElementById('floatingSupportBtn') && document.body) {
      var btn = document.createElement('button');
      btn.id = 'floatingSupportBtn';
      btn.className = 'floating-support-btn';
      btn.title = 'Chat with Support';
      btn.innerHTML = '<i class="bi bi-headset"></i><span class="tooltip">Chat with Support</span>';
      btn.onclick = function() {
        var path = window.location.pathname;
        var base = path.includes('/starlet-2/') ? '/starlet-2' : '';
        window.location.href = base + '/pages/user/messaging.html?support=1';
      };
      document.body.appendChild(btn);
    }
  }
  
  // Try to inject immediately if body is available
  if (document.body) {
    injectFloatingSupportButton();
  } else {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', injectFloatingSupportButton);
  }
})();
