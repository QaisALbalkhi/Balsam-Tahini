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
  var savingsEl    = drawer.querySelector('[data-cart-savings]');
  var fsBar        = drawer.querySelector('[data-cart-fs-bar]');
  var fsText       = drawer.querySelector('[data-cart-fs-text]');
  var fsFill       = drawer.querySelector('[data-cart-fs-fill]');
  var recsWrap     = drawer.querySelector('[data-cart-recs]');
  var recsTrack    = drawer.querySelector('[data-cart-recs-track]');
  var recsPrevBtn  = drawer.querySelector('[data-cart-recs-prev]');
  var recsNextBtn  = drawer.querySelector('[data-cart-recs-next]');
  var giftToggle   = drawer.querySelector('[data-cart-gift-toggle]');
  var giftBody     = drawer.querySelector('[data-cart-gift-body]');
  var giftInput    = drawer.querySelector('[data-cart-gift-input]');
  var checkoutLink = drawer.querySelector('[data-cart-checkout]');

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

  function renderFreeShipping(cart) {
    if (!fsBar || thresholdCents <= 0) return;
    var remaining = thresholdCents - cart.total_price;
    var pct = Math.min(100, Math.round((cart.total_price / thresholdCents) * 100));
    if (fsFill) fsFill.style.width = pct + '%';
    if (fsText) {
      if (remaining <= 0) {
        fsText.innerHTML = '🎉 You’ve unlocked <strong>free shipping!</strong>';
        fsText.classList.add('cart-drawer__fs-text--met');
      } else {
        fsText.innerHTML = 'You’re <strong>' + formatMoney(remaining) + '</strong> away from free shipping';
        fsText.classList.remove('cart-drawer__fs-text--met');
      }
    }
  }

  function renderSavings(cart) {
    if (!savingsEl) return;
    if (cart.total_discount > 0) {
      savingsEl.hidden = false;
      savingsEl.textContent = 'You’re saving ' + formatMoney(cart.total_discount) + ' on this order';
    } else {
      savingsEl.hidden = true;
    }
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
    renderSavings(cart);

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
          var card = document.createElement('div');
          card.className = 'cart-rec';
          var img = p.featured_image
            ? '<img class="cart-rec__img" src="' + p.featured_image + '&width=96" alt="" width="48" height="48" loading="lazy">'
            : '';
          card.innerHTML =
            '<a href="' + p.url + '">' + img + '</a>' +
            '<div class="cart-rec__body">' +
              '<a href="' + p.url + '" class="cart-rec__title">' + p.title + '</a>' +
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
    if (e.key === 'Escape' && drawer.classList.contains('cart-drawer--open')) close();
  });

  document.querySelectorAll('[data-open-cart]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      fetchCart().then(open);
    });
  });

  window.BalsamCart = { open: function () { fetchCart().then(open); }, close: close, refresh: fetchCart, addItem: addItem };
})();
