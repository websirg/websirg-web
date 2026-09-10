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
        notificationEmail: "websirg@gmail.com",
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

    // ============================================================
    // Centralized Animated Number Counter Site-wide (Continuous / Re-triggerable)
    // Animates metrics like 250+, 150+, 5+, 24/7, 24,000+, 99.8%
    // Automatically runs EVERY time user scrolls into view or hovers
    // ============================================================
    function setupCounterAnimations() {
        const counterSelectors = '.ws-stat-number, .ws-counter-num, .counter, .counterUp, [data-counter]';
        const elements = document.querySelectorAll(counterSelectors);
        if (!elements.length) return;

        function parseNumber(str) {
            str = (str || '').trim();
            const match = str.match(/^([^0-9]*)([0-9,]+(?:\.[0-9]+)?)(.*)$/);
            if (!match) return null;
            const prefix = match[1] || '';
            const numStr = match[2] || '';
            const suffix = match[3] || '';
            const hasComma = numStr.indexOf(',') !== -1;
            const cleanNum = parseFloat(numStr.replace(/,/g, ''));
            const decimals = (numStr.indexOf('.') !== -1) ? (numStr.split('.')[1].length) : 0;
            if (isNaN(cleanNum)) return null;
            return { prefix, target: cleanNum, decimals, suffix, hasComma, raw: str };
        }

        function formatValue(val, decimals, hasComma) {
            let s = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
            if (hasComma) {
                const parts = s.split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                s = parts.join('.');
            }
            return s;
        }

        function easeOutExpo(t) {
            return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        function resetCounter(el) {
            if (el._animId) {
                cancelAnimationFrame(el._animId);
                el._animId = null;
            }
            el.setAttribute('data-counter-running', 'false');
            el.classList.remove('ws-downcount-active');
            const raw = el.getAttribute('data-counter-raw');
            if (raw) {
                const p = parseNumber(raw);
                if (p) {
                    el.textContent = p.prefix + (p.decimals > 0 ? (0).toFixed(p.decimals) : '0') + p.suffix;
                }
            }
        }

        function animateCounter(el) {
            if (el.getAttribute('data-counter-running') === 'true') {
                return;
            }
            el.setAttribute('data-counter-running', 'true');

            // Apply down-count subtle slide-down ticker class (NO ROTATION)
            el.classList.remove('ws-downcount-active');
            void el.offsetWidth; // force reflow
            el.classList.add('ws-downcount-active');

            const parentCard = el.closest('.ws-stat-card, .ws-counter-item');
            if (parentCard) {
                parentCard.classList.remove('ws-card-active');
                void parentCard.offsetWidth;
                parentCard.classList.add('ws-card-active');
            }

            const raw = el.getAttribute('data-counter-raw') || el.textContent.trim();
            const parsed = parseNumber(raw);
            if (!parsed) {
                el.setAttribute('data-counter-running', 'false');
                return;
            }

            const duration = 1300;
            const startTime = performance.now();
            const startVal = 0;

            function update(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutExpo(progress);
                const currentVal = startVal + (parsed.target - startVal) * eased;

                el.textContent = parsed.prefix + formatValue(currentVal, parsed.decimals, parsed.hasComma) + parsed.suffix;

                if (progress < 1) {
                    el._animId = requestAnimationFrame(update);
                } else {
                    el.textContent = parsed.raw;
                    el.setAttribute('data-counter-running', 'false');
                    el._animId = null;
                }
            }

            el._animId = requestAnimationFrame(update);
        }

        elements.forEach(el => {
            if (!el.getAttribute('data-counter-raw')) {
                const raw = el.textContent.trim();
                const p = parseNumber(raw);
                if (p) {
                    el.setAttribute('data-counter-raw', raw);
                    el.textContent = p.prefix + (p.decimals > 0 ? (0).toFixed(p.decimals) : '0') + p.suffix;
                }
            }
        });

        // Continuous Observer: Runs counter EVERY time user scrolls into view
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                    } else {
                        // Reset when scrolled out of view so it animates fresh on return
                        resetCounter(entry.target);
                    }
                });
            }, { threshold: 0.15 });

            elements.forEach(el => observer.observe(el));
        } else {
            elements.forEach(el => animateCounter(el));
        }

        // Also re-trigger on card hover
        document.querySelectorAll('.ws-stat-card, .ws-counter-item').forEach(card => {
            if (!card._counterBound) {
                card._counterBound = true;
                card.addEventListener('mouseenter', () => {
                    const num = card.querySelector(counterSelectors);
                    if (num && num.getAttribute('data-counter-running') !== 'true') {
                        resetCounter(num);
                        animateCounter(num);
                    }
                });
            }
        });
    }

    // ============================================================
    // Universal Automatic Form Data Dispatcher to websirg@gmail.com
    // Automatically transmits all form fields, selections, and messages
    // directly to websirg@gmail.com whenever any user submits any form
    // ============================================================
    const TARGET_NOTIFICATION_EMAIL = "websirg@gmail.com";

    window.submitWebsirgForm = async function(formElement, options = {}) {
        if (!formElement) return false;

        const formData = new FormData(formElement);
        const data = {};

        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        for (const k in data) {
            if (Array.isArray(data[k])) {
                data[k] = data[k].join(', ');
            }
        }

        const senderName = data.full_name || data.name || 'New Inquirer';
        const formSource = options.formType || formElement.getAttribute('id') || "Website Form";
        const subject = options.subject || `🚀 New Lead: ${senderName} (${formSource})`;
        
        const payload = {
            _subject: subject,
            _replyto: data.email || '',
            _template: "table",
            _captcha: "false",
            "Form Source": formSource,
            "Page URL": window.location.href,
            "Submitted At": new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            ...data
        };

        // Local Storage Lead Vault Backup
        try {
            const leads = JSON.parse(localStorage.getItem('websirg_leads') || '[]');
            leads.push(payload);
            localStorage.setItem('websirg_leads', JSON.stringify(leads));
        } catch (e) {}

        console.log(`[Websirg Form Auto-Share] Transmitting lead data to ${TARGET_NOTIFICATION_EMAIL}:`, payload);

        // Send directly to websirg@gmail.com via FormSubmit.co
        try {
            const response = await fetch(`https://formsubmit.co/ajax/${TARGET_NOTIFICATION_EMAIL}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            console.log(`[Websirg Form Auto-Share] Server response:`, result);
            return result;
        } catch (err) {
            console.warn(`[Websirg Form Auto-Share] Network dispatch notice:`, err);
            return { success: true, offline: true };
        }
    };

    function setupUniversalFormSubmissions() {
        document.addEventListener('submit', async function(e) {
            const form = e.target;
            if (!form || form.tagName !== 'FORM') return;

            // If form already handles submitWebsirgForm via custom function, skip universal wrapper
            if (form.getAttribute('data-custom-handled') === 'true') {
                return;
            }

            // Otherwise, handle it universally
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>TRANSMITTING TO WEBSIRG...</span>';
            }

            const formType = form.getAttribute('id') || form.getAttribute('name') || 'Website Form';
            await window.submitWebsirgForm(form, {
                formType: formType,
                subject: `New Lead: ${formType} from Websirg Website`
            });

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>✓ BRIEF TRANSMITTED!</span>';
                setTimeout(() => {
                    submitBtn.innerHTML = originalBtnText;
                }, 4000);
            }

            const statusMsg = form.querySelector('.ws-form-status, .msg, #wsProjSuccess, #wsFormSuccess');
            if (statusMsg) {
                statusMsg.style.display = 'block';
            } else {
                alert('Thank you! Your information has been shared with the Websirg team (websirg@gmail.com). We will contact you within 24 hours.');
            }
            form.reset();
        });
    }

    // Run on DOM ready
    function init() {
        loadFallbackIncludes();
        loadConfig();
        highlightActiveNav();
        setupStickyHeader();
        setupDropdownInteractions();
        setupCounterAnimations();
        setupUniversalFormSubmissions();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-check counters after window load (ensures late loaded components are animated)
    window.addEventListener('load', () => {
        setTimeout(setupCounterAnimations, 100);
    });
})();
