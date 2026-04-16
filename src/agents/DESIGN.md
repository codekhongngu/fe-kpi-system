# Xia Dashboard Design System

## 0. Current Canonical Spec (Xia)

Use this section as the source of truth. Any older section below is legacy.

## 1. Visual Direction

This system follows a calm operations dashboard style:
- Soft light-gray canvas
- Mint/teal sidebar shell
- White cards with subtle border
- Teal as the only strong action color
- Compact, data-first layout with low visual noise

The interface should feel stable, readable, and enterprise-like.

## 2. Color Tokens

### Core
- Background: `#eff4f3`
- Surface: `#ffffff`
- Sidebar Surface: `#dceceb`
- Sidebar Active: `#bddcda`
- Primary Teal: `#129b93`
- Primary Teal Hover: `#0f8c85`

### Text
- Heading: `#2e3f45`
- Body: `#40545c`
- Muted: `#7f9198`

### Stroke and State
- Border: `#d6e1df`
- Input Background: `#f7fbfa`
- Success Badge: `#d8f2ef`
- Success Text: `#15847d`

### Shadow
- Soft Card Shadow: `0 2px 10px rgba(17, 52, 56, 0.06)`
- Panel Shadow: `0 8px 24px rgba(17, 52, 56, 0.08)`

## 3. Typography

Primary font: `Manrope`, fallback: `Inter`, `Arial`, `sans-serif`.

- Page Title: 20px, 700, line-height 1.3
- Section Title: 16px, 650, line-height 1.35
- Body: 14px, 500, line-height 1.45
- Label: 12px, 600, line-height 1.35
- Meta text: 11px, 500, line-height 1.35

Avoid very large display typography in dashboard pages.

## 4. Spacing and Radius

- Base spacing scale: `4, 8, 12, 16, 20, 24`
- Sidebar horizontal padding: `12`
- Content page padding: `16-20`
- Card radius: `12`
- Input/button radius: `8-10`
- Chip radius: `9999` (pill)

## 5. Components

### Sidebar
- Rounded outer container
- Header block with app identity
- One primary CTA button
- Nav item: icon + label, 36-40px height
- Active nav item uses `Sidebar Active`

### Header
- White top bar inside content panel
- Minimal actions, low-contrast separators
- No heavy blur or glossy effects

### Filters and Data Cards
- Card sections separated by soft borders
- Inputs use pale background (`Input Background`)
- Labels are compact and muted
- Action button uses primary teal with white text

### Badge
- Success style: mint background + teal text
- Keep badge text short and single-line

## 6. Motion

- Hover transitions: 120-180ms ease
- No translate jump effects
- Use color and border transitions only

## 7. Responsive Behavior

- Breakpoints: `479px`, `768px`, `992px`
- On small screens: sidebar becomes sheet/drawer
- Keep filter rows wrapping naturally
- Preserve clear spacing around card groups

## 8. Do and Don't

- Do keep hierarchy subtle and consistent.
- Do prioritize table/filter readability over decorative visuals.
- Do use teal accents sparingly for actions and states.
- Don't introduce high-saturation secondary colors.
- Don't stack heavy shadows or use glassmorphism.
- Don't use oversized typography in data pages.

## 9. Agent Prompt Notes

When generating UI, keep these constraints:
- Tone: clean enterprise scheduling dashboard
- Colors: soft gray + mint + teal only
- Components: rounded, compact, and practical
- Layout: left navigation + dense filter card + data table card

---
Legacy content below is deprecated and should be ignored.

## 1. Visual Theme & Atmosphere

Webflow's website is a visually rich, tool-forward platform that communicates "design without code" through clean white surfaces, the signature Webflow Blue (`#146ef5`), and a rich secondary color palette (purple, pink, green, orange, yellow, red). The custom WF Visual Sans Variable font creates a confident, precise typographic system with weight 600 for display and 500 for body.

**Key Characteristics:**
- White canvas with near-black (`#080808`) text
- Webflow Blue (`#146ef5`) as primary brand + interactive color
- WF Visual Sans Variable — custom variable font with weight 500–600
- Rich secondary palette: purple `#7a3dff`, pink `#ed52cb`, green `#00d722`, orange `#ff6b00`, yellow `#ffae13`, red `#ee1d36`
- Conservative 4px–8px border-radius — sharp, not rounded
- Multi-layer shadow stacks (5-layer cascading shadows)
- Uppercase labels: 10px–15px, weight 500–600, wide letter-spacing (0.6px–1.5px)
- translate(6px) hover animation on buttons

## 2. Color Palette & Roles

### Primary
- **Near Black** (`#080808`): Primary text
- **Webflow Blue** (`#146ef5`): `--_color---primary--webflow-blue`, primary CTA and links
- **Blue 400** (`#3b89ff`): `--_color---primary--blue-400`, lighter interactive blue
- **Blue 300** (`#006acc`): `--_color---blue-300`, darker blue variant
- **Button Hover Blue** (`#0055d4`): `--mkto-embed-color-button-hover`

### Secondary Accents
- **Purple** (`#7a3dff`): `--_color---secondary--purple`
- **Pink** (`#ed52cb`): `--_color---secondary--pink`
- **Green** (`#00d722`): `--_color---secondary--green`
- **Orange** (`#ff6b00`): `--_color---secondary--orange`
- **Yellow** (`#ffae13`): `--_color---secondary--yellow`
- **Red** (`#ee1d36`): `--_color---secondary--red`

### Neutral
- **Gray 800** (`#222222`): Dark secondary text
- **Gray 700** (`#363636`): Mid text
- **Gray 300** (`#ababab`): Muted text, placeholder
- **Mid Gray** (`#5a5a5a`): Link text
- **Border Gray** (`#d8d8d8`): Borders, dividers
- **Border Hover** (`#898989`): Hover border

### Shadows
- **5-layer cascade**: `rgba(0,0,0,0) 0px 84px 24px, rgba(0,0,0,0.01) 0px 54px 22px, rgba(0,0,0,0.04) 0px 30px 18px, rgba(0,0,0,0.08) 0px 13px 13px, rgba(0,0,0,0.09) 0px 3px 7px`

## 3. Typography Rules

### Font: `WF Visual Sans Variable`, fallback: `Arial`

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Display Hero | 80px | 600 | 1.04 | -0.8px | |
| Section Heading | 56px | 600 | 1.04 | normal | |
| Sub-heading | 32px | 500 | 1.30 | normal | |
| Feature Title | 24px | 500–600 | 1.30 | normal | |
| Body | 20px | 400–500 | 1.40–1.50 | normal | |
| Body Standard | 16px | 400–500 | 1.60 | -0.16px | |
| Button | 16px | 500 | 1.60 | -0.16px | |
| Uppercase Label | 15px | 500 | 1.30 | 1.5px | uppercase |
| Caption | 14px | 400–500 | 1.40–1.60 | normal | |
| Badge Uppercase | 12.8px | 550 | 1.20 | normal | uppercase |
| Micro Uppercase | 10px | 500–600 | 1.30 | 1px | uppercase |
| Code: Inconsolata (companion monospace font)

## 4. Component Stylings

### Buttons
- Transparent: text `#080808`, translate(6px) on hover
- White circle: 50% radius, white bg
- Blue badge: `#146ef5` bg, 4px radius, weight 550

### Cards: `1px solid #d8d8d8`, 4px–8px radius
### Badges: Blue-tinted bg at 10% opacity, 4px radius

## 5. Layout
- Spacing: fractional scale (1px, 2.4px, 3.2px, 4px, 5.6px, 6px, 7.2px, 8px, 9.6px, 12px, 16px, 24px)
- Radius: 2px, 4px, 8px, 50% — conservative, sharp
- Breakpoints: 479px, 768px, 992px

## 6. Depth: 5-layer cascading shadow system

## 7. Do's and Don'ts
- Do: Use WF Visual Sans Variable at 500–600. Blue (#146ef5) for CTAs. 4px radius. translate(6px) hover.
- Don't: Round beyond 8px for functional elements. Use secondary colors on primary CTAs.

## 8. Responsive: 479px, 768px, 992px

## 9. Agent Prompt Guide
- Text: Near Black (`#080808`)
- CTA: Webflow Blue (`#146ef5`)
- Background: White (`#ffffff`)
- Border: `#d8d8d8`
- Secondary: Purple `#7a3dff`, Pink `#ed52cb`, Green `#00d722`
