function initializeHomePage() {
    loadStatistics();
    initializeSmoothScrolling();
    initializeThemeIntegration();
    console.log('✅ Home page initialization complete');
}

function initializeThemeIntegration() {
    // Wait for theme switcher to be ready
    if (window.themeSwitcher) {
        setupThemeIntegration();
    } else {
        // Wait for theme switcher to load
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(setupThemeIntegration, 100);
        });
    }
}

function setupThemeIntegration() {
    if (window.themeSwitcher) {
        // Add theme-aware animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        });

        // Observe elements for scroll animations
        document.querySelectorAll('.feature-card, .stats-section .card').forEach(el => {
            el.classList.add('scroll-animation');
            observer.observe(el);
        });

        console.log('🎨 Theme integration initialized');
    }
}

function loadStatistics() {
    // Simulate loading statistics
    const totalPostboxesElement = document.getElementById('totalPostboxes');
    if (totalPostboxesElement) {
        let count = 0;
        const target = 15847; // Example number
        const increment = target / 100;

        const counter = setInterval(() => {
            count += increment;
            if (count >= target) {
                count = target;
                clearInterval(counter);
            }
            totalPostboxesElement.textContent = Math.floor(count).toLocaleString('cs-CZ');
        }, 20);
    }
}

function initializeSmoothScrolling() {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHomePage);