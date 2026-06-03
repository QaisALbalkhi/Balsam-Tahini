/* balsam-theme.js — announcement dismiss, sticky header, cart drawer, quantity stepper */

(function () {
  'use strict';

  /* ── Announcement bar dismiss ────────────────────────────────── */
  function initAnnouncement() {
    const bar = document.querySelector('.announcement-bar');
    if (!bar) return;

    const key = 'balsam_ann_dismissed';
    if (sessionStorage.getItem(key)) {
      bar.hidden = true;
      return;
    }

    const btn = bar.querySelector('.announcement-bar__close');
    if (btn) {
      btn.addEventListener('click', () => {
        bar.hidden = true;
        sessionStorage.setItem(key, '1');
      });
    }
  }

  /* ── Sticky header ───────────────────────────────────────────── */
  function initStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const threshold = 10;
    let ticking = false;

    function update() {
      if (window.scrollY > threshold) {
        header.classList.add('site-header--scrolled');
      } else {
        header.classList.remove('site-header--scrolled');
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ── Mobile nav toggle ───────────────────────────────────────── */
  function initMobileNav() {
    const toggle = document.querySelector('.header__nav-toggle');
    const nav = document.querySelector('.header__nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('header__nav--open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ── Cart drawer ─────────────────────────────────────────────── */
  function initCartDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-drawer__overlay');
    if (!drawer) return;

    function openDrawer() {
      drawer.classList.add('cart-drawer--open');
      document.body.classList.add('overflow-hidden');
      drawer.setAttribute('aria-hidden', 'false');
    }

    function closeDrawer() {
      drawer.classList.remove('cart-drawer--open');
      document.body.classList.remove('overflow-hidden');
      drawer.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('[data-open-cart]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    });

    const closeBtn = drawer.querySelector('[data-close-cart]');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  /* ── Variant selector ────────────────────────────────────────── */
  function initVariantSelector() {
    document.querySelectorAll('.variant-selector').forEach((selector) => {
      const cards = selector.querySelectorAll('.variant-card');

      cards.forEach((card) => {
        card.addEventListener('click', () => {
          cards.forEach((c) => c.classList.remove('variant-card--selected'));
          card.classList.add('variant-card--selected');

          const radio = card.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    });
  }

  /* ── Add to Cart form ────────────────────────────────────────── */
  function initAddToCart() {
    document.querySelectorAll('.product-form').forEach((form) => {
      form.addEventListener('submit', async (e) => {
        const btn = form.querySelector('[type="submit"]');
        if (!btn) return;

        btn.classList.add('btn--loading');
        btn.disabled = true;

        /* Shopify handles the fetch via native form action;
           this just re-enables the button after a tick if the
           form doesn't navigate (ajax cart themes). */
        setTimeout(() => {
          btn.classList.remove('btn--loading');
          btn.disabled = false;
        }, 1000);
      });
    });
  }

  /* ── Wishlist (localStorage) ─────────────────────────────────── */
  const WISHLIST_KEY = 'balsam_wishlist';

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); }
    catch { return []; }
  }

  function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  }

  function updateWishlistBadge() {
    const badge = document.getElementById('wishlist-badge');
    if (!badge) return;
    const count = getWishlist().length;
    if (count > 0) {
      badge.textContent = count;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  window.balsamWishlistBadgeUpdate = updateWishlistBadge;

  function initWishlist() {
    const list = getWishlist();

    document.querySelectorAll('.product-card__wishlist').forEach((btn) => {
      const handle = btn.dataset.productHandle;
      if (handle && list.includes(handle)) {
        btn.classList.add('product-card__wishlist--active');
        btn.setAttribute('aria-pressed', 'true');
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!handle) return;
        const current = getWishlist();
        const idx = current.indexOf(handle);
        if (idx === -1) {
          current.push(handle);
        } else {
          current.splice(idx, 1);
        }
        saveWishlist(current);
        const isNowActive = idx === -1;
        btn.classList.toggle('product-card__wishlist--active', isNowActive);
        btn.setAttribute('aria-pressed', String(isNowActive));
        updateWishlistBadge();
      });
    });

    updateWishlistBadge();
  }

  /* ── Init ────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initAnnouncement();
    initStickyHeader();
    initMobileNav();

    initCartDrawer();
    initVariantSelector();
    initAddToCart();
    initWishlist();
  });
})();
