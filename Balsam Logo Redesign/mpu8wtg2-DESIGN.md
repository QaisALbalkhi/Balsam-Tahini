# Balsam Design System

> Category: Food & Artisan
> Natural food e-commerce. Forest green identity, artisan component patterns, editorial serif headlines.

## 1. Visual Theme & Atmosphere

Balsam is a natural food e-commerce design system that fuses two distinct brand voices into one coherent language. The palette and identity anchor come from Balsam Tahini — a Canadian artisan producer whose website uses deep forest green as the single persistent chromatic signal against a warm off-white canvas. The component architecture is shaped by Burlap & Barrel, a spice-commerce brand known for clean, editorial product cards, transparent sourcing narratives, and a browsing experience that feels closer to a fine-food catalogue than a typical Shopify storefront.

The visual tone is grounded and natural, not aspirational or clinical. There are no gradients on surfaces, no neon signals, and no heavy animation. Richness comes from product photography, a serif display typeface with genuine warmth, and a green-on-cream color system that feels grown rather than designed.

Two operating modes coexist: an editorial showcase mode for landing pages, hero sections, and feature bands (wide margins, large Playfair headlines, generous whitespace), and a transactional commerce mode for product detail pages, collection grids, and checkout flows (dense variant selectors, compact metadata, inline quantity steppers). Both modes share the same token set — only spacing density and typography scale change between them.

**Key Characteristics:**
- Single accent identity: forest green (`#1B4332`) is the only persistent chromatic signal
- Warm off-white canvas (`#FAFAF8`) with cream feature bands (`#F5F0E8`) — never clinical white alone
- Playfair Display for display/editorial hierarchy; Inter for UI body and commerce copy
- Soft but functional radius (6–16px) — not playful, not sharp
- Product photography carries all visual richness; UI chrome stays thin
- Status signals (In Stock, SAVE 20%, Most Loved) use amber and sage, not harsh primaries
- Dense commerce patterns (variant selector cards, quantity stepper, review strip) from the UI Kit neutral scale

## 2. Color Palette & Roles

> **Source references:** balsamtahini.com live site (announcement banner, in-stock badge, variant selector); Burlap & Barrel visual language; E-Commerce Complete UI Kit (Figma community) neutral scale

### Primary
- **Forest Green** (`#1B4332`): The single brand anchor. Announcement banner background, "In Stock" badge fill, selected variant card border, primary CTA text-on-dark.
- **Mid Forest** (`#2D6A4F`): Hover state for green fills. Never used as a standalone fill.
- **Deep Forest** (`#1A3D2E`): Active/pressed state. Darker than primary by one visible step.

### Surface & Background
- **Warm Canvas** (`#FAFAF8`): Main page background. The slight warm tint prevents clinical coldness when surrounded by natural product photography.
- **Card White** (`#FFFFFF`): Product card and panel surface. Pure white creates the contrast lift that makes cards readable on the warm canvas.
- **Cream** (`#F5F0E8`): Editorial feature bands, callout sections, and the sticky announcement bar in secondary contexts. Echoes parchment and packaging.

### Foreground
- **Shark** (`#22292F`): Primary body text, product titles, prices, ATC button fills. Verified from Balsam Tahini's Figma as the actual primary text and button color.
- **Mako** (`#3D4246`): Secondary text, nav links, card subtitles. Verified from Burlap & Barrel's navigation.
- **Dove Gray** (`#666666`): Meta copy, breadcrumbs, review counts, timestamps. Verified from Balsam Tahini's breadcrumb and meta text.

### Border & Divider
- **Soft Edge** (`#E8ECEF`): Standard card borders, input field outlines, table row dividers. UI Kit neutral 03.
- **Ghost Edge** (`#F3F5F7`): Inner separators inside dense panels. UI Kit neutral 02.

### Semantic
- **Sage Green** (`#52B788`): "In Stock" status dots, success confirmations. Warmer than generic green — cohesive with the forest palette.
- **Amber** (`#D97706`): Discount badges ("SAVE 20%"), "Most Loved" variant highlights, "Bulk -60%" tags. Warm, not alarming.
- **Alert Red** (`#DC2626`): Out-of-stock, error states, destructive actions. Desaturated enough not to fight the green palette.

### Neutral Scale (verified from Figma)
| Token | Value | Role |
|-------|-------|------|
| `#22292F` | Shark | Primary text, ATC button fills (Balsam Tahini) |
| `#3D4246` | Mako | Secondary text, nav links (Burlap & Barrel) |
| `#666666` | Dove Gray | Muted/meta text, breadcrumbs (Balsam Tahini) |
| `#E8ECEF` | Soft Edge | Borders |
| `#F3F5F7` | Ghost Edge | Soft dividers |
| `#E1E2EA` | Athens Gray | Product card image backgrounds (Balsam Tahini) |

## 3. Typography Rules

### Font Families
- **Display:** `Playfair Display`, Georgia, serif — for hero headlines, product names (especially the italic variant for the secondary word), section titles, and pull quotes
- **Body / UI:** `Open Sans`, system-ui, sans-serif — for all navigation, labels, prices, descriptions, buttons, and commerce copy. Verified from Balsam Tahini's Figma (product names 15px/400, prices 18px/600). Burlap & Barrel uses Poppins Bold for nav; Open Sans covers both on a single stack.
- **Mono:** `"SF Mono"`, ui-monospace, monospace — for batch numbers, SKU codes, weight/volume labels, and tracking numbers

### Hierarchy
| Role | Size | Weight | Leading | Notes |
|------|------|--------|---------|-------|
| Hero Display | 60px | 700 | 1.1 | Playfair Display; use italic for secondary word (e.g. "Walnut Butter *Spread*") |
| Section Title | 48px | 700 | 1.1 | Playfair Display; major page sections |
| Product Name | 36px | 700 | 1.15 | Playfair Display; PDP headline |
| Subheading | 24px | 600 | 1.3 | Open Sans; section intros, card group labels |
| Body Large | 18px | 400 | 1.6 | Open Sans; product descriptions, editorial copy |
| Body | 16px | 400 | 1.6 | Open Sans; standard body copy |
| Label / Button | 14px | 600 | 1 | Open Sans; buttons, form labels, nav links |
| Meta / Caption | 12px | 400–500 | 1.4 | Open Sans; review counts, batch codes, fine print |

### Typography Principles
- Mix display and italic weights at the headline level — Balsam Tahini's clearest brand signal is the bold + italic serif split in product names
- Body copy never uses Playfair Display — keep the serif exclusively editorial
- Letter-spacing on display: `-0.02em` (tight but not cramped)
- No all-caps body text; all-caps reserved for eyebrow labels and status badges in uppercase mono-spaced style (`font-family: var(--font-mono); letter-spacing: 0.1em`)
- Buttons use Open Sans 600 at 14px, never serif

## 4. Component Patterns

### Navigation Bar
- Logo left, primary nav links center (Open Sans 14px/600, `--fg-2` color), utility icons right (search, account, cart with badge)
- Cart badge: forest green fill (`--accent`), white count, pill shape
- Active nav link: forest green underline, not background fill
- Sticky on scroll; background transitions from transparent to `--surface` with `--elev-raised` shadow

### Announcement Banner
- Full-width, `--accent` background (`#1B4332`), white text, centered
- Dismiss icon right; CTA link underlined in white
- Typical content: "Free shipping on orders over $100 | Made in [location] **Shop now →**"

### Product Hero (PDP)
- 2-column grid: product image left (with batch-label pill overlay: `--surface-warm` bg, `--fg` text, `--radius-pill`), product details right
- Product name: Playfair Display 36px bold + italic for the descriptor word
- "IN STOCK · SHIPS IN 24H" badge: sage green dot + uppercase mono label, `--surface-warm` bg, `--radius-pill`

### Variant Selector (Size Picker)
- Cards: 160px min-width, `--surface` bg, `--border` border, `--radius-md` corners
- Selected state: `--accent` border (2px), no fill change
- Each card: color swatch (small square, `--radius-sm`), weight label (Inter 16px/600), price + servings (Inter 14px `--muted`)
- Badges float above card top-right: "MOST LOVED" in `--accent` fill, white text; "BULK -60%" in `--fg` fill, white text; both pill-shaped

### Price Block
- Sale price: Inter 28px/700, `--fg`
- Original price: Inter 18px/400, `--muted`, strikethrough
- Savings badge: `--warn` fill, white text, `--radius-sm`, uppercase, Inter 12px/700
- Installments line: "Or 4 payments of $X.XX with [Shop Pay logo] · interest-free" — Inter 14px `--muted`

### Add to Cart / CTA
- Primary: `--fg` fill (`#141718`), white text, `--radius-md`, full width on mobile, fixed height 52px
- Quantity stepper flanks left: `–` and `+` buttons, number centered, border `--border`
- Hover on CTA: lifts with `--elev-raised`, no color change (the dark button reads as immovable)

### Product Card (Collection Grid)
- White card (`--surface`), `--radius-lg` corners, `--elev-raised` shadow on hover
- Image: 4:3 ratio, object-fit cover, top of card
- Wishlist icon: top-right overlay, fills forest green on active
- Card body: product name (Inter 16px/600), price (Inter 14px/600), rating strip (stars + count)
- "Add to Cart" ghost button appears on hover (border `--accent`, text `--accent`)

### Review Strip
- Inline badge: star icons (amber `--warn` fill) + rating number (Inter 14px/600) + review count as link + "Verified by Shop" chip
- Stars: 5-star row, filled/outline based on rating, 16px each
- Sits directly below product name in PDP layout

### Status Badges
- "In Stock": sage (`--success`) dot 8px + uppercase label, `--surface-warm` background, `--radius-pill`
- "Most Loved": `--accent` fill, white text, `--radius-pill`
- "Bulk -60%": `--fg` fill, white text, `--radius-pill`
- "Save X%": `--warn` fill, white text, `--radius-sm`

## 5. Layout Principles

- **Grid:** 12-column on desktop, 8-column on tablet, 4-column on phone
- **Container max:** 1200px with 40px gutters on desktop
- **Product grid:** 4-up desktop, 2-up tablet, 1-up phone for collection pages
- **Section rhythm:** 88px desktop, 60px tablet, 40px phone — generous breathing room for editorial sections
- **Spacing base:** 4px grid; commerce density uses 8px increments; editorial sections use 32–48px
- **Image priority:** Every section starts from the photography, then builds typography around it. Never cover product images with text overlays.

## 6. Depth & Elevation

- **Flat:** Default state for most surfaces. Contrast and border do the work.
- **Ring:** `0 0 0 1px var(--border)` — contained panels, input fields
- **Raised:** `0 4px 24px rgba(27, 67, 50, 0.10)` — product cards on hover, modal overlays, sticky navigation. The forest-green tint in the shadow rgba value keeps depth cohesive with the brand palette rather than generic grey.

## 7. Do's and Don'ts

**Do:**
- Use Playfair Display italic for the second word in product names (the most distinctive Balsam brand signal)
- Keep the forest green (`#1B4332`) as the single chromatic accent — don't introduce blue or purple secondaries
- Let product photography dominate. Every hero and feature section should be image-first.
- Use cream (`#F5F0E8`) for feature bands and warm sections to avoid a flat all-white layout
- Use amber (`#D97706`) for discount badges — it's warm enough to signal urgency without screaming
- Include batch/origin information as a design element (pill overlay on product images, mono labels)

**Don't:**
- Don't use Playfair Display for body copy, labels, or buttons
- Don't introduce colorful secondary accents (no blue CTAs, no purple tags)
- Don't use `#000000` pure black — use `#141718` (Near Black) for all text
- Don't round corners to pill-level on CTAs — Balsam's add-to-cart is a functional rectangle, not a bubble
- Don't add drop shadows to text or decorative gradients to surfaces
- Don't use the green accent fill on large surface areas — it's reserved for badges, borders, and icon fills only

## 8. Responsive Behavior

- **≥1200px (Desktop):** 2-column PDP layout, 4-up product grid, full navigation bar with center links
- **768–1199px (Tablet):** 2-column PDP stacks to single column on smaller tablets, 2-up product grid, navigation collapses utility icons
- **<768px (Phone):** Single column everything, fly-menu navigation, full-width CTA buttons, 2-up product grid
- Touch targets: minimum 44×44px for all interactive elements
- Announcement banner stays full-width on all breakpoints; dismissible on mobile

## 9. Agent Prompt Guide

When generating artifacts using this design system, start every artifact with the full `:root` block from `tokens.css` pasted verbatim inside the first `<style>` tag. Then reference every value via `var(--token-name)` — never hardcode hex values.

**Quick reference colors:**
- Brand green: `var(--accent)` → `#1B4332`
- Hover green: `var(--accent-hover)` → `#2D6A4F`
- Page background: `var(--bg)` → `#FAFAF8`
- Cream band: `var(--surface-warm)` → `#F5F0E8`
- Card surface: `var(--surface)` → `#FFFFFF`
- Primary text: `var(--fg)` → `#22292F`
- Muted text: `var(--muted)` → `#666666`
- Amber badge: `var(--warn)` → `#D97706`
- Sage green: `var(--success)` → `#52B788`

**Example prompts:**
- "Build a product detail page for a walnut butter spread using the Balsam design system"
- "Create a collection grid page for artisan spices in the Balsam style"
- "Design a homepage hero section with an announcement banner and product feature cards in the Balsam system"
- "Build a checkout flow with order summary and address form in Balsam"
