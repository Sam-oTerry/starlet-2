/**
 * Star Loading Animation Utility
 * Provides easy functions to show and hide the star loading animation
 */

// Show star loading animation
function showStarLoading(container, message = 'Loading...') {
    if (!container) return;
    
    const loadingHTML = `
        <div class="loading-container">
            <div class="star-loading">
                <div class="star"></div>
                <div class="star"></div>
                <div class="star"></div>
            </div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    container.innerHTML = loadingHTML;
}

// Show star loading animation with Bootstrap Icons
function showStarLoadingAlt(container, message = 'Loading...') {
    if (!container) return;
    
    const loadingHTML = `
        <div class="loading-container">
            <div class="star-loading-alt">
                <i class="bi bi-star-fill star"></i>
                <i class="bi bi-star-fill star"></i>
                <i class="bi bi-star-fill star"></i>
            </div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    container.innerHTML = loadingHTML;
}

// Show full-screen star loading overlay
function showFullScreenStarLoading(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.id = 'fullScreenStarLoading';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2000;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
    `;
    
    overlay.innerHTML = `
        <div class="loading-container">
            <div class="star-loading">
                <div class="star"></div>
                <div class="star"></div>
                <div class="star"></div>
            </div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Hide full-screen star loading overlay
function hideFullScreenStarLoading() {
    const overlay = document.getElementById('fullScreenStarLoading');
    if (overlay) {
        overlay.remove();
    }
}

// Show star loading in a specific element with custom styling
function showStarLoadingInElement(element, message = 'Loading...', customClass = '') {
    if (!element) return;
    
    const loadingHTML = `
        <div class="loading-container ${customClass}">
            <div class="star-loading">
                <div class="star"></div>
                <div class="star"></div>
                <div class="star"></div>
            </div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    element.innerHTML = loadingHTML;
}

// Replace existing loading spinners with star loading
function replaceSpinnersWithStars() {
    // Replace Bootstrap spinners
    const spinners = document.querySelectorAll('.spinner-border, .spinner-grow');
    spinners.forEach(spinner => {
        const container = spinner.closest('.d-flex') || spinner.parentElement;
        if (container) {
            const message = container.querySelector('.visually-hidden')?.textContent || 'Loading...';
            showStarLoading(container, message);
        }
    });
    
    // Replace text loading messages
    const loadingTexts = document.querySelectorAll('div:contains("Loading..."), div:contains("Loading")');
    loadingTexts.forEach(element => {
        if (element.textContent.includes('Loading')) {
            showStarLoading(element, element.textContent);
        }
    });
}

// Auto-replace loading elements on page load
document.addEventListener('DOMContentLoaded', function() {
    // Replace any existing loading spinners
    replaceSpinnersWithStars();
});

// Export functions for use in other scripts
window.StarLoading = {
    show: showStarLoading,
    showAlt: showStarLoadingAlt,
    showFullScreen: showFullScreenStarLoading,
    hideFullScreen: hideFullScreenStarLoading,
    showInElement: showStarLoadingInElement,
    replaceSpinners: replaceSpinnersWithStars
}; 