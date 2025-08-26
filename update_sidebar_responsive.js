const fs = require('fs');
const path = require('path');

// Admin pages to update
const adminPages = [
  'pages/admin/dashboard.html',
  'pages/admin/official-store.html',
  'pages/admin/listings.html',
  'pages/admin/users.html',
  'pages/admin/stores.html',
  'pages/admin/analytics.html',
  'pages/admin/messages.html',
  'pages/admin/reviews.html',
  'pages/admin/settings.html'
];

// Updated CSS styles for responsive sidebar
const updatedSidebarCSS = `
     /* Sidebar Toggle Functionality */
     .admin-sidebar {
       position: fixed;
       top: 0;
       left: 0;
       height: 100vh;
       width: 280px;
       background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
       color: white;
       z-index: 1040;
       transition: all 0.3s ease;
       box-shadow: 2px 0 10px rgba(0,0,0,0.1);
       overflow-y: auto;
     }
     
     .admin-sidebar.collapsed {
       width: 70px;
     }
     
     .admin-sidebar.collapsed .nav-text {
       opacity: 0;
       visibility: hidden;
       width: 0;
       overflow: hidden;
     }
     
     .admin-sidebar.collapsed .sidebar-brand {
       opacity: 0;
       visibility: hidden;
       width: 0;
       overflow: hidden;
     }
     
     .admin-sidebar.collapsed .nav-link {
       justify-content: center;
       padding: 0.75rem 0.5rem;
     }
     
     .admin-sidebar.collapsed .nav-link i {
       margin: 0;
       font-size: 1.2rem;
     }
     
     .admin-sidebar .sidebar-header {
       border-bottom: 1px solid rgba(255,255,255,0.1);
       background: rgba(0,0,0,0.1);
     }
     
     .admin-sidebar .sidebar-brand {
       font-size: 1.25rem;
       font-weight: 600;
     }
     
     .admin-sidebar .nav-link {
       color: rgba(255,255,255,0.8);
       padding: 0.75rem 1rem;
       border-radius: 8px;
       margin-bottom: 0.25rem;
       transition: all 0.3s ease;
       display: flex;
       align-items: center;
       gap: 0.75rem;
     }
     
     .admin-sidebar .nav-link:hover {
       color: white;
       background: rgba(255,255,255,0.1);
       transform: translateX(5px);
     }
     
     .admin-sidebar .nav-link.active {
       background: #0d6efd;
       color: white;
       box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
     }
     
     .admin-sidebar .nav-link i {
       width: 20px;
       text-align: center;
     }
     
     /* Sidebar Toggle Button */
     .sidebar-toggle {
       transition: all 0.3s ease;
       border-radius: 8px;
       padding: 0.5rem 0.75rem;
     }
     
     .sidebar-toggle:hover {
       transform: scale(1.05);
       box-shadow: 0 2px 8px rgba(13, 110, 253, 0.2);
     }
     
     .sidebar-toggle .bi-list {
       transition: transform 0.3s ease;
     }
     
     .sidebar-toggle.active .bi-list {
       transform: rotate(90deg);
     }
     
     /* Main Content Adjustment */
     .admin-panel {
       padding-left: 280px;
       transition: padding-left 0.3s ease;
     }
     
     .admin-panel.sidebar-collapsed {
       padding-left: 70px;
     }
     
     /* Admin Navbar */
     .admin-navbar {
       background: white;
       border-bottom: 1px solid #dee2e6;
       padding: 1rem 2rem;
       box-shadow: 0 2px 4px rgba(0,0,0,0.1);
       position: sticky;
       top: 0;
       z-index: 1030;
     }
     
     /* Notification Badge */
     #notificationBadge {
       animation: pulse 2s infinite;
     }
     
     @keyframes pulse {
       0% { transform: scale(1); }
       50% { transform: scale(1.1); }
       100% { transform: scale(1); }
     }
     
     /* Responsive adjustments */
     @media (max-width: 768px) {
       /* Mobile sidebar behavior */
       .admin-sidebar {
         transform: translateX(-100%);
         width: 280px;
       }
       
       .admin-sidebar.show {
         transform: translateX(0);
       }
       
       .admin-sidebar.collapsed {
         transform: translateX(-100%);
         width: 280px;
       }
       
       .admin-panel {
         padding-left: 0;
       }
       
       .admin-panel.sidebar-collapsed {
         padding-left: 0;
       }
       
       .admin-navbar {
         padding: 1rem;
       }
     }
     
     @media (max-width: 576px) {
       .admin-navbar .navbar-brand {
         font-size: 1rem;
       }
       
       .sidebar-toggle {
         padding: 0.4rem 0.6rem;
       }
     }`;

