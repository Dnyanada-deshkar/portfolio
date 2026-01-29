document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinksList = document.querySelector('.nav-links');
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const progressBar = document.getElementById('scrollProgressBar');
    const toastEl = document.getElementById('toast');
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    /* ---------- Utilities ---------- */
    function clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
    }

    function showToast(message) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.add('is-visible');
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
    }

    function closeMobileNav() {
        if (!navLinksList || !navToggle) return;
        navLinksList.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Open menu');
    }

    function openMobileNav() {
        if (!navLinksList || !navToggle) return;
        navLinksList.classList.add('is-open');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Close menu');
    }

    function toggleMobileNav() {
        if (!navLinksList) return;
        const isOpen = navLinksList.classList.contains('is-open');
        if (isOpen) closeMobileNav();
        else openMobileNav();
    }

    function scrollToSelector(selector) {
        const target = document.querySelector(selector);
        if (!target) return;
        const headerHeight = header?.offsetHeight ?? 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 8;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    /* ---------- Mobile nav ---------- */
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileNav);
    }

    // Close on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (!navLinksList?.classList.contains('is-open')) return;
        const clickedInsideNav = e.target.closest?.('.nav') || e.target.closest?.('.nav-links');
        if (!clickedInsideNav) closeMobileNav();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileNav();
    });

    /* ---------- Smooth scrolling (anchors + data-scroll buttons) ---------- */
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest?.('a[href^="#"]');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (href && href.length > 1) {
                e.preventDefault();
                closeMobileNav();
                scrollToSelector(href);
            }
        }

        const scrollBtn = e.target.closest?.('[data-scroll]');
        if (scrollBtn) {
            const selector = scrollBtn.getAttribute('data-scroll');
            if (selector) {
                e.preventDefault();
                closeMobileNav();
                scrollToSelector(selector);
            }
        }

        const toastBtn = e.target.closest?.('[data-toast]');
        if (toastBtn) {
            const message = toastBtn.getAttribute('data-toast');
            if (message) showToast(message);
        }
    });

    /* ---------- Scroll progress ---------- */
    function updateProgress() {
        if (!progressBar) return;
        const doc = document.documentElement;
        const scrollTop = doc.scrollTop || document.body.scrollTop;
        const scrollHeight = doc.scrollHeight - doc.clientHeight;
        const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        progressBar.style.width = `${clamp(pct, 0, 100)}%`;
    }
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });

    /* ---------- Active section highlighting ---------- */
    function setActiveLink(id) {
        navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            const isActive = href === `#${id}`;
            link.classList.toggle('is-active', isActive);
        });
    }

    if (sections.length) {
        const sectionObserver = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
                if (visible?.target?.id) setActiveLink(visible.target.id);
            },
            { root: null, threshold: [0.1, 0.3, 0.5, 0.7], rootMargin: '-80px 0px -80px 0px' }
        );
        sections.forEach((s) => sectionObserver.observe(s));
    }

    /* ---------- Reveal animations ---------- */
    const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!prefersReducedMotion && revealEls.length) {
        const revealObserver = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    const delay = Number(el.getAttribute('data-reveal-delay') || '0');
                    if (delay) el.style.transitionDelay = `${delay}ms`;
                    el.classList.add('is-revealed');
                    obs.unobserve(el);
                });
            },
            { threshold: 0.15 }
        );
        revealEls.forEach((el) => revealObserver.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add('is-revealed'));
    }

    /* ---------- Count-up stats ---------- */
    const counters = Array.from(document.querySelectorAll('[data-count]'));
    if (!prefersReducedMotion && counters.length) {
        const counterObserver = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    const target = Number(el.getAttribute('data-count') || '0');
                    const duration = 900;
                    const start = performance.now();

                    function tick(now) {
                        const t = clamp((now - start) / duration, 0, 1);
                        const eased = 1 - Math.pow(1 - t, 3);
                        el.textContent = String(Math.round(eased * target));
                        if (t < 1) requestAnimationFrame(tick);
                    }
                    requestAnimationFrame(tick);
                    obs.unobserve(el);
                });
            },
            { threshold: 0.4 }
        );
        counters.forEach((c) => counterObserver.observe(c));
    } else {
        counters.forEach((c) => (c.textContent = c.getAttribute('data-count') || '0'));
    }

    /* ---------- Skills show more ---------- */
    const showMoreBtn = document.getElementById('showMoreSkills');
    const skillCardsMore = Array.from(document.querySelectorAll('.skill-card-more'));
    if (showMoreBtn && skillCardsMore.length) {
        showMoreBtn.addEventListener('click', () => {
            const isExpanded = showMoreBtn.getAttribute('aria-expanded') === 'true';
            if (isExpanded) {
                skillCardsMore.forEach((el) => el.classList.remove('is-visible'));
                showMoreBtn.innerHTML = 'Show more <i class="fa-solid fa-chevron-down"></i>';
                showMoreBtn.setAttribute('aria-expanded', 'false');
                showMoreBtn.classList.remove('is-expanded');
            } else {
                skillCardsMore.forEach((el) => el.classList.add('is-visible'));
                showMoreBtn.innerHTML = 'Show less <i class="fa-solid fa-chevron-down"></i>';
                showMoreBtn.setAttribute('aria-expanded', 'true');
                showMoreBtn.classList.add('is-expanded');
            }
        });
    }
});