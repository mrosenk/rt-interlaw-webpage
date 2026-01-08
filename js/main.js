/**
 * RT-Interlaw Website - Main JavaScript
 * Anwaltskanzlei Rosenkranz-Tittl
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMobileNav();
    initStickyHeader();
    initSmoothScroll();
    initAccordion();
    initDropdownNav();
    initContactForm();
    initAnimateOnScroll();
    initUrlaubsBanner();
});

/**
 * Mobile Navigation Toggle
 */
function initMobileNav() {
    const toggle = document.querySelector('.nav__toggle');
    const navList = document.querySelector('.nav__list');
    const body = document.body;

    if (!toggle || !navList) return;

    toggle.addEventListener('click', function() {
        navList.classList.toggle('nav__list--open');
        toggle.classList.toggle('nav__toggle--active');
        body.classList.toggle('nav-open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav') && navList.classList.contains('nav__list--open')) {
            navList.classList.remove('nav__list--open');
            toggle.classList.remove('nav__toggle--active');
            body.classList.remove('nav-open');
        }
    });

    // Close menu when clicking a link
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            navList.classList.remove('nav__list--open');
            toggle.classList.remove('nav__toggle--active');
            body.classList.remove('nav-open');
        });
    });
}

/**
 * Sticky Header on Scroll
 */
function initStickyHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastScroll = 0;
    const scrollThreshold = 100;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > scrollThreshold) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }

        lastScroll = currentScroll;
    });
}

/**
 * Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/**
 * Accordion Component
 */
function initAccordion() {
    const accordions = document.querySelectorAll('.accordion');

    accordions.forEach(accordion => {
        const items = accordion.querySelectorAll('.accordion__item');

        items.forEach(item => {
            const header = item.querySelector('.accordion__header');

            header.addEventListener('click', function() {
                const isOpen = item.classList.contains('accordion__item--open');

                // Close all items
                items.forEach(i => i.classList.remove('accordion__item--open'));

                // Open clicked item if it wasn't open
                if (!isOpen) {
                    item.classList.add('accordion__item--open');
                }
            });
        });
    });
}

/**
 * Dropdown Navigation for Mobile
 */
function initDropdownNav() {
    const navItems = document.querySelectorAll('.nav__item');

    navItems.forEach(item => {
        const dropdown = item.querySelector('.nav__dropdown');
        if (!dropdown) return;

        const link = item.querySelector('.nav__link');

        // Mobile: toggle on click
        if (window.innerWidth <= 768) {
            link.addEventListener('click', function(e) {
                if (dropdown) {
                    e.preventDefault();
                    item.classList.toggle('nav__item--open');
                }
            });
        }
    });
}

/**
 * Contact Form Handling
 */
function initContactForm() {
    const form = document.querySelector('.contact__form form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Basic validation
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('form__input--error');
            } else {
                field.classList.remove('form__input--error');
            }
        });

        // Email validation
        const emailField = form.querySelector('[type="email"]');
        if (emailField && emailField.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailField.value)) {
                isValid = false;
                emailField.classList.add('form__input--error');
            }
        }

        if (!isValid) {
            showFormMessage(form, 'error', getFormErrorMessage());
            return;
        }

        // Simulate form submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = getLoadingText();

        // Here you would typically send the data to a server
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            showFormMessage(form, 'success', getFormSuccessMessage());
            form.reset();
        }, 1500);
    });

    // Remove error state on input
    form.querySelectorAll('.form__input, .form__textarea, .form__select').forEach(field => {
        field.addEventListener('input', function() {
            this.classList.remove('form__input--error');
        });
    });
}

/**
 * Get form messages based on language
 */
function getFormErrorMessage() {
    const lang = document.documentElement.lang;
    return lang === 'cs'
        ? 'Vyplňte prosím všechna povinná pole.'
        : 'Bitte füllen Sie alle Pflichtfelder aus.';
}

function getFormSuccessMessage() {
    const lang = document.documentElement.lang;
    return lang === 'cs'
        ? 'Děkujeme za Vaši zprávu. Brzy se Vám ozveme.'
        : 'Vielen Dank für Ihre Nachricht. Wir melden uns in Kürze bei Ihnen.';
}

function getLoadingText() {
    const lang = document.documentElement.lang;
    return lang === 'cs' ? 'Odesílání...' : 'Wird gesendet...';
}

/**
 * Show form message
 */
