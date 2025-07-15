console.log('🚀 ThemeSwitcher.js loaded');

class ThemeSwitcher {
    constructor() {
        console.log('🎨 ThemeSwitcher constructor called');
        this.currentTheme = localStorage.getItem('theme') || 'light';
        console.log('Current theme:', this.currentTheme);
        this.init();
    }

    init() {
        console.log('🔧 Initializing theme switcher...');
        this.createThemeButton();
        this.applyTheme(this.currentTheme);
        this.bindEvents();
        console.log('✅ Theme switcher initialized');
    }

    createThemeButton() {
        console.log('🔘 Creating theme button...');

        // Create theme toggle button
        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Přepnout téma');
        button.innerHTML = this.getButtonIcon();

        // Find the navbar to position the button relative to it
        const navbar = document.querySelector('.navbar .container');
        if (navbar) {
            // Create a wrapper div to position the button
            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'theme-toggle-wrapper';
            buttonWrapper.appendChild(button);
            navbar.appendChild(buttonWrapper);
            console.log('✅ Theme toggle button added to navbar');
        } else {
            // Fallback to body if navbar not found
            document.body.appendChild(button);
            console.log('⚠️ Navbar not found, button added to body');
        }

        // Store reference
        this.button = button;

        console.log('✅ Theme toggle button created and added to DOM');
    }

    getButtonIcon() {
        if (this.currentTheme === 'light') {
            return '<i class="bi bi-moon-fill"></i> Tmavé';
        } else {
            return '<i class="bi bi-sun-fill"></i> Světlé';
        }
    }

    bindEvents() {
        console.log('🔗 Binding events...');

        this.button.addEventListener('click', () => {
            console.log('🖱️ Button clicked');
            this.toggleTheme();
        });

        // Add keyboard support
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                console.log('⌨️ Keyboard activation');
                this.toggleTheme();
            }
        });

        console.log('✅ Events bound');
    }

    toggleTheme() {
        console.log('🔄 Toggling theme...');
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        console.log('New theme will be:', newTheme);
        this.setTheme(newTheme);

        // Add visual feedback
        this.button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.button.style.transform = 'scale(1)';
        }, 100);

        console.log(`🎨 Theme switched to: ${newTheme}`);
    }

    setTheme(theme) {
        console.log('🎨 Setting theme to:', theme);
        this.currentTheme = theme;
        this.applyTheme(theme);
        this.saveTheme(theme);
        this.updateButtonText();
    }

    applyTheme(theme) {
        console.log('🎨 Applying theme:', theme);
        const cssLink = document.querySelector('link[href*="home.css"], link[href*="index.css"], link[href*="dark-home.css"], link[href*="dark-index.css"]');

        if (cssLink) {
            console.log('Found CSS link:', cssLink.href);
            if (theme === 'dark') {
                if (cssLink.href.includes('home.css')) {
                    cssLink.href = cssLink.href.replace('home.css', 'dark-home.css');
                } else if (cssLink.href.includes('index.css')) {
                    cssLink.href = cssLink.href.replace('index.css', 'dark-index.css');
                }
            } else {
                if (cssLink.href.includes('dark-home.css')) {
                    cssLink.href = cssLink.href.replace('dark-home.css', 'home.css');
                } else if (cssLink.href.includes('dark-index.css')) {
                    cssLink.href = cssLink.href.replace('dark-index.css', 'index.css');
                }
            }
            console.log('Updated CSS link to:', cssLink.href);
        } else {
            console.error('❌ Could not find CSS link element');
        }

        // Add theme class to body for additional styling
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add(`${theme}-theme`);

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        metaThemeColor.content = theme === 'dark' ? '#1a1a1a' : '#ffffff';
    }

    updateButtonText() {
        this.button.innerHTML = this.getButtonIcon();
        console.log('🔄 Button text updated');
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
        console.log('💾 Theme saved to localStorage:', theme);
    }

    // Public method to get current theme
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Public method to check if dark theme is active
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing ThemeSwitcher...');
    window.themeSwitcher = new ThemeSwitcher();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeSwitcher;
}