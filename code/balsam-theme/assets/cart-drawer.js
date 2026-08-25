/* cart-drawer.js — AJAX cart drawer: open/close, line item qty/remove,
 * free shipping progress, "You might also like" (native Shopify
 * recommendations endpoint — no app), gift note. Exposed as window.BalsamCart
 * so other scripts (header cart icon, product add-to-cart) can drive it. */
(function () {
  'use strict';

  var drawer = document.querySelector('[data-cart-drawer]');
  if (!drawer) return;

  var thresholdCents = parseInt(drawer.dataset.freeShippingThreshold, 10) || 0;
  var showRecs = drawer.dataset.showRecommendations === 'true';
  var showGiftNote = drawer.dataset.showGiftNote === 'true';

  var itemsEl      = drawer.querySelector('[data-cart-items]');
  var emptyEl      = drawer.querySelector('[data-cart-empty]');
  var pinnedEl     = drawer.querySelector('[data-cart-drawer-pinned]');
  var footerEl     = drawer.querySelector('[data-cart-drawer-footer]');
  var countEl      = drawer.querySelector('[data-cart-drawer-count]');
  var subtotalEl   = drawer.querySelector('[data-cart-subtotal]');
  var fsBar        = drawer.querySelector('[data-cart-fs-bar]');
  var fsText       = drawer.querySelector('[data-cart-fs-text]');
  var fsTrack      = drawer.querySelector('[data-cart-fs-track]');
  var fsFill       = drawer.querySelector('[data-cart-fs-fill]');
  var fsBadge      = drawer.querySelector('[data-cart-fs-badge]');
  var recsWrap     = drawer.querySelector('[data-cart-recs]');
  var recsTrack    = drawer.querySelector('[data-cart-recs-track]');
  var recsPrevBtn  = drawer.querySelector('[data-cart-recs-prev]');
  var recsNextBtn  = drawer.querySelector('[data-cart-recs-next]');
  var giftToggle   = drawer.querySelector('[data-cart-gift-toggle]');
  var giftBody     = drawer.querySelector('[data-cart-gift-body]');
  var giftInput    = drawer.querySelector('[data-cart-gift-input]');
  var checkoutLink = drawer.querySelector('[data-cart-checkout]');
  var subtotalCompareEl = drawer.querySelector('[data-cart-subtotal-compare]');

  var qv       = document.getElementById('cart-quickview');
  var qvBody   = qv && qv.querySelector('[data-cart-quickview-body]');
  var recProductsById = {}; /* full recommendation product objects, keyed by id, for the quick-view popup */

  function formatMoney(cents) {
    return (window.Shopify && Shopify.formatMoney)
      ? Shopify.formatMoney(cents, window.moneyFormat || '${{amount}}')
      : '$' + (cents / 100).toFixed(2);
  }

  /* This theme's actual scroll container is <html>, not <body>
     (body/html both use overflow-x: clip for the sticky-header fix,
     which makes overflow-y resolve to the scrolling element on html).
     Locking only body left the page behind the drawer still scrollable
     — lock both so background scroll is fully blocked on all browsers. */
  function lockScroll() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function open() {
    /* If the mobile hamburger menu happens to be open (e.g. tapping
       "Cart" inside it), close it first so two overlays don't stack. */
    var mobileNav = document.getElementById('mobile-nav');
    if (mobileNav && mobileNav.classList.contains('mobile-nav--open')) {
      mobileNav.classList.remove('mobile-nav--open');
      mobileNav.setAttribute('aria-hidden', 'true');
    }
    drawer.classList.add('cart-drawer--open');
    drawer.setAttribute('aria-hidden', 'false');
    lockScroll();
  }

  function close() {
    drawer.classList.remove('cart-drawer--open');
    drawer.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }

  function renderLine(item) {
    var el = document.createElement('div');
    el.className = 'cart-line';
    el.dataset.cartLineKey = item.key;

    var img = item.image
      ? '<img src="' + item.image.replace(/(\.[a-z]+)(\?|$)/i, '_140x140$1$2') + '" alt="' + (item.title || '').replace(/"/g, '&quot;') + '" width="60" height="60" loading="lazy" class="cart-line__img">'
      : '';

    var variantHtml = (item.variant_title && item.variant_title !== 'Default Title')
      ? '<p class="cart-line__variant">' + item.variant_title + '</p>' : '';
    var planHtml = item.selling_plan_allocation
      ? '<p class="cart-line__plan">' + item.selling_plan_allocation.selling_plan.name + '</p>' : '';
    var compareHtml = (item.original_line_price !== item.final_line_price)
      ? '<s class="cart-line__compare">' + formatMoney(item.original_line_price) + '</s>' : '';

    el.innerHTML =
      '<a href="' + item.url + '" class="cart-line__img-link">' + img + '</a>' +
      '<div class="cart-line__info">' +
        '<div class="cart-line__top-row">' +
          '<a href="' + item.url + '" class="cart-line__title">' + item.product_title + '</a>' +
          '<button type="button" class="cart-line__remove" data-cart-remove aria-label="Remove item">' +
            '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m2 0-.6 9.4a1.5 1.5 0 0 1-1.5 1.4H8.1a1.5 1.5 0 0 1-1.5-1.4L6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</button>' +
        '</div>' +
        variantHtml + planHtml +
        '<div class="cart-line__bottom-row">' +
          '<div class="cart-line__stepper">' +
            '<button type="button" class="cart-line__qty-btn" data-cart-qty-dec aria-label="Decrease quantity">−</button>' +
            '<span class="cart-line__qty-val">' + item.quantity + '</span>' +
            '<button type="button" class="cart-line__qty-btn" data-cart-qty-inc aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<div class="cart-line__price">' + compareHtml + '<span>' + formatMoney(item.final_line_price) + '</span></div>' +
        '</div>' +
      '</div>';

    return el;
  }

  var lastFsMessage = null;

  function renderFreeShipping(cart) {
    if (!fsBar || thresholdCents <= 0) return;
    var remaining = thresholdCents - cart.total_price;
    var pct = Math.min(100, Math.round((cart.total_price / thresholdCents) * 100));
    if (fsFill) fsFill.style.width = pct + '%';
    /* Badge rides the fill's leading edge (clamped so its own radius
       never overhangs past the track ends) instead of sitting fixed
       at the track's far edge — it visibly travels as items are
       added, the way nomz's does. */
    if (fsBadge && fsTrack) {
      var trackWidth = fsTrack.clientWidth || 1;
      var badgeRadiusPct = (15 / trackWidth) * 100;
      var badgeLeft = Math.min(100 - badgeRadiusPct, Math.max(badgeRadiusPct, pct));
      fsBadge.style.left = badgeLeft + '%';
      fsBadge.classList.toggle('cart-drawer__fs-badge--met', remaining <= 0);
    }
    if (fsText) {
      var message = remaining <= 0
        ? '🎉 You’ve unlocked <strong>free shipping!</strong>'
        : 'You’re <strong>' + formatMoney(remaining) + '</strong> away from free shipping';
      fsText.classList.toggle('cart-drawer__fs-text--met', remaining <= 0);
      /* Only replay the "pop" entrance animation when the message
         actually changed (crossing the threshold, or a different
         dollar amount) — not on every render, which would make it
         feel jittery rather than eye-catching. */
      if (message !== lastFsMessage) {
        fsText.innerHTML = message;
        fsText.style.animation = 'none';
        void fsText.offsetWidth; /* force reflow so the animation can restart */
        fsText.style.animation = '';
        lastFsMessage = message;
      }
    }
  }

  /* The Cart AJAX API's line items don't include compare_at_price at
     all (confirmed by inspecting a real cart response — it's simply
     absent, not just unpopulated), only the per-item product handle.
     To show a genuine "was $X" total against list price, each unique
     product's real data has to be fetched separately. Cached by
     handle so repeat renders (qty changes, etc.) don't re-fetch. */
  var productDataCache = {};
  function fetchProductData(handle) {
    if (productDataCache[handle]) return Promise.resolve(productDataCache[handle]);
    return fetch('/products/' + handle + '.js')
      .then(function (r) { return r.json(); })
      .then(function (data) { productDataCache[handle] = data; return data; })
      .catch(function () { return null; });
  }

  function renderSubtotalCompare(cart) {
    if (!subtotalCompareEl) return;
    if (cart.items.length === 0) { subtotalCompareEl.hidden = true; return; }

    Promise.all(cart.items.map(function (item) { return fetchProductData(item.handle); }))
      .then(function (products) {
        var original = 0;
        var hasAnyCompare = false;
        cart.items.forEach(function (item, i) {
          var product = products[i];
          var variant = product && product.variants && product.variants.find(function (v) { return v.id === item.variant_id; });
          var compareAt = variant && variant.compare_at_price;
          if (compareAt && compareAt > variant.price) {
            hasAnyCompare = true;
            original += compareAt * item.quantity;
          } else {
            original += item.final_price * item.quantity;
          }
        });
        if (hasAnyCompare && original > cart.total_price) {
          subtotalCompareEl.hidden = false;
          subtotalCompareEl.textContent = formatMoney(original);
        } else {
          subtotalCompareEl.hidden = true;
        }
      });
  }

  function render(cart) {
    if (countEl) countEl.textContent = '(' + cart.item_count + ')';
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = cart.item_count;
      el.hidden = cart.item_count === 0;
    });

    if (itemsEl) {
      itemsEl.innerHTML = '';
      cart.items.forEach(function (item) { itemsEl.appendChild(renderLine(item)); });
    }

    if (emptyEl) emptyEl.hidden = cart.item_count > 0;
    if (pinnedEl) pinnedEl.hidden = cart.item_count === 0;
    if (footerEl) footerEl.hidden = cart.item_count === 0;
    if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);

    renderFreeShipping(cart);
    renderSubtotalCompare(cart);

    if (showRecs && recsWrap) {
      if (cart.item_count > 0) fetchRecommendations(cart.items[cart.items.length - 1].product_id);
      else recsWrap.hidden = true;
    }
  }

  function fetchCart() {
    return fetch('/cart.js', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { render(cart); return cart; });
  }

  function changeLine(key, quantity) {
    var lineEl = drawer.querySelector('[data-cart-line-key="' + key + '"]');
    if (lineEl) lineEl.classList.add('cart-line--updating');
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: key, quantity: quantity })
    })
      .then(function (r) { return r.json(); })
      .then(function (cart) { render(cart); return cart; });
  }

  function addItem(variantId, quantity, sellingPlan) {
    var body = { id: variantId, quantity: quantity || 1 };
    if (sellingPlan) body.selling_plan = sellingPlan;
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function () { return fetchCart(); })
      .then(function (cart) { open(); return cart; });
  }

  function fetchRecommendations(productId) {
    if (!recsWrap || !recsTrack) return;
    fetch('/recommendations/products.json?product_id=' + productId + '&limit=6&intent=related')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var products = (data.products || []).slice(0, 6);
        if (products.length === 0) { recsWrap.hidden = true; return; }
        recsTrack.innerHTML = '';
        products.forEach(function (p) {
          var variant = p.variants && p.variants[0];
          if (!variant) return;
          recProductsById[p.id] = p;
          var card = document.createElement('div');
          card.className = 'cart-rec';
          var img = p.featured_image
            ? '<img class="cart-rec__img" src="' + p.featured_image + '&width=136" alt="" width="68" height="68" loading="lazy">'
            : '';
          /* Tapping the image/title opens the quick-view popup instead
             of navigating to the PDP — recommended products shouldn't
             pull someone out of the checkout flow they're already in.
             Buttons, not links: no href to accidentally follow. */
          card.innerHTML =
            '<button type="button" class="cart-rec__img-btn" data-cart-rec-view="' + p.id + '" aria-label="Quick view ' + p.title.replace(/"/g, '&quot;') + '">' + img + '</button>' +
            '<div class="cart-rec__body">' +
              '<button type="button" class="cart-rec__title" data-cart-rec-view="' + p.id + '">' + p.title + '</button>' +
              '<p class="cart-rec__price">' + formatMoney(variant.price) + '</p>' +
            '</div>' +
            '<button type="button" class="cart-rec__add" data-cart-rec-add="' + variant.id + '">+ Add</button>';
          recsTrack.appendChild(card);
        });
        recsWrap.hidden = false;
        updateRecsNav();
      })
      .catch(function () { recsWrap.hidden = true; });
  }

  /* ── Quick-view popup ──
     Recommendation-endpoint data is enough for the card itself, but
     not for a real gallery/per-variant images, so this fetches the
     product's full /products/{handle}.js on open — same endpoint
     already used for the footer's before/after price. Cached so
     reopening the same card doesn't refetch. */
  var qvProductCache = {};

  function qvHandleFromUrl(url) {
    var m = url && url.match(/\/products\/([^/?#]+)/);
    return m ? m[1] : null;
  }

  function renderQuickView(full) {
    var images = (full.images || []).slice(0, 6);
    if (images.length === 0 && full.featured_image) images = [full.featured_image];

    var variants = full.variants || [];
    var firstAvailable = variants.find(function (v) { return v.available; }) || variants[0];

    var mainSrc = (firstAvailable.featured_image && firstAvailable.featured_image.src) || images[0] || '';

    var thumbsHtml = images.length > 1
      ? '<div class="qv-thumbs" data-qv-thumbs>' + images.map(function (src, i) {
          return '<button type="button" class="qv-thumb' + (src === mainSrc ? ' qv-thumb--active' : '') + '" data-qv-thumb="' + encodeURIComponent(src) + '"><img src="' + qvImgUrl(src, 120) + '" alt=""></button>';
        }).join('') + '</div>'
      : '';

    var galleryHtml =
      '<div class="qv-gallery">' +
        '<div class="qv-main-img-wrap"><img class="qv-main-img" data-qv-main-img src="' + qvImgUrl(mainSrc, 480) + '" alt=""></div>' +
        thumbsHtml +
      '</div>';

    var priceHtml = qvPriceHtml(firstAvailable);

    var variantsHtml = '';
    if (variants.length > 1) {
      variantsHtml =
        '<span class="qv-variant-label">Pack Size</span>' +
        '<div class="qv-variants" data-qv-variants>' +
          variants.map(function (v) {
            var cls = 'qv-variant-btn' + (v.id === firstAvailable.id ? ' qv-variant-btn--active' : '') + (v.available ? '' : ' qv-variant-btn--soldout');
            return '<button type="button" class="' + cls + '" data-qv-variant-btn="' + v.id + '"' + (v.available ? '' : ' disabled') + '>' + v.title + '</button>';
          }).join('') +
        '</div>';
    }

    qvBody.innerHTML =
      galleryHtml +
      '<h3 class="qv-title">' + full.title + '</h3>' +
      '<p class="qv-price" data-qv-price>' + priceHtml + '</p>' +
      variantsHtml +
      '<button type="button" class="qv-add" data-qv-add data-variant-id="' + firstAvailable.id + '"' + (firstAvailable.available ? '' : ' disabled') + '>' +
        (firstAvailable.available ? 'Add to Cart' : 'Sold Out') +
      '</button>';

    qvBody.dataset.qvVariants = JSON.stringify(variants);
    qvBody.dataset.qvImages = JSON.stringify(images);
  }

  function qvImgUrl(src, width) {
    if (!src) return '';
    return src + (src.indexOf('?') === -1 ? '?' : '&') + 'width=' + width;
  }

  function qvPriceHtml(variant) {
    var html = formatMoney(variant.price);
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      html = '<s>' + formatMoney(variant.compare_at_price) + '</s>' + html;
    }
    return html;
  }

  function openQuickView(productId) {
    var p = recProductsById[productId];
    if (!p || !qv || !qvBody) return;
    var handle = qvHandleFromUrl(p.url);

    /* Open immediately with what the rec card already has, so there's
       no blank/delayed popup — then swap in the richer gallery once
       the full product fetch resolves (usually well under a second). */
    renderQuickView({
      title: p.title,
      images: p.featured_image ? [p.featured_image] : [],
      featured_image: p.featured_image,
      variants: (p.variants || []).map(function (v) {
        return { id: v.id, title: v.title, price: v.price, compare_at_price: v.compare_at_price, available: v.available !== false, featured_image: null };
      })
    });
    qv.classList.add('cart-quickview--open');
    qv.setAttribute('aria-hidden', 'false');

    if (handle) {
      if (qvProductCache[handle]) {
        renderQuickView(qvProductCache[handle]);
      } else {
        fetch('/products/' + handle + '.js')
          .then(function (r) { return r.json(); })
          .then(function (full) {
            qvProductCache[handle] = full;
            if (qv.classList.contains('cart-quickview--open')) renderQuickView(full);
          })
          .catch(function () {});
      }
    }
  }

  function closeQuickView() {
    if (!qv) return;
    qv.classList.remove('cart-quickview--open');
    qv.setAttribute('aria-hidden', 'true');
  }

  if (qv) {
    qv.addEventListener('click', function (e) {
      if (e.target.closest('[data-cart-quickview-close]')) { closeQuickView(); return; }

      var thumbBtn = e.target.closest('[data-qv-thumb]');
      if (thumbBtn) {
        var src = decodeURIComponent(thumbBtn.dataset.qvThumb);
        var mainImg = qvBody.querySelector('[data-qv-main-img]');
        if (mainImg) mainImg.src = qvImgUrl(src, 480);
        qvBody.querySelectorAll('.qv-thumb').forEach(function (t) { t.classList.remove('qv-thumb--active'); });
        thumbBtn.classList.add('qv-thumb--active');
        return;
      }

      var variantBtn = e.target.closest('[data-qv-variant-btn]');
      if (variantBtn && !variantBtn.disabled) {
        var variants = JSON.parse(qvBody.dataset.qvVariants || '[]');
        var chosen = variants.find(function (v) { return String(v.id) === variantBtn.dataset.qvVariantBtn; });
        if (!chosen) return;

        qvBody.querySelectorAll('.qv-variant-btn').forEach(function (b) { b.classList.remove('qv-variant-btn--active'); });
        variantBtn.classList.add('qv-variant-btn--active');

        var priceEl = qvBody.querySelector('[data-qv-price]');
        if (priceEl) priceEl.innerHTML = qvPriceHtml(chosen);

        /* Only swap the main image if this variant actually has its
           own photo — most of the catalog doesn't, and silently
           reverting to the product's generic first image on every
           click would be more jarring than just leaving it alone. */
        if (chosen.featured_image && chosen.featured_image.src) {
          var mainImg2 = qvBody.querySelector('[data-qv-main-img]');
          if (mainImg2) mainImg2.src = qvImgUrl(chosen.featured_image.src, 480);
          qvBody.querySelectorAll('.qv-thumb').forEach(function (t) { t.classList.remove('qv-thumb--active'); });
        }

        var addBtn = qvBody.querySelector('[data-qv-add]');
        if (addBtn) {
          addBtn.dataset.variantId = chosen.id;
          addBtn.disabled = !chosen.available;
          addBtn.textContent = chosen.available ? 'Add to Cart' : 'Sold Out';
        }
        return;
      }

      var addBtn2 = e.target.closest('[data-qv-add]');
      if (addBtn2 && !addBtn2.disabled) {
        addBtn2.disabled = true;
        addBtn2.textContent = 'Adding…';
        addItem(addBtn2.dataset.variantId, 1).then(function () {
          closeQuickView();
        }).catch(function () {
          addBtn2.disabled = false;
          addBtn2.textContent = 'Add to Cart';
        });
      }
    });
  }

  function updateRecsNav() {
    if (!recsTrack || !recsPrevBtn || !recsNextBtn) return;
    var max = recsTrack.scrollWidth - recsTrack.clientWidth;
    recsPrevBtn.hidden = recsTrack.scrollLeft <= 4;
    recsNextBtn.hidden = recsTrack.scrollLeft >= max - 4;
  }

  function scrollRecs(direction) {
    if (!recsTrack) return;
    var card = recsTrack.querySelector('.cart-rec');
    var step = card ? card.getBoundingClientRect().width + 12 : recsTrack.clientWidth;
    recsTrack.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  if (recsTrack) recsTrack.addEventListener('scroll', updateRecsNav, { passive: true });
  if (recsPrevBtn) recsPrevBtn.addEventListener('click', function () { scrollRecs(-1); });
  if (recsNextBtn) recsNextBtn.addEventListener('click', function () { scrollRecs(1); });
  window.addEventListener('resize', updateRecsNav);

  /* ── Event delegation ── */
  drawer.addEventListener('click', function (e) {
    var closeTrigger = e.target.closest('[data-close-cart]');
    if (closeTrigger) { close(); return; }

    var lineEl = e.target.closest('.cart-line');

    var decBtn = e.target.closest('[data-cart-qty-dec]');
    if (decBtn && lineEl) {
      var key = lineEl.dataset.cartLineKey;
      var val = parseInt(lineEl.querySelector('.cart-line__qty-val').textContent, 10);
      changeLine(key, Math.max(0, val - 1));
      return;
    }

    var incBtn = e.target.closest('[data-cart-qty-inc]');
    if (incBtn && lineEl) {
      var key2 = lineEl.dataset.cartLineKey;
      var val2 = parseInt(lineEl.querySelector('.cart-line__qty-val').textContent, 10);
      changeLine(key2, val2 + 1);
      return;
    }

    var removeBtn = e.target.closest('[data-cart-remove]');
    if (removeBtn && lineEl) {
      changeLine(lineEl.dataset.cartLineKey, 0);
      return;
    }

    var recView = e.target.closest('[data-cart-rec-view]');
    if (recView) {
      openQuickView(recView.dataset.cartRecView);
      return;
    }

    var recAdd = e.target.closest('[data-cart-rec-add]');
    if (recAdd) {
      var variantId = recAdd.dataset.cartRecAdd;
      recAdd.disabled = true;
      recAdd.textContent = 'Adding…';
      addItem(variantId, 1).then(function () {
        recAdd.classList.add('cart-rec__add--added');
        recAdd.textContent = 'Added ✓';
      }).catch(function () {
        recAdd.disabled = false;
        recAdd.textContent = '+ Add';
      });
      return;
    }
  });

  if (giftToggle && giftBody) {
    giftToggle.addEventListener('click', function () {
      var expanded = giftToggle.getAttribute('aria-expanded') === 'true';
      giftToggle.setAttribute('aria-expanded', String(!expanded));
      giftBody.hidden = expanded;
      if (!expanded && giftInput) giftInput.focus();
    });
  }

  if (giftInput) {
    var giftDebounce;
    giftInput.addEventListener('input', function () {
      clearTimeout(giftDebounce);
      giftDebounce = setTimeout(function () {
        fetch('/cart/update.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ note: giftInput.value })
        }).catch(function () {});
      }, 500);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (qv && qv.classList.contains('cart-quickview--open')) { closeQuickView(); return; }
    if (drawer.classList.contains('cart-drawer--open')) close();
  });

  document.querySelectorAll('[data-open-cart]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      fetchCart().then(open);
    });
  });

  window.BalsamCart = { open: function () { fetchCart().then(open); }, close: close, refresh: fetchCart, addItem: addItem };

  /* Landed here via the /cart page's redirect-to-home script — open
     the drawer once the homepage has settled in. */
  try {
    if (sessionStorage.getItem('balsam_open_cart_on_load') === '1') {
      sessionStorage.removeItem('balsam_open_cart_on_load');
      window.BalsamCart.open();
    }
  } catch (e) {}
})();
