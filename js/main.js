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
if (window.firebase && firebase.auth) {
  firebase.auth().onAuthStateChanged(function(user) {
    currentUser = user;
    window.currentUser = user;
    // Optionally, update UI for logged-in state here
    // e.g., show/hide login/signup buttons
    renderFeaturedListings(); // re-render listings to show save/message buttons
    updateNavbarForAuth(user);
    restrictGuestFeatures();
  });
}

// Replace renderFeaturedListings with Firestore-powered version
async function renderFeaturedListings() {
  const container = document.getElementById('featured-listings');
  if (!container) return;
  container.innerHTML = '<div class="text-center w-100 py-4">Loading featured listings...</div>';
  try {
    const db = window.firebaseDB || (window.firebase && firebase.firestore());
    if (!db) {
      container.innerHTML = '<div class="text-danger text-center">Firestore not initialized. Please check your Firebase setup.</div>';
      return;
    }
    const querySnap = await db.collection('listings').where('featured', '==', true).limit(12).get();
    if (querySnap.empty) {
      container.innerHTML = '<div class="text-muted text-center">No featured listings found.</div>';
      return;
    }
    container.innerHTML = '';
    let savedIds = new Set();
    if (window.currentUser) {
      // Fetch saved listings for the user
      const savedSnap = await db.collection('users').doc(window.currentUser.uid).collection('savedListings').get();
      savedIds = new Set(savedSnap.docs.map(doc => doc.id));
    }
    querySnap.forEach(doc => {
      const listing = doc.data();
      const isSaved = savedIds.has(doc.id);
      const card = document.createElement('div');
      card.className = 'col-md-4 col-lg-3 mb-4';
      card.innerHTML = `
        <div class="card listing-card h-100 border-0 rounded-4 shadow-sm overflow-hidden position-relative card-modern">
          <div class="position-relative" style="aspect-ratio: 4/3; background: #f5f5f5;">
            <img src="${listing.image || ''}" class="card-img-top w-100 h-100 object-fit-cover" alt="${listing.title || ''}" style="object-fit: cover; min-height: 180px;">
            <span class="position-absolute top-0 start-0 m-2 px-3 py-1 badge bg-dark bg-opacity-75 text-white rounded-pill fs-6 shadow-sm">${listing.type || ''}</span>
            <span class="position-absolute bottom-0 end-0 m-2 px-3 py-1 badge bg-primary bg-opacity-90 text-white rounded-pill fs-6 shadow price-badge">USh ${listing.price ? listing.price.toLocaleString() : ''}</span>
            ${listing.featured ? '<span class=\'position-absolute top-0 end-0 m-2 px-2 py-1 badge bg-warning text-dark rounded-pill fs-6 shadow-sm\'>Featured</span>' : ''}
            ${listing.officialStore ? '<span class=\'position-absolute top-0 end-0 m-2 px-2 py-1 badge bg-info text-white rounded-pill fs-6 shadow-sm\' style=\'right: 90px !important;\'><i class=\'bi bi-patch-check\'></i> Official Store</span>' : ''}
            ${window.currentUser ? `
              <button class="btn btn-light btn-sm position-absolute top-0 end-0 m-2 save-btn" data-id="${doc.id}" title="${isSaved ? 'Remove from saved' : 'Save listing'}">
                <i class="${isSaved ? 'bi bi-heart-fill text-danger' : 'bi bi-heart'}"></i>
              </button>
            ` : ''}
          </div>
          <div class="card-body d-flex flex-column p-3">
            <h5 class="card-title fw-bold mb-1 fs-5">${listing.title || ''}</h5>
            <div class="mb-2 text-muted small"><i class="bi bi-geo-alt"></i> ${listing.location || ''}</div>
            <div class="d-flex align-items-center mb-2 gap-2">
              <img src="${(listing.agent && listing.agent.avatar) || 'https://randomuser.me/api/portraits/lego/1.jpg'}" alt="${(listing.agent && listing.agent.name) || 'Agent'}" class="rounded-circle border border-2" width="32" height="32">
              <span class="fw-semibold small">${(listing.agent && listing.agent.name) || 'Agent'}</span>
              ${(listing.agent && listing.agent.verified) ? '<i class="bi bi-patch-check-fill text-primary ms-1" title="Verified"></i>' : ''}
            </div>
            <div class="mb-2 text-secondary small">
              ${listing.bedrooms ? `<i class='bi bi-house-door'></i> ${listing.bedrooms} bd` : ''}
              ${listing.bathrooms ? `&nbsp; <i class='bi bi-droplet'></i> ${listing.bathrooms} ba` : ''}
              ${listing.year ? `<i class='bi bi-calendar'></i> ${listing.year}` : ''}
              ${listing.mileage ? `&nbsp; <i class='bi bi-speedometer2'></i> ${listing.mileage.toLocaleString()} km` : ''}
            </div>
            <div class="mb-2 text-truncate" title="${listing.description || ''}">
              <span class="small">${listing.description && listing.description.length > 60 ? listing.description.slice(0, 60) + '…' : (listing.description || '')}</span>
            </div>
            <a href="details.html?id=${doc.id}" class="btn btn-primary mt-auto w-100 rounded-pill">View Details</a>
            ${window.currentUser ? `<a href="messaging.html?listingId=${doc.id}" class="btn btn-outline-secondary mt-2 w-100 rounded-pill"><i class="bi bi-chat-dots"></i> Message Agent</a>` : ''}
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

function updateNavbarForAuth(user) {
  const nav = document.querySelector('.navbar-nav');
  if (!nav) return;
  // Remove any previously added custom nav items
  nav.querySelectorAll('.auth-nav-item').forEach(el => el.remove());
  if (!user || user.isAnonymous) return;
  // Find the first login or register nav-item to insert before
  const loginItem = nav.querySelector('a[href="login.html"]')?.closest('li');
  const registerItem = nav.querySelector('a[href="register.html"]')?.closest('li');
  const insertBefore = loginItem || registerItem || null;
  // Messages
  const msgLi = document.createElement('li');
  msgLi.className = 'nav-item auth-nav-item';
  msgLi.innerHTML = '<a class="nav-link" href="messaging.html"><i class="bi bi-chat-dots"></i> Messages</a>';
  nav.insertBefore(msgLi, insertBefore);
  // My Store
  const storeLi = document.createElement('li');
  storeLi.className = 'nav-item auth-nav-item';
  storeLi.innerHTML = '<a class="nav-link" href="stores.html"><i class="bi bi-shop"></i> My Store</a>';
  nav.insertBefore(storeLi, insertBefore);
  // Saved Listings
  const savedLi = document.createElement('li');
  savedLi.className = 'nav-item auth-nav-item';
  savedLi.innerHTML = '<a class="nav-link" href="saved.html"><i class="bi bi-bookmark-heart"></i> Saved Listings</a>';
  nav.insertBefore(savedLi, insertBefore);
  // Hide the static #nav-messaging-link if present
  const staticMsg = document.getElementById('nav-messaging-link');
  if (staticMsg) staticMsg.style.display = 'none';
}

async function enforceAuth(requiredRole) {
  return new Promise((resolve, reject) => {
    firebase.auth().onAuthStateChanged(async user => {
      if (!user || user.isAnonymous) {
        window.location.href = 'login.html';
        return reject('Not logged in');
      }
      if (requiredRole) {
        // Check user role in Firestore
        const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data().role !== requiredRole) {
          alert('You do not have permission to access this page.');
          window.location.href = 'index.html';
          return reject('Not authorized');
        }
      }
      resolve(user);
    });
  });
}
window.enforceAuth = enforceAuth;