// Updated JavaScript functionality
const updatedSidebarJS = `
       // Toggle sidebar
       sidebarToggle.addEventListener('click', () => {
         // Only toggle on desktop
         if (window.innerWidth > 768) {
           const isCollapsed = sidebar.classList.contains('collapsed');
           
           if (isCollapsed) {
             // Show sidebar
             sidebar.classList.remove('collapsed');
             adminPanel.classList.remove('sidebar-collapsed');
             sidebarToggle.classList.remove('active');
             localStorage.setItem('sidebarCollapsed', 'false');
           } else {
             // Hide sidebar
             sidebar.classList.add('collapsed');
             adminPanel.classList.add('sidebar-collapsed');
             sidebarToggle.classList.add('active');
             localStorage.setItem('sidebarCollapsed', 'true');
           }
         } else {
           // On mobile, toggle overlay
           const isVisible = sidebar.classList.contains('show');
           if (isVisible) {
             sidebar.classList.remove('show');
           } else {
             sidebar.classList.add('show');
           }
         }
       });
       
       // Close sidebar on mobile
       sidebarCloseBtn.addEventListener('click', () => {
         sidebar.classList.remove('show');
       });
       
       // Handle mobile sidebar behavior
       function handleMobileSidebar() {
         if (window.innerWidth <= 768) {
           // On mobile, always use overlay behavior
           sidebar.classList.remove('collapsed');
           sidebar.classList.add('show');
           adminPanel.classList.remove('sidebar-collapsed');
         } else {
           // On desktop, use the collapsed state
           sidebar.classList.remove('show');
           const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
           if (sidebarCollapsed) {
             sidebar.classList.add('collapsed');
             adminPanel.classList.add('sidebar-collapsed');
             sidebarToggle.classList.add('active');
           } else {
             sidebar.classList.remove('collapsed');
             adminPanel.classList.remove('sidebar-collapsed');
             sidebarToggle.classList.remove('active');
           }
         }
       }
       
       // Handle window resize
       window.addEventListener('resize', handleMobileSidebar);
       
       // Initial mobile check
       handleMobileSidebar();
       
       // Close sidebar when clicking outside on mobile
       document.addEventListener('click', (e) => {
         if (window.innerWidth <= 768) {
           if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
             sidebar.classList.remove('show');
           }
         }
       });`;

// Function to update a single file
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    console.log(`Updating ${fileName}...`);
    
    // Replace the old CSS with new responsive CSS
    const oldCSSRegex = /\/\* Sidebar Toggle Functionality \*\/[\s\S]*?@media \(max-width: 576px\) \{[\s\S]*?\}/;
    if (oldCSSRegex.test(content)) {
      content = content.replace(oldCSSRegex, updatedSidebarCSS);
    }
    
    // Replace the old JavaScript toggle functionality
    const oldJSRegex = /\/\/ Toggle sidebar[\s\S]*?document\.addEventListener\('click', \(e\) => \{[\s\S]*?\}\);?\s*$/m;
    if (oldJSRegex.test(content)) {
      content = content.replace(oldJSRegex, updatedSidebarJS);
    }
    
    // Update initialization logic
    const initRegex = /\/\/ Initialize sidebar state[\s\S]*?if \(sidebarCollapsed\) \{[\s\S]*?\}/;
    if (initRegex.test(content)) {
      content = content.replace(initRegex, `       // Initialize sidebar state (only on desktop)
       if (window.innerWidth > 768 && sidebarCollapsed) {
         sidebar.classList.add('collapsed');
         adminPanel.classList.add('sidebar-collapsed');
         sidebarToggle.classList.add('active');
       }`);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${fileName}`);
    
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all files
console.log('🚀 Starting responsive sidebar updates...\n');

adminPages.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    updateFile(filePath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n🎉 Responsive sidebar updates completed!');
