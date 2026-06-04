# Balsam Tahini — Project Instructions

## Design System (ALWAYS check this first)

Before making any UI/visual/layout decision, read the Balsam design system:

- **Tokens:** `code/open-design/design-systems/balsam/tokens.css` — colors, typography, spacing, radius, elevation, motion
- **Design spec:** `code/open-design/design-systems/balsam/DESIGN.md` — component patterns, typography rules, do/don'ts
- **Component reference:** `code/open-design/design-systems/balsam/components.html` — HTML fixtures

Key tokens to always use (never hardcode values):
- `--accent` `#1B4332` — Forest green, primary brand color
- `--bg` `#FAFAF8` — Warm canvas background
- `--surface-warm` `#F5F0E8` — Cream for feature bands
- `--fg` `#22292F` — Primary text
- `--font-display` Playfair Display — Editorial headlines only
- `--font-body` Open Sans — All UI/commerce copy

## Deployment (ALWAYS do ALL THREE after every change to balsam-theme files)

### 1. Push to Shopify live theme
```
shopify theme push --store x6x3pi-cg.myshopify.com --theme 153077973046 --only <changed files>
```

### 2. Push `code/balsam-theme/` to its own repo
```
cd code/balsam-theme
git add -A && git commit -m "..." && git push origin main
```
Repo: https://github.com/QaisALbalkhi/balsam-theme.git

### 3. Push the full project folder to the main repo
```
git add -A && git commit -m "..." && git push origin main
```
Repo: https://github.com/QaisALbalkhi/Balsam-Tahini.git

## Theme location
All theme files: `code/balsam-theme/`
Full file map: `code/SESSION_SUMMARY.md`
