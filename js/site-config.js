/**
 * Websirg - Centralized Site Configuration & Component Helper
 */

(function () {
    const DEFAULT_CONFIG = {
        siteName: "Websirg",
        shortName: "Websirg",
        phone: "9354631515",
        phoneFormatted: "+91 9354631515",
        email: "info@websirg.com",
        address: "Delhi NCR, India",
        copyrightYear: new Date().getFullYear()
    };

    window.SITE_CONFIG = DEFAULT_CONFIG;

    // Load config.json if accessible via HTTP
    async function loadConfig() {
        try {
            const res = await fetch('config.json');
            if (res.ok) {
                const data = await res.json();
                window.SITE_CONFIG = Object.assign({}, DEFAULT_CONFIG, data);
            }
        } catch (e) {
            // Use DEFAULT_CONFIG
        }
        applyConfig();
    }

    // Apply config values to DOM
    function applyConfig() {
        const config = window.SITE_CONFIG;

        // Company Name
        document.querySelectorAll('.site-name').forEach(el => {
            el.textContent = config.siteName;
        });

        // Phone text
        document.querySelectorAll('.site-phone').forEach(el => {
            el.textContent = config.phoneFormatted || config.phone;
        });

        // Phone links
        document.querySelectorAll('.site-phone-link').forEach(el => {
            el.setAttribute('href', 'tel:' + config.phone);
        });

        // Email text
        document.querySelectorAll('.site-email').forEach(el => {
            el.textContent = config.email;
        });

        // Email links
        document.querySelectorAll('.site-email-link').forEach(el => {
            el.setAttribute('href', 'mailto:' + config.email);
        });

        // Dynamic attribute bindings [data-config="property"]
        document.querySelectorAll('[data-config]').forEach(el => {
            const key = el.getAttribute('data-config');
            if (config[key]) {
                el.textContent = config[key];
            }
        });
    }

    // Highlight current active navigation link
    function highlightActiveNav() {
        let currentPage = window.location.pathname.split('/').pop();
        if (!currentPage || currentPage === '' || currentPage === '/') {
            currentPage = 'index.html';
        }

        const navLinks = document.querySelectorAll('#navbar-main .navbar-nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const targetPage = href.split('/').pop();

            if (targetPage === currentPage) {
                link.classList.add('active');
                // Highlight parent dropdown if inside one
                const parentDropdown = link.closest('.dropdown');
                if (parentDropdown) {
                    const toggle = parentDropdown.querySelector('.dropdown-toggle');
                    if (toggle) toggle.classList.add('active');
                }
            }
        });
    }

    // Client-side fallback include loader (if server-side include was not pre-rendered)
    async function loadFallbackIncludes() {
        const includes = [
            { selector: '#site-header', file: 'components/header.html' },
            { selector: '#site-footer', file: 'components/footer.html' },
            { selector: '#site-quote-modal', file: 'components/quote-modal.html' }
        ];

        for (const inc of includes) {
            const container = document.querySelector(inc.selector);
            if (container && (!container.innerHTML || container.innerHTML.trim().startsWith('<!--#include'))) {
                try {
                    const res = await fetch(inc.file);
                    if (res.ok) {
                        container.innerHTML = await res.text();
                    }
                } catch (e) {
                    console.error('Failed to load include:', inc.file, e);
                }
            }
        }

        applyConfig();
        highlightActiveNav();
    }

    // Sticky Header Scroll Handler
    function setupStickyHeader() {
        const header = document.querySelector('.header-wrapper');
        const btt = document.getElementById('toBackToTop');

        function onScroll() {
            if (header) {
                if (window.pageYOffset > 35) {
                    header.classList.add('is-scrolled');
                } else {
                    header.classList.remove('is-scrolled');
                }
            }

            if (btt) {
                if (window.pageYOffset > 280) {
                    btt.classList.add('is-visible');
                } else {
                    btt.classList.remove('is-visible');
                }
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        if (btt) {
            btt.addEventListener('click', (e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // Smooth Desktop & Mobile Dropdown Handling
    function setupDropdownInteractions() {
        const dropdownElements = document.querySelectorAll('#navbar-main .dropdown');

        dropdownElements.forEach(dd => {
            let timeoutId;
            const toggle = dd.querySelector('.dropdown-toggle');
            const menu = dd.querySelector('.dropdown-menu');
            if (!toggle || !menu) return;

            // Desktop Hover with 180ms buffer (prevents accidental closing)
            dd.addEventListener('mouseenter', () => {
                if (window.innerWidth >= 992) {
                    clearTimeout(timeoutId);
                    dropdownElements.forEach(other => {
                        if (other !== dd) {
                            other.classList.remove('show');
                            const otherMenu = other.querySelector('.dropdown-menu');
                            if (otherMenu) otherMenu.classList.remove('show');
                        }
                    });
                    dd.classList.add('show');
                    menu.classList.add('show');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });

            dd.addEventListener('mouseleave', () => {
                if (window.innerWidth >= 992) {
                    timeoutId = setTimeout(() => {
                        dd.classList.remove('show');
                        menu.classList.remove('show');
                        toggle.setAttribute('aria-expanded', 'false');
                    }, 180);
                }
            });

            // On Desktop: If clicking on a toggle with a valid page URL (like blog.html), navigate to it
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth >= 992) {
                    const href = toggle.getAttribute('href');
                    if (href && href !== '#' && href !== 'javascript:void(0)') {
                        window.location.href = href;
                    }
                }
            });
        });
    }

    // Run on DOM ready
    function init() {
        loadFallbackIncludes();
        loadConfig();
        highlightActiveNav();
        setupStickyHeader();
        setupDropdownInteractions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
