# SeeWhy LIVE Design System

## Version 1.0.0

A warm, creator-friendly design system featuring earth tones, organic shapes, and inviting aesthetics. Built for the world's first live streaming platform with Guest Destinations.

---

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Components](#components)
6. [Animations](#animations)
7. [Accessibility](#accessibility)
8. [Usage](#usage)

---

## Brand Identity

### Core Philosophy

SeeWhy LIVE is a **creator-first platform** with a warm, welcoming, earthy aesthetic that stands apart from the cold, tech-heavy look of competitors.

The design evokes:
- **Warmth & Community**: Earth tones suggest gathering around a fire, sharing stories
- **Authenticity**: Natural colors feel genuine, not corporate
- **Creativity**: Rich, artistic palette appeals to creators
- **Premium Quality**: Deep burgundy and gold suggest value and craft

### Design Pillars

1. **Warm Over Cold**: Use earth tones, not blues/grays
2. **Human Over Corporate**: Organic shapes, not rigid grids
3. **Inviting Over Intimidating**: Soft edges, generous spacing
4. **Creator-Centric**: Tools feel empowering, not complex

---

## Color Palette

### Primary Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Terracotta | `#CC7755` | Primary CTAs, active states, brand moments |
| Burgundy | `#800020` | Premium features, Pro badges, important alerts |
| Gold | `#FFD700` | Earnings, achievements, highlights |
| Cream | `#F5F5DC` | Main background, cards |

### Extended Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Terracotta Light | `#E6A88E` | Hover states |
| Terracotta Dark | `#B35E3F` | Active states, borders |
| Burgundy Light | `#A62D3F` | Lighter accents |
| Burgundy Dark | `#5A0016` | Deep accents |
| Gold Light | `#FFF4CC` | Soft gold backgrounds |
| Gold Dark | `#CCB000` | Gold text |

### Neutral Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Sand | `#E5D4C1` | Borders, dividers, light backgrounds |
| Clay | `#9E8B7E` | Secondary text, placeholders |
| Earth Brown | `#6B5445` | Body text |
| Charcoal | `#2D2420` | Headings, important text |

### Functional Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Success | `#7A9E5D` | Confirmations, positive states |
| Warning | `#D4874B` | Caution messages |
| Error | `#C24848` | Error states, LIVE badges |
| Info | `#8B7355` | Informational messages |

### CSS Variables

```css
:root {
  --terracotta: #CC7755;
  --burgundy: #800020;
  --gold: #FFD700;
  --cream: #F5F5DC;
  --sand: #E5D4C1;
  --clay: #9E8B7E;
  --earth-brown: #6B5445;
  --charcoal: #2D2420;
}
```

---

## Typography

### Font Families

| Type | Fonts | Usage |
|------|-------|-------|
| Display | Playfair Display, serif | Headings, titles |
| Body | Lora, serif | Body text, paragraphs |
| UI | DM Sans, sans-serif | Buttons, labels, navigation |
| Mono | JetBrains Mono | Code, data |

### Type Scale

Based on a 1.25 ratio (Perfect Fourth):

| Name | Size | Usage |
|------|------|-------|
| `--text-xs` | 0.64rem | Captions, badges |
| `--text-sm` | 0.8rem | Labels, meta text |
| `--text-base` | 1rem | Body text |
| `--text-lg` | 1.25rem | Lead paragraphs |
| `--text-xl` | 1.563rem | H5, subtitles |
| `--text-2xl` | 1.953rem | H4 |
| `--text-3xl` | 2.441rem | H3 |
| `--text-4xl` | 3.052rem | H2 |
| `--text-5xl` | 3.815rem | H1 |

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Spacing System

Based on an 8px grid:

| Token | Value | Pixels |
|-------|-------|--------|
| `--space-1` | 0.25rem | 4px |
| `--space-2` | 0.5rem | 8px |
| `--space-3` | 0.75rem | 12px |
| `--space-4` | 1rem | 16px |
| `--space-5` | 1.25rem | 20px |
| `--space-6` | 1.5rem | 24px |
| `--space-8` | 2rem | 32px |
| `--space-10` | 2.5rem | 40px |
| `--space-12` | 3rem | 48px |
| `--space-16` | 4rem | 64px |

### Border Radius

Organic, soft corners:

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements |
| `--radius-md` | 8px | Inputs, small cards |
| `--radius-lg` | 12px | Buttons, badges |
| `--radius-xl` | 16px | Cards |
| `--radius-2xl` | 24px | Large cards, modals |
| `--radius-full` | 9999px | Pills, avatars |

---

## Components

### Buttons

```html
<!-- Primary -->
<button class="btn btn-primary">Start Streaming</button>

<!-- Secondary -->
<button class="btn btn-secondary">Learn More</button>

<!-- Premium -->
<button class="btn btn-premium">Upgrade to Pro</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Cards

```html
<!-- Basic Card -->
<div class="card">
  <h4>Card Title</h4>
  <p>Card content goes here.</p>
</div>

<!-- Stream Card -->
<div class="stream-card">
  <img class="stream-card__thumbnail" src="..." alt="...">
  <span class="badge-live">LIVE</span>
  <div class="stream-card__info">
    <h5 class="stream-card__title">Stream Title</h5>
    <p class="stream-card__meta">Creator - 1.2K viewers</p>
  </div>
</div>
```

### Badges

```html
<span class="badge badge-primary">Primary</span>
<span class="badge badge-pro">PRO</span>
<span class="badge badge-success">Success</span>
<span class="badge-live">LIVE</span>
```

### Forms

```html
<div class="form-group">
  <label class="label" for="title">Stream Title</label>
  <input type="text" id="title" class="input" placeholder="Enter title">
  <p class="helper-text">Choose a descriptive title</p>
</div>

<!-- Toggle -->
<div class="toggle active">
  <div class="toggle__thumb"></div>
</div>
```

### Navigation

```html
<nav class="navbar">
  <div class="navbar__container">
    <a href="#" class="navbar__logo">SeeWhy LIVE</a>
    <div class="navbar__nav">
      <a href="#" class="nav-link active">Dashboard</a>
      <a href="#" class="nav-link">Settings</a>
    </div>
  </div>
</nav>
```

---

## Animations

### Entrance Animations

```html
<div class="animate animate-fade-in">Fades in</div>
<div class="animate animate-fade-in-up">Fades in from below</div>
<div class="animate animate-scale-in">Scales in</div>
```

### Staggered Animation

```html
<div class="animate animate-fade-in-up stagger-1">First</div>
<div class="animate animate-fade-in-up stagger-2">Second</div>
<div class="animate animate-fade-in-up stagger-3">Third</div>
```

### Hover Effects

```html
<div class="hover-lift">Lifts on hover</div>
<div class="hover-scale">Scales on hover</div>
<div class="hover-glow">Glows on hover</div>
```

### Special Effects

```html
<!-- Shimmer text (for earnings) -->
<span class="shimmer">$2,405.75</span>

<!-- Pulse animation -->
<div class="animate-pulse">Pulses continuously</div>

<!-- Float animation -->
<div class="animate-float">Floats up and down</div>
```

---

## Accessibility

### Focus States

All interactive elements have visible focus states with `--terracotta` color:

```css
:focus-visible {
  outline: 3px solid var(--terracotta);
  outline-offset: 2px;
}
```

### Reduced Motion

Respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

### High Contrast

Enhanced borders in high contrast mode:

```css
@media (prefers-contrast: high) {
  .btn, .card, .input {
    border-width: 3px;
  }
}
```

### Dark Mode

Automatic dark mode support:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --cream: #2D2420;
    --charcoal: #F5F5DC;
    /* ... other adjustments */
  }
}
```

---

## Usage

### Installation

1. Copy the `design-system/css` folder to your project
2. Import the main CSS file:

```html
<link rel="stylesheet" href="path/to/design-system/css/main.css">
```

Or import individual files:

```css
@import 'design-system/css/variables.css';
@import 'design-system/css/reset.css';
@import 'design-system/css/typography.css';
@import 'design-system/css/components.css';
@import 'design-system/css/animations.css';
@import 'design-system/css/utilities.css';
```

3. Add Google Fonts to your HTML head:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### File Structure

```
design-system/
├── css/
│   ├── main.css          # Entry point (imports all)
│   ├── variables.css     # CSS custom properties
│   ├── reset.css         # CSS reset
│   ├── typography.css    # Typography styles
│   ├── components.css    # Component styles
│   ├── animations.css    # Animations
│   └── utilities.css     # Utility classes
└── examples/
    ├── index.html        # Component showcase
    ├── landing.html      # Landing page example
    └── dashboard.html    # Dashboard example
```

---

## Design Checklist

When creating any SeeWhy LIVE interface:

- [ ] Colors: Use earth tone palette (terracotta, burgundy, gold, cream)
- [ ] Typography: Playfair Display for headers, Lora for body, DM Sans for UI
- [ ] Spacing: Follow 8px grid system
- [ ] Corners: Use soft, organic border radius (12-24px)
- [ ] Shadows: Warm, subtle shadows with earth tone color hints
- [ ] Animations: Smooth, intentional (0.3s cubic-bezier easing)
- [ ] Accessibility: WCAG AA contrast, keyboard navigation, focus states
- [ ] Mobile: Mobile-first, touch-friendly (min 44px tap targets)

---

## Don'ts (Anti-Patterns)

**Never use:**
- Cold blues, grays, or tech-heavy colors
- Generic sans-serif fonts (Inter, Roboto, Arial)
- Sharp, angular designs
- Harsh shadows or borders
- Corporate, sterile aesthetics

**Always aim for:**
- Warm, inviting earth tones
- Distinctive, characterful typography
- Soft, organic shapes
- Generous, comfortable spacing
- Human, approachable feel

---

Built with love for creators who deserve 90% of their earnings.