function showFormMessage(form, type, message) {
    // Remove existing message
    const existingMessage = form.querySelector('.form__message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `form__message form__message--${type}`;
    messageEl.textContent = message;

    // Style the message
    messageEl.style.padding = '1rem';
    messageEl.style.marginTop = '1rem';
    messageEl.style.borderRadius = '0.5rem';
    messageEl.style.fontWeight = '500';

    if (type === 'success') {
        messageEl.style.background = '#d4edda';
        messageEl.style.color = '#155724';
        messageEl.style.border = '1px solid #c3e6cb';
    } else {
        messageEl.style.background = '#f8d7da';
        messageEl.style.color = '#721c24';
        messageEl.style.border = '1px solid #f5c6cb';
    }

    form.appendChild(messageEl);

    // Remove message after 5 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 5000);
}

/**
 * Animate Elements on Scroll
 */
function initAnimateOnScroll() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
}

/**
 * Utility: Debounce function
 */
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

/**
 * Utility: Get current language
 */
function getCurrentLanguage() {
    return document.documentElement.lang || 'de';
}

/**
 * Language Switcher
 */
function switchLanguage(lang) {
    const currentPath = window.location.pathname;
    let newPath;

    if (lang === 'cs') {
        newPath = currentPath.replace('/de/', '/cs/').replace('/index.html', '/cs/index.html');
        if (!newPath.includes('/cs/')) {
            newPath = '/cs' + (currentPath === '/' ? '/index.html' : currentPath);
        }
    } else {
        newPath = currentPath.replace('/cs/', '/de/').replace('/index.html', '/de/index.html');
        if (!newPath.includes('/de/')) {
            newPath = '/de' + (currentPath === '/' ? '/index.html' : currentPath);
        }
    }

    window.location.href = newPath;
}

// Export for use in onclick handlers
window.switchLanguage = switchLanguage;

/**
 * Urlaubs-Banner
 * Zeigt einen Banner an, wenn in einstellungen.js aktiviert
 */
function initUrlaubsBanner() {
    // Prüfen ob Einstellungen geladen sind
    if (typeof WEBSITE_EINSTELLUNGEN === 'undefined') return;

    const settings = WEBSITE_EINSTELLUNGEN.urlaubsBanner;

    // Prüfen ob Banner aktiv ist
    if (!settings || !settings.aktiv) return;

    // Nur auf Startseiten anzeigen (index.html)
    const isStartseite = window.location.pathname.endsWith('index.html') ||
                         window.location.pathname.endsWith('/de/') ||
                         window.location.pathname.endsWith('/cs/') ||
                         window.location.pathname === '/';

    if (!isStartseite) return;

    // Datum formatieren
    const lang = getCurrentLanguage();
    const vonDatum = formatDatum(settings.vonDatum, lang);
    const bisDatum = formatDatum(settings.bisDatum, lang);

    // Nachricht je nach Sprache
    let nachricht = lang === 'cs' ? settings.nachrichtCZ : settings.nachrichtDE;
    nachricht = nachricht.replace('{von}', vonDatum).replace('{bis}', bisDatum);

    // Banner erstellen
    const banner = document.createElement('div');
    banner.className = 'urlaubs-banner';
    banner.innerHTML = `
        <div class="container">
            <div class="urlaubs-banner__content">
                <svg class="urlaubs-banner__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="urlaubs-banner__text">${nachricht}</span>
                <button class="urlaubs-banner__close" aria-label="Schließen">&times;</button>
            </div>
        </div>
    `;

    // Banner Styles
    banner.style.cssText = `
        background: linear-gradient(135deg, #c9a227 0%, #a88720 100%);
        color: #1a365d;
        padding: 0.75rem 0;
        position: relative;
        z-index: 1001;
        font-size: 0.9rem;
        font-weight: 500;
    `;

    const content = banner.querySelector('.urlaubs-banner__content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        text-align: center;
    `;

    const icon = banner.querySelector('.urlaubs-banner__icon');
    icon.style.cssText = `
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    `;

    const closeBtn = banner.querySelector('.urlaubs-banner__close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #1a365d;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 0.5rem;
        line-height: 1;
        opacity: 0.7;
        transition: opacity 0.2s;
    `;

    closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.7');
    closeBtn.addEventListener('click', () => {
        banner.remove();
        // Optional: Im SessionStorage speichern, dass Banner geschlossen wurde
        sessionStorage.setItem('urlaubsBannerClosed', 'true');
    });

    // Prüfen ob Banner bereits geschlossen wurde
    if (sessionStorage.getItem('urlaubsBannerClosed') === 'true') return;

    // Banner am Anfang des Body einfügen
    document.body.insertBefore(banner, document.body.firstChild);

    // Header-Position anpassen
    const header = document.querySelector('.header');
    if (header) {
        const bannerHeight = banner.offsetHeight;
        header.style.top = bannerHeight + 'px';
    }
}

/**
 * Datum formatieren
 */
function formatDatum(dateString, lang) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };

    if (lang === 'cs') {
        return date.toLocaleDateString('cs-CZ', options);
    }
    return date.toLocaleDateString('de-DE', options);
}
