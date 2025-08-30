// Admin Authentication Enhancement
// This script ensures admin authentication is properly enforced

(function() {
    'use strict';
    
    // Admin configuration
    const ADMIN_EMAILS = [
        'admin@starletproperties.ug',
        'admin@starlet.co.ug'
    ];
    
    // Check if current page is an admin page
    function isAdminPage() {
        return window.location.pathname.includes('/admin/');
    }
    
    // Check if user is admin
    async function checkAdminStatus() {
        return new Promise((resolve) => {
            if (!window.firebaseAuth) {
                resolve({ isAdmin: false, reason: 'Firebase not initialized' });
                return;
            }
            
            window.firebaseAuth.onAuthStateChanged(async (user) => {
                if (!user || user.isAnonymous) {
                    resolve({ isAdmin: false, reason: 'Not logged in' });
                    return;
                }
                
                // Check admin email
                const isAdminEmail = user.email && ADMIN_EMAILS.some(
                    adminEmail => user.email.toLowerCase() === adminEmail.toLowerCase()
                );
                
                if (isAdminEmail) {
                    resolve({ isAdmin: true, user, reason: 'Admin email' });
                    return;
                }
                
                // Check Firestore role
                try {
                    if (window.firebaseDB) {
                        const userDoc = await window.firebaseDB.collection('users').doc(user.uid).get();
                        if (userDoc.exists && userDoc.data().role === 'admin') {
                            resolve({ isAdmin: true, user, reason: 'Admin role in Firestore' });
                            return;
                        }
                    }
                } catch (error) {
                    console.error('Error checking Firestore role:', error);
                }
                
                resolve({ isAdmin: false, reason: 'Not admin' });
            });
        });
    }
    
    // Redirect to appropriate page
    function redirectToPage(url) {
        const base = window.location.pathname.includes('/starlet-2/') ? '/starlet-2' : '';
        window.location.href = base + url;
    }
    
    // Enforce admin access on admin pages
    async function enforceAdminAccess() {
        if (!isAdminPage()) {
            return; // Not an admin page, no need to enforce
        }
        
        console.log('🔒 Enforcing admin access on:', window.location.pathname);
        
        const adminStatus = await checkAdminStatus();
        
        if (!adminStatus.isAdmin) {
            console.log('❌ Access denied:', adminStatus.reason);
            
            // Show access denied message
            const message = document.createElement('div');
            message.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
            message.style.zIndex = '9999';
            message.innerHTML = `
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Access Denied:</strong> Admin access required. Redirecting to login...
            `;
            document.body.appendChild(message);
            
            // Redirect to login after delay
            setTimeout(() => {
                redirectToPage('/pages/auth/login.html?returnUrl=' + encodeURIComponent(window.location.href));
            }, 2000);
        } else {
            console.log('✅ Admin access verified:', adminStatus.reason);
        }
    }
    
    // Auto-redirect admin users from login page to dashboard
    async function redirectAdminFromLogin() {
        if (!window.location.pathname.includes('/auth/login.html')) {
            return; // Not on login page
        }
        
        console.log('🔍 Checking if user is admin on login page');
        
        const adminStatus = await checkAdminStatus();
        
        if (adminStatus.isAdmin) {
            console.log('✅ Admin detected on login page, redirecting to dashboard');
            
            // Check if there's a returnUrl that's an admin page
            const params = new URLSearchParams(window.location.search);
            const returnUrl = params.get('returnUrl');
            
            if (returnUrl && returnUrl.includes('/admin/')) {
                console.log('✅ Admin has admin returnUrl, redirecting to:', returnUrl);
                setTimeout(() => {
                    window.location.href = returnUrl;
                }, 1500);
            } else {
                // Show redirect message
                const message = document.createElement('div');
                message.className = 'alert alert-info position-fixed top-0 start-50 translate-middle-x mt-3';
                message.style.zIndex = '9999';
                message.innerHTML = `
                    <i class="bi bi-person-check"></i>
                    <strong>Welcome Admin!</strong> Redirecting to admin dashboard...
                `;
                document.body.appendChild(message);
                
                // Redirect to admin dashboard
                setTimeout(() => {
                    redirectToPage('/pages/admin/dashboard.html');
                }, 1500);
            }
        }
    }
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Wait for Firebase to be available
        const checkFirebase = () => {
            if (window.firebaseAuth && window.firebaseDB) {
                console.log('✅ Firebase initialized, checking admin access');
                enforceAdminAccess();
                redirectAdminFromLogin();
            } else {
                // Retry after a short delay
                setTimeout(checkFirebase, 100);
            }
        };
        
        checkFirebase();
    });
    
    // Export functions for manual use
    window.AdminAuthEnhancement = {
        checkAdminStatus,
        enforceAdminAccess,
        redirectAdminFromLogin
    };
    
})();
