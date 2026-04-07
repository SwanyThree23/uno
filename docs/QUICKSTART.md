# SeeWhy LIVE Design System - Quick Start

Get up and running with the SeeWhy LIVE design system in minutes.

## 1. Include the CSS

Add the CSS file to your HTML:

```html
<link rel="stylesheet" href="design-system/css/main.css">
```

## 2. Add Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## 3. Basic HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My SeeWhy LIVE Page</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lora:wght@400;600&family=DM+Sans:wght@500;600&display=swap" rel="stylesheet">

  <!-- Design System -->
  <link rel="stylesheet" href="design-system/css/main.css">
</head>
<body class="bg-cream">
  <!-- Your content here -->
</body>
</html>
```

## 4. Common Components

### Buttons

```html
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-premium">Upgrade to Pro</button>
```

### Cards

```html
<div class="card">
  <h4 class="mb-3">Card Title</h4>
  <p class="text-clay">Card description text.</p>
</div>
```

### Navigation

```html
<nav class="navbar">
  <div class="navbar__container">
    <a href="#" class="navbar__logo">SeeWhy LIVE</a>
    <div class="navbar__nav">
      <a href="#" class="nav-link active">Home</a>
      <a href="#" class="nav-link">Features</a>
      <button class="btn btn-primary btn-sm">Go Live</button>
    </div>
  </div>
</nav>
```

### Forms

```html
<div class="form-group">
  <label class="label" for="email">Email</label>
  <input type="email" id="email" class="input" placeholder="you@example.com">
</div>
```

## 5. Utility Classes

### Spacing

```html
<div class="p-6 mb-4">Padding 24px, margin-bottom 16px</div>
```

### Flexbox

```html
<div class="flex items-center justify-between gap-4">
  <span>Left</span>
  <span>Right</span>
</div>
```

### Colors

```html
<p class="text-terracotta">Terracotta text</p>
<div class="bg-burgundy text-cream p-4">Burgundy background</div>
```

## 6. Animations

```html
<div class="animate animate-fade-in-up">Animated entrance</div>
<div class="hover-lift">Lifts on hover</div>
<span class="shimmer">$2,405.75</span>
```

## Examples

Check out the example pages:

- `design-system/examples/index.html` - Component showcase
- `design-system/examples/landing.html` - Landing page
- `design-system/examples/dashboard.html` - Dashboard layout

## Color Palette Reference

| Variable | Hex | Usage |
|----------|-----|-------|
| `--terracotta` | #CC7755 | Primary |
| `--burgundy` | #800020 | Premium |
| `--gold` | #FFD700 | Highlights |
| `--cream` | #F5F5DC | Background |
| `--charcoal` | #2D2420 | Text |

## Need Help?

See the full documentation: `docs/DESIGN_SYSTEM.md`
