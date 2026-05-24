# Balsam Tahini — Session Summary

## What Was Built

### Shopify Theme (`balsam-theme/`)
A complete custom Shopify theme built from scratch based on the Balsam design system in `open-design/design-systems/balsam/`.

**30 files across 7 directories:**

```
balsam-theme/
├── assets/
│   ├── balsam-tokens.css       # Design system tokens (copied from open-design)
│   ├── balsam-base.css         # Resets, grid, buttons, badges, utilities
│   └── balsam-theme.js         # Announcement dismiss, sticky header, cart drawer,
│                               # quantity stepper, variant selector, wishlist
├── config/
│   ├── settings_schema.json    # Theme customizer schema (logo, nav, footer, etc.)
│   └── settings_data.json      # Default values
├── layout/
│   └── theme.liquid            # Main layout — Google Fonts, asset tags, header/footer groups
├── locales/
│   └── en.default.json         # All UI strings
├── sections/
│   ├── announcement-bar.liquid # Forest green banner, dismissible
│   ├── header.liquid           # Logo + nav + cart badge, sticky on scroll
│   ├── footer.liquid           # Dark footer, social icons, nav columns
│   ├── hero-banner.liquid      # Full-bleed image hero, Playfair headline, CTAs
│   ├── featured-products.liquid# 4-up product grid for homepage
│   ├── editorial-band.liquid   # Cream 2-col feature band
│   ├── main-product.liquid     # PDP: thumbnails, variant selector, price, ATC
│   ├── main-collection.liquid  # Collection grid + filter sidebar
│   ├── main-cart.liquid        # Cart line items + order summary
│   ├── main-blog.liquid        # Recipes index (3-up grid)
│   ├── main-article.liquid     # Single recipe with comment form
│   ├── header-group.json       # Section group for header
│   └── footer-group.json       # Section group for footer
├── snippets/
│   ├── product-card.liquid     # Card with hover ATC, wishlist, sale badge
│   ├── price.liquid            # Sale + compare-at + installments
│   ├── variant-selector.liquid # Card-style size picker, MOST LOVED / BULK badges
│   ├── status-badge.liquid     # In Stock / Most Loved / Bulk / Save chips
│   └── quantity-stepper.liquid # – number + stepper
└── templates/
    ├── index.json              # Homepage
    ├── product.json            # PDP
    ├── collection.json         # Collection
    ├── cart.json               # Cart
    ├── blog.json               # Recipes
    ├── article.json            # Single recipe
    └── gift_card.liquid        # Required by Shopify
```

---

## Design System Source
All design decisions come from `open-design/design-systems/balsam/`:
- `tokens.css` — CSS custom properties (colors, typography, spacing, radius, elevation, motion)
- `DESIGN.md` — Full design spec (component patterns, typography rules, do/don'ts)
- `components.html` — Reference HTML fixtures

**Key tokens:**
| Token | Value | Role |
|---|---|---|
| `--accent` | `#1B4332` | Forest green — single brand anchor |
| `--bg` | `#FAFAF8` | Warm canvas background |
| `--surface-warm` | `#F5F0E8` | Cream feature bands |
| `--fg` | `#22292F` | Primary text |
| `--warn` | `#D97706` | Amber — discount badges |
| `--success` | `#52B788` | Sage green — in-stock |
| `--font-display` | Playfair Display | Editorial headlines |
| `--font-body` | Open Sans | All UI/commerce copy |

---

## Preview & Hosting

### Local preview
- File: `balsam-theme/preview.html`
- Server: Python HTTP server on port 5500
  ```
  cd balsam-theme
  python -m http.server 5500
  ```

### Public shareable link (GitHub Pages)
**https://qaisalbalkhi.github.io/balsam-theme-preview/**
- Repo: `https://github.com/QaisALbalkhi/balsam-theme-preview`
- Hosted under `QaisALbalkhi` GitHub account
- Authenticated via GitHub CLI (`gh`)

---

## Shopify Store

**Store:** `x6x3pi-cg.myshopify.com` (balsamtahini.com)

### Themes on store
| Name | ID | Status |
|---|---|---|
| NS-lumia | 138214670390 | 🟢 **Live** |
| Copy of NS-lumia | 151974117430 | Unpublished |
| Copy of NS-lumia 2 | 152531173430 | Unpublished |
| **Balsam Theme** | **152572428342** | **Unpublished** |

### Push status
The full `balsam-theme/` was pushed successfully to theme `152572428342`:
```
shopify theme push --store x6x3pi-cg.myshopify.com --theme 152572428342 --path balsam-theme
```

**Preview on store (unpublished):**
https://x6x3pi-cg.myshopify.com?preview_theme_id=152572428342

**Theme editor:**
https://x6x3pi-cg.myshopify.com/admin/themes/152572428342/editor

---

## Next Steps

- [ ] Review the theme at the preview URL above
- [ ] Make any design tweaks via `shopify theme dev` (live reload)
- [ ] Publish when ready:
  ```
  shopify theme publish --store x6x3pi-cg.myshopify.com --theme 152572428342
  ```
- [ ] Add real product images to hero and editorial sections via the theme editor
- [ ] Set up the Recipes blog in Shopify admin → Blog posts
