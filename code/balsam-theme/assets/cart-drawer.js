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
  var footerEl     = drawer.querySelector('[data-cart-drawer-footer]');
  var countEl      = drawer.querySelector('[data-cart-drawer-count]');
  var subtotalEl   = drawer.querySelector('[data-cart-subtotal]');
  var savingsEl    = drawer.querySelector('[data-cart-savings]');
  var fsBar        = drawer.querySelector('[data-cart-fs-bar]');
  var fsText       = drawer.querySelector('[data-cart-fs-text]');
  var fsFill       = drawer.querySelector('[data-cart-fs-fill]');
  var recsWrap     = drawer.querySelector('[data-cart-recs]');
  var recsTrack    = drawer.querySelector('[data-cart-recs-track]');
  var giftToggle   = drawer.querySelector('[data-cart-gift-toggle]');
  var giftBody     = drawer.querySelector('[data-cart-gift-body]');
  var giftInput    = drawer.querySelector('[data-cart-gift-input]');
  var checkoutLink = drawer.querySelector('[data-cart-checkout]');

  function formatMoney(cents) {
    return (window.Shopify && Shopify.formatMoney)
      ? Shopify.formatMoney(cents, window.moneyFormat || '${{amount}}')
      : '$' + (cents / 100).toFixed(2);
  }

  function open() {
    drawer.classList.add('cart-drawer--open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    drawer.classList.remove('cart-drawer--open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderLine(item) {
    var el = document.createElement('div');
    el.className = 'cart-line';
    el.dataset.cartLineKey = item.key;

    var img = item.image
      ? '<img src="' + item.image.replace(/(\.[a-z]+)(\?|$)/i, '_160x160$1$2') + '" alt="' + (item.title || '').replace(/"/g, '&quot;') + '" width="72" height="72" loading="lazy" class="cart-line__img">'
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
        '<a href="' + item.url + '" class="cart-line__title">' + item.product_title + '</a>' +
        variantHtml + planHtml +
        '<div class="cart-line__qty-row">' +
          '<div class="cart-line__stepper">' +
            '<button type="button" class="cart-line__qty-btn" data-cart-qty-dec aria-label="Decrease quantity">−</button>' +
            '<span class="cart-line__qty-val">' + item.quantity + '</span>' +
            '<button type="button" class="cart-line__qty-btn" data-cart-qty-inc aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<button type="button" class="cart-line__remove" data-cart-remove aria-label="Remove item">Remove</button>' +
        '</div>' +
      '</div>' +
      '<div class="cart-line__price">' + compareHtml + '<span>' + formatMoney(item.final_line_price) + '</span></div>';

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
            ? '<img class="cart-rec__img" src="' + p.featured_image + '&width=256" alt="" width="128" height="128" loading="lazy">'
            : '';
          card.innerHTML =
            '<a href="' + p.url + '">' + img + '</a>' +
            '<p class="cart-rec__title">' + p.title + '</p>' +
            '<p class="cart-rec__price">' + formatMoney(variant.price) + '</p>' +
            '<button type="button" class="cart-rec__add" data-cart-rec-add="' + variant.id + '">+ Add</button>';
          recsTrack.appendChild(card);
        });
        recsWrap.hidden = false;
      })
      .catch(function () { recsWrap.hidden = true; });
  }

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
