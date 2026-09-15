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

    // ============================================================
    // LOAD CONFIG
    // ============================================================
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

    // ============================================================
    // APPLY CONFIG VALUES TO DOM
    // ============================================================
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

        // Dynamic attribute bindings
        document.querySelectorAll('[data-config]').forEach(el => {
            const key = el.getAttribute('data-config');

            if (config[key] !== undefined && config[key] !== null) {
                el.textContent = config[key];
            }
        });
    }

    // ============================================================
    // ACTIVE NAVIGATION
    // ============================================================
    function highlightActiveNav() {
        let currentPage = window.location.pathname.split('/').pop();

        if (!currentPage || currentPage === '/') {
            currentPage = 'index.html';
        }

        const navLinks = document.querySelectorAll(
            '#navbar-main .navbar-nav a'
        );

        navLinks.forEach(link => {
            link.classList.remove('active');

            const href = link.getAttribute('href');

            if (!href) return;

            const targetPage = href.split('/').pop().split('?')[0].split('#')[0];

            if (targetPage === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // ============================================================
    // FALLBACK INCLUDE LOADER
    // ============================================================
    async function loadFallbackIncludes() {
        const includes = [
            {
                selector: '#site-header',
                file: 'components/header.html'
            },
            {
                selector: '#site-footer',
                file: 'components/footer.html'
            },
            {
                selector: '#site-quote-modal',
                file: 'components/quote-modal.html'
            }
        ];

        for (const inc of includes) {
            const container = document.querySelector(inc.selector);

            if (
                container &&
                (
                    !container.innerHTML ||
                    container.innerHTML.trim().startsWith('<!--#include')
                )
            ) {
                try {
                    const res = await fetch(inc.file);

                    if (res.ok) {
                        container.innerHTML = await res.text();
                    }
                } catch (e) {
                    console.error(
                        'Failed to load include:',
                        inc.file,
                        e
                    );
                }
            }
        }

        applyConfig();
        highlightActiveNav();
    }

    // ============================================================
    // STICKY HEADER
    // ============================================================
    let stickyHeaderInitialized = false;

    function setupStickyHeader() {
        if (stickyHeaderInitialized) return;

        stickyHeaderInitialized = true;

        const updateStickyHeader = () => {
            const header =
                document.querySelector('#site-header') ||
                document.querySelector('#navbar-main') ||
                document.querySelector('.navbar');

            if (!header) return;

            if (window.scrollY > 20) {
                header.classList.add('ws-header-scrolled');
            } else {
                header.classList.remove('ws-header-scrolled');
            }
        };

        window.addEventListener(
            'scroll',
            updateStickyHeader,
            { passive: true }
        );

        updateStickyHeader();
    }

    // ============================================================
    // DESKTOP & MOBILE DROPDOWN HANDLING
    // ============================================================
    function setupDropdownInteractions() {
        const dropdownElements =
            document.querySelectorAll('#navbar-main .dropdown');

        if (!dropdownElements.length) return;

        dropdownElements.forEach(dd => {
            if (
                dd.dataset.wsDropdownInitialized === 'true'
            ) {
                return;
            }

            dd.dataset.wsDropdownInitialized = 'true';

            let timeoutId = null;

            const toggle =
                dd.querySelector('.dropdown-toggle');

            const menu =
                dd.querySelector('.dropdown-menu');

            if (!toggle || !menu) return;

            // ----------------------------------------------------
            // DESKTOP HOVER
            // ----------------------------------------------------
            dd.addEventListener('mouseenter', () => {
                if (window.innerWidth < 992) return;

                clearTimeout(timeoutId);

                dropdownElements.forEach(other => {
                    if (other === dd) return;

                    other.classList.remove('show');

                    const otherMenu =
                        other.querySelector('.dropdown-menu');

                    if (otherMenu) {
                        otherMenu.classList.remove('show');
                    }

                    const otherToggle =
                        other.querySelector('.dropdown-toggle');

                    if (otherToggle) {
                        otherToggle.setAttribute(
                            'aria-expanded',
                            'false'
                        );
                    }
                });

                dd.classList.add('show');
                menu.classList.add('show');

                toggle.setAttribute(
                    'aria-expanded',
                    'true'
                );
            });

            // ----------------------------------------------------
            // DESKTOP MOUSE LEAVE
            // ----------------------------------------------------
            dd.addEventListener('mouseleave', () => {
                if (window.innerWidth < 992) return;

                timeoutId = setTimeout(() => {
                    dd.classList.remove('show');
                    menu.classList.remove('show');

                    toggle.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                }, 180);
            });

            // ----------------------------------------------------
            // MOBILE / DESKTOP TOGGLE CLICK
            // ----------------------------------------------------
            toggle.addEventListener('click', e => {
                if (window.innerWidth < 992) {
                    e.preventDefault();
                    e.stopPropagation();

                    const isOpen =
                        dd.classList.contains('show') ||
                        menu.classList.contains('show');

                    if (isOpen) {
                        dd.classList.remove('show');
                        menu.classList.remove('show');

                        toggle.setAttribute(
                            'aria-expanded',
                            'false'
                        );
                    } else {
                        dropdownElements.forEach(other => {
                            if (other === dd) return;

                            other.classList.remove('show');

                            const otherMenu =
                                other.querySelector('.dropdown-menu');

                            if (otherMenu) {
                                otherMenu.classList.remove('show');
                            }

                            const otherToggle =
                                other.querySelector('.dropdown-toggle');

                            if (otherToggle) {
                                otherToggle.setAttribute(
                                    'aria-expanded',
                                    'false'
                                );
                            }
                        });

                        dd.classList.add('show');
                        menu.classList.add('show');

                        toggle.setAttribute(
                            'aria-expanded',
                            'true'
                        );
                    }
                } else {
                    const href =
                        toggle.getAttribute('href');

                    if (
                        href &&
                        href !== '#' &&
                        href !== 'javascript:void(0)'
                    ) {
                        window.location.href = href;
                    }
                }
            });
        });

        // --------------------------------------------------------
        // MOBILE OUTSIDE CLICK / TOUCH HANDLER
        // --------------------------------------------------------
        if (
            !document.body.dataset.wsDropdownDocumentHandler
        ) {
            document.body.dataset.wsDropdownDocumentHandler =
                'true';

            document.addEventListener('click', e => {
                const toggle =
                    e.target.closest(
                        '#navbar-main .dropdown-toggle, #wsServicesDropdownToggle'
                    );

                if (!toggle) return;

                if (window.innerWidth >= 992) return;

                e.preventDefault();
                e.stopPropagation();

                const dd = toggle.closest('.dropdown');

                if (!dd) return;

                const menu =
                    dd.querySelector('.dropdown-menu');

                const isOpen =
                    dd.classList.contains('show') ||
                    (
                        menu &&
                        menu.classList.contains('show')
                    );

                document
                    .querySelectorAll('#navbar-main .dropdown')
                    .forEach(other => {
                        if (other === dd) return;

                        other.classList.remove('show');

                        const otherMenu =
                            other.querySelector('.dropdown-menu');

                        if (otherMenu) {
                            otherMenu.classList.remove('show');
                        }

                        const otherToggle =
                            other.querySelector('.dropdown-toggle');

                        if (otherToggle) {
                            otherToggle.setAttribute(
                                'aria-expanded',
                                'false'
                            );
                        }
                    });

                if (isOpen) {
                    dd.classList.remove('show');

                    if (menu) {
                        menu.classList.remove('show');
                    }

                    toggle.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                } else {
                    dd.classList.add('show');

                    if (menu) {
                        menu.classList.add('show');
                    }

                    toggle.setAttribute(
                        'aria-expanded',
                        'true'
                    );
                }
            });
        }
    }

    // ============================================================
    // MOBILE NAVIGATION
    // ============================================================
    let mobileNavInitialized = false;

    function setupMobileNav() {
        if (mobileNavInitialized) return;

        mobileNavInitialized = true;

        document.addEventListener('click', e => {
            // ----------------------------------------------------
            // MOBILE NAV TOGGLER
            // ----------------------------------------------------
            const toggler =
                e.target.closest(
                    '.navbar-toggler, #wsMobileNavToggler'
                );

            if (toggler) {
                e.preventDefault();
                e.stopPropagation();

                const collapse =
                    document.querySelector(
                        '#navbar-collapse-1'
                    );

                if (!collapse) return;

                const isOpen =
                    collapse.classList.contains('show');

                if (isOpen) {
                    collapse.classList.remove('show');

                    toggler.classList.add('collapsed');

                    toggler.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                } else {
                    collapse.classList.add('show');

                    toggler.classList.remove('collapsed');

                    toggler.setAttribute(
                        'aria-expanded',
                        'true'
                    );
                }

                return;
            }

            // ----------------------------------------------------
            // CLOSE MOBILE NAV AFTER CLICKING NORMAL LINK
            // ----------------------------------------------------
            const navLink =
                e.target.closest(
                    '#navbar-collapse-1 .navbar-nav > li:not(.dropdown) > a, ' +
                    '#navbar-collapse-1 .ws-nav-cta, ' +
                    '#navbar-collapse-1 .dropdown-menu > li > a'
                );

            if (
                navLink &&
                window.innerWidth < 992
            ) {
                const collapse =
                    document.querySelector(
                        '#navbar-collapse-1'
                    );

                const togglers =
                    document.querySelectorAll(
                        '.navbar-toggler, #wsMobileNavToggler'
                    );

                if (collapse) {
                    collapse.classList.remove('show');
                }

                togglers.forEach(t => {
                    t.classList.add('collapsed');

                    t.setAttribute(
                        'aria-expanded',
                        'false'
                    );
                });
            }
        });
    }

    // ============================================================
    // COUNTER ANIMATIONS
    // ============================================================
    let counterAnimationsInitialized = false;

    function setupCounterAnimations() {
        const counterSelectors =
            '.ws-stat-number, .ws-counter-num, .counter, .counterUp, [data-counter]';

        const elements =
            document.querySelectorAll(counterSelectors);

        if (!elements.length) return;

        function parseNumber(str) {
            str = (str || '').trim();

            const match = str.match(
                /^([^0-9]*)([0-9,]+(?:\.[0-9]+)?)(.*)$/
            );

            if (!match) return null;

            const prefix = match[1] || '';
            const numStr = match[2] || '';
            const suffix = match[3] || '';

            const hasComma =
                numStr.indexOf(',') !== -1;

            const cleanNum =
                parseFloat(numStr.replace(/,/g, ''));

            const decimals =
                numStr.indexOf('.') !== -1
                    ? numStr.split('.')[1].length
                    : 0;

            if (isNaN(cleanNum)) return null;

            return {
                prefix,
                target: cleanNum,
                decimals,
                suffix,
                hasComma,
                raw: str
            };
        }

        function formatValue(
            val,
            decimals,
            hasComma
        ) {
            let s =
                decimals > 0
                    ? val.toFixed(decimals)
                    : Math.round(val).toString();

            if (hasComma) {
                const parts = s.split('.');

                parts[0] =
                    parts[0].replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ','
                    );

                s = parts.join('.');
            }

            return s;
        }

        function easeOutExpo(t) {
            return t === 1
                ? 1
                : 1 - Math.pow(2, -10 * t);
        }

        function resetCounter(el) {
            if (el._animId) {
                cancelAnimationFrame(el._animId);
                el._animId = null;
            }

            el.setAttribute(
                'data-counter-running',
                'false'
            );

            el.classList.remove(
                'ws-downcount-active'
            );

            const raw =
                el.getAttribute(
                    'data-counter-raw'
                );

            if (raw) {
                const p = parseNumber(raw);

                if (p) {
                    el.textContent =
                        p.prefix +
                        (
                            p.decimals > 0
                                ? (0).toFixed(p.decimals)
                                : '0'
                        ) +
                        p.suffix;
                }
            }
        }

        function animateCounter(el) {
            if (
                el.getAttribute(
                    'data-counter-running'
                ) === 'true'
            ) {
                return;
            }

            el.setAttribute(
                'data-counter-running',
                'true'
            );

            el.classList.remove(
                'ws-downcount-active'
            );

            void el.offsetWidth;

            el.classList.add(
                'ws-downcount-active'
            );

            const parentCard =
                el.closest(
                    '.ws-stat-card, .ws-counter-item'
                );

            if (parentCard) {
                parentCard.classList.remove(
                    'ws-card-active'
                );

                void parentCard.offsetWidth;

                parentCard.classList.add(
                    'ws-card-active'
                );
            }

            const raw =
                el.getAttribute(
                    'data-counter-raw'
                ) ||
                el.textContent.trim();

            const parsed = parseNumber(raw);

            if (!parsed) {
                el.setAttribute(
                    'data-counter-running',
                    'false'
                );

                return;
            }

            const duration = 1300;
            const startTime = performance.now();
            const startVal = 0;

            function update(now) {
                const elapsed =
                    now - startTime;

                const progress =
                    Math.min(
                        elapsed / duration,
                        1
                    );

                const eased =
                    easeOutExpo(progress);

                const currentVal =
                    startVal +
                    (
                        parsed.target -
                        startVal
                    ) *
                    eased;

                el.textContent =
                    parsed.prefix +
                    formatValue(
                        currentVal,
                        parsed.decimals,
                        parsed.hasComma
                    ) +
                    parsed.suffix;

                if (progress < 1) {
                    el._animId =
                        requestAnimationFrame(
                            update
                        );
                } else {
                    el.textContent =
                        parsed.raw;

                    el.setAttribute(
                        'data-counter-running',
                        'false'
                    );

                    el._animId = null;
                }
            }

            el._animId =
                requestAnimationFrame(update);
        }

        // --------------------------------------------------------
        // INITIALIZE COUNTER VALUES
        // --------------------------------------------------------
        elements.forEach(el => {
            if (
                !el.getAttribute(
                    'data-counter-raw'
                )
            ) {
                const raw =
                    el.textContent.trim();

                const p = parseNumber(raw);

                if (p) {
                    el.setAttribute(
                        'data-counter-raw',
                        raw
                    );

                    el.textContent =
                        p.prefix +
                        (
                            p.decimals > 0
                                ? (0).toFixed(p.decimals)
                                : '0'
                        ) +
                        p.suffix;
                }
            }
        });

        // --------------------------------------------------------
        // INTERSECTION OBSERVER
        // --------------------------------------------------------
        if ('IntersectionObserver' in window) {
            if (!counterAnimationsInitialized) {
                counterAnimationsInitialized = true;

                const observer =
                    new IntersectionObserver(
                        entries => {
                            entries.forEach(entry => {
                                if (
                                    entry.isIntersecting
                                ) {
                                    animateCounter(
                                        entry.target
                                    );
                                } else {
                                    resetCounter(
                                        entry.target
                                    );
                                }
                            });
                        },
                        {
                            threshold: 0.15
                        }
                    );

                elements.forEach(el => {
                    if (
                        !el._wsCounterObserved
                    ) {
                        el._wsCounterObserved = true;
                        observer.observe(el);
                    }
                });
            }
        } else {
            elements.forEach(el => {
                animateCounter(el);
            });
        }

        // --------------------------------------------------------
        // COUNTER HOVER
        // --------------------------------------------------------
        document
            .querySelectorAll(
                '.ws-stat-card, .ws-counter-item'
            )
            .forEach(card => {
                if (card._counterBound) return;

                card._counterBound = true;

                card.addEventListener(
                    'mouseenter',
                    () => {
                        const num =
                            card.querySelector(
                                counterSelectors
                            );

                        if (
                            num &&
                            num.getAttribute(
                                'data-counter-running'
                            ) !== 'true'
                        ) {
                            resetCounter(num);
                            animateCounter(num);
                        }
                    }
                );
            });
    }

    // ============================================================
    // UNIVERSAL FORM DATA DISPATCHER
    // ============================================================
    const TARGET_NOTIFICATION_EMAIL =
        "websirg@gmail.com";

    window.submitWebsirgForm =
        async function (
            formElement,
            options = {}
        ) {
            if (!formElement) return false;

            const formData =
                new FormData(formElement);

            const data = {};

            for (
                const [key, value]
                of formData.entries()
            ) {
                if (data[key]) {
                    if (Array.isArray(data[key])) {
                        data[key].push(value);
                    } else {
                        data[key] = [
                            data[key],
                            value
                        ];
                    }
                } else {
                    data[key] = value;
                }
            }

            for (const k in data) {
                if (Array.isArray(data[k])) {
                    data[k] =
                        data[k].join(', ');
                }
            }

            const senderName =
                data.full_name ||
                data.name ||
                'New Inquirer';

            const formSource =
                options.formType ||
                formElement.getAttribute('id') ||
                "Website Form";

            const subject =
                options.subject ||
                `🚀 New Lead: ${senderName} (${formSource})`;

            const payload = {
                _subject: subject,
                _replyto: data.email || '',
                _template: "table",
                _captcha: "false",
                "Form Source": formSource,
                "Page URL": window.location.href,
                "Submitted At":
                    new Date().toLocaleString(
                        'en-IN',
                        {
                            timeZone:
                                'Asia/Kolkata'
                        }
                    ),
                ...data
            };

            // ----------------------------------------------------
            // LOCAL STORAGE LEAD BACKUP
            // ----------------------------------------------------
            try {
                const leads =
                    JSON.parse(
                        localStorage.getItem(
                            'websirg_leads'
                        ) || '[]'
                    );

                leads.push(payload);

                localStorage.setItem(
                    'websirg_leads',
                    JSON.stringify(leads)
                );
            } catch (e) {
                // Ignore localStorage errors
            }

            console.log(
                `[Websirg Form Auto-Share] Transmitting lead data to ${TARGET_NOTIFICATION_EMAIL}:`,
                payload
            );

            // ----------------------------------------------------
            // SEND TO FORMSUBMIT
            // ----------------------------------------------------
            try {
                const response =
                    await fetch(
                        `https://formsubmit.co/ajax/${TARGET_NOTIFICATION_EMAIL}`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                "Accept":
                                    "application/json"
                            },
                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                const result =
                    await response.json();

                console.log(
                    `[Websirg Form Auto-Share] Server response:`,
                    result
                );

                return result;
            } catch (err) {
                console.warn(
                    `[Websirg Form Auto-Share] Network dispatch notice:`,
                    err
                );

                return {
                    success: true,
                    offline: true
                };
            }
        };

    // ============================================================
    // UNIVERSAL FORM SUBMISSIONS
    // ============================================================
    let universalFormInitialized = false;

    function setupUniversalFormSubmissions() {
        if (universalFormInitialized) return;

        universalFormInitialized = true;

        document.addEventListener(
            'submit',
            async function (e) {
                const form = e.target;

                if (
                    !form ||
                    form.tagName !== 'FORM'
                ) {
                    return;
                }

                // If custom handler exists, skip
                if (
                    form.getAttribute(
                        'data-custom-handled'
                    ) === 'true'
                ) {
                    return;
                }

                e.preventDefault();

                const submitBtn =
                    form.querySelector(
                        'button[type="submit"], input[type="submit"]'
                    );

                const originalBtnText =
                    submitBtn
                        ? submitBtn.innerHTML
                        : '';

                if (submitBtn) {
                    submitBtn.disabled = true;

                    submitBtn.innerHTML =
                        '<span>TRANSMITTING TO WEBSIRG...</span>';
                }

                const formType =
                    form.getAttribute('id') ||
                    form.getAttribute('name') ||
                    'Website Form';

                await window.submitWebsirgForm(
                    form,
                    {
                        formType: formType,
                        subject:
                            `New Lead: ${formType} from Websirg Website`
                    }
                );

                if (submitBtn) {
                    submitBtn.disabled = false;

                    submitBtn.innerHTML =
                        '<span>✓ BRIEF TRANSMITTED!</span>';

                    setTimeout(() => {
                        submitBtn.innerHTML =
                            originalBtnText;
                    }, 4000);
                }

                const statusMsg =
                    form.querySelector(
                        '.ws-form-status, .msg, #wsProjSuccess, #wsFormSuccess'
                    );

                if (statusMsg) {
                    statusMsg.style.display =
                        'block';
                } else {
                    let successCard =
                        form.querySelector(
                            '.ws-universal-success'
                        );

                    if (!successCard) {
                        successCard =
                            document.createElement(
                                'div'
                            );

                        successCard.className =
                            'ws-universal-success';

                        successCard.style.cssText =
                            'background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 10px; padding: 14px 16px; margin-top: 14px; text-align: center; color: #065f46; font-size: 13.5px; line-height: 1.55;';

                        successCard.innerHTML =
                            '<strong>✓ Request Transmitted Successfully!</strong><br>Your details have been transmitted directly to <strong>websirg@gmail.com</strong>. Our engineering leads will reach out within 24 hours.';

                        form.appendChild(
                            successCard
                        );
                    }

                    successCard.style.display =
                        'block';
                }

                form.reset();
            }
        );
    }

    // ============================================================
    // FLOATING CONNECT OUTSIDE CLICK
    // ============================================================
    let floatingConnectInitialized = false;

    function setupFloatingConnect() {
        if (floatingConnectInitialized) {
            return;
        }

        floatingConnectInitialized = true;

        document.addEventListener(
            'click',
            e => {
                const floatWidget =
                    document.getElementById(
                        'wsFloatingConnect'
                    );

                if (
                    floatWidget &&
                    floatWidget.classList.contains(
                        'is-open'
                    )
                ) {
                    if (
                        !floatWidget.contains(
                            e.target
                        )
                    ) {
                        floatWidget.classList.remove(
                            'is-open'
                        );
                    }
                }
            }
        );
    }

    // ============================================================
    // INITIALIZE EVERYTHING
    // ============================================================
    async function init() {
        await loadFallbackIncludes();

        await loadConfig();

        highlightActiveNav();

        setupStickyHeader();

        setupMobileNav();

        setupDropdownInteractions();

        setupFloatingConnect();

        setupCounterAnimations();

        setupUniversalFormSubmissions();
    }

    // ============================================================
    // DOM READY
    // ============================================================
    if (
        document.readyState === 'loading'
    ) {
        document.addEventListener(
            'DOMContentLoaded',
            init
        );
    } else {
        init();
    }

    // ============================================================
    // WINDOW LOAD
    // ============================================================
    window.addEventListener(
        'load',
        () => {
            setTimeout(() => {
                setupCounterAnimations();
            }, 100);
        }
    );

})();