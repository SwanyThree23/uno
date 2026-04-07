<<<<<<< .merge_file_BPR3h6
# SeeWhy LIVE Design System

A warm, creator-friendly design system for the world's first live streaming platform with **Guest Destinations**.

## Overview

SeeWhy LIVE's design system implements an earth-toned, organic aesthetic that stands apart from cold, tech-heavy competitors. Built for creators who deserve 90% of their earnings.

### Design Philosophy

- **Warm Over Cold**: Earth tones (terracotta, burgundy, gold, cream) instead of blues/grays
- **Human Over Corporate**: Organic shapes, soft edges, generous spacing
- **Inviting Over Intimidating**: Accessible, approachable, creator-centric

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Terracotta | `#CC7755` | Primary CTAs, brand moments |
| Burgundy | `#800020` | Premium features, Pro badges |
| Gold | `#FFD700` | Earnings, achievements, highlights |
| Cream | `#F5F5DC` | Backgrounds |

## Quick Start

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lora:wght@400;600&family=DM+Sans:wght@500;600&display=swap" rel="stylesheet">

<!-- Design System -->
<link rel="stylesheet" href="design-system/css/main.css">
```

## File Structure

```
├── design-system/
│   ├── css/
│   │   ├── main.css          # Entry point
│   │   ├── variables.css     # CSS custom properties
│   │   ├── reset.css         # CSS reset
│   │   ├── typography.css    # Typography styles
│   │   ├── components.css    # Component styles
│   │   ├── animations.css    # Animations
│   │   └── utilities.css     # Utility classes
│   └── examples/
│       ├── index.html        # Component showcase
│       ├── landing.html      # Landing page example
│       └── dashboard.html    # Dashboard example
├── docs/
│   ├── DESIGN_SYSTEM.md      # Full documentation
│   └── QUICKSTART.md         # Quick start guide
└── README.md
```

## Components

- **Buttons**: Primary, Secondary, Premium, Ghost variants
- **Cards**: Basic, Stream, Stat cards
- **Badges**: Status, Pro, Live badges
- **Forms**: Inputs, selects, toggles, checkboxes
- **Navigation**: Navbar, sidebar, nav links
- **Animations**: Fade, scale, float, shimmer effects

## Examples

Open the example files in your browser:

- `design-system/examples/index.html` - Component showcase
- `design-system/examples/landing.html` - Marketing landing page
- `design-system/examples/dashboard.html` - Creator dashboard

## Documentation

- [Full Design System Guide](docs/DESIGN_SYSTEM.md)
- [Quick Start Guide](docs/QUICKSTART.md)

## Accessibility

- WCAG AA color contrast compliance
- Keyboard navigation support
- Focus visible states
- Reduced motion support
- High contrast mode support
- Dark mode support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

Built with love for creators who deserve 90% of their earnings.

**SeeWhy LIVE** - The future of live streaming.
=======
# SeeWhy LIVE

Live streaming platform with GHL (GoHighLevel) integration, AI-powered chat via OpenRouter, Stripe payments, and real-time WebSocket server.

## Stack

- **Next.js 14** (App Router) — API routes + frontend
- **Prisma + SQLite** (dev) / **PostgreSQL** (prod) — Database
- **Socket.IO** — Real-time WebSocket layer
- **Stripe** — Subscriptions, tips, tickets, Connect
- **OpenRouter** — AI chat (GPT-4o, Claude, Gemini, etc.)
- **GoHighLevel** — CRM automation via inbound/outbound webhooks

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env.local

# 3. Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# 4. Start development server (Next.js + Socket.IO)
npm run dev
```

## Key Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login → JWT |
| GET | `/api/auth/session` | Bearer JWT | Validate session |
| GET/POST | `/api/rooms` | Bearer JWT | List/create rooms |
| GET/PUT/DELETE | `/api/rooms/[id]` | Bearer JWT | Room CRUD |
| GET/POST | `/api/rooms/[id]/stream-config` | Bearer JWT (host) | Stream key & RTMP URL |
| POST | `/api/rooms/[id]/streaming` | Bearer JWT (host) | Toggle live status |
| POST | `/api/automation/inbound/[userId]` | X-API-Key | GHL → SeeWhy actions |
| GET/POST | `/api/automation/make` | Bearer JWT | Generate API keys |
| GET/POST | `/api/automation/webhooks` | Bearer JWT | Manage outbound webhooks |
| POST | `/api/automation/fire` | X-Internal-Secret | Internal WS bridge |
| POST | `/api/openrouter/chat` | Bearer JWT | AI chat (streaming) |
| POST | `/api/stripe/checkout` | Bearer JWT | Subscription checkout |
| GET/POST | `/api/stripe/connect` | Bearer JWT | Creator Stripe Connect |
| POST | `/api/stripe/tip` | Bearer JWT | Tip payment |
| POST | `/api/stripe/ticket` | Bearer JWT | Ticket purchase |
| POST | `/api/stripe/portal` | Bearer JWT | Billing portal |
| POST | `/api/stripe/webhook` | stripe-signature | Stripe events |
| GET/POST | `/api/watchparty` | Bearer JWT | Watch party CRUD |
| GET/PUT | `/api/users/profile` | Bearer JWT | User profile |

## GHL Integration

### Inbound (GHL → SeeWhy LIVE)

1. Generate an API key:
   ```
   POST /api/automation/make
   Authorization: Bearer <JWT>
   { "action": "generate_key", "name": "GHL Production" }
   ```

2. Configure GHL Workflow → Webhook Action:
   - URL: `https://your-domain.com/api/automation/inbound/{userId}`
   - Header: `X-API-Key: sw_<48 hex chars>`
   - Body: `{ "action": "stream.start", "roomId": "xxx" }`

Available inbound actions: `stream.start`, `stream.end`, `room.update`, `send.chat`, `ping`

### Outbound (SeeWhy LIVE → GHL)

```
POST /api/automation/webhooks
Authorization: Bearer <JWT>
{
  "name": "GHL Lead Sync",
  "targetUrl": "https://services.leadconnectorhq.com/hooks/YOUR_GHL_WEBHOOK_ID",
  "triggers": ["tip.received", "ticket.purchased", "subscriber.new"]
}
```

Available triggers: `stream.started`, `stream.ended`, `viewer.joined`, `viewer.left`, `chat.message`, `tip.received`, `ticket.purchased`, `subscriber.new`, `room.created`, `watchparty.started`

Every delivery includes `X-SeeWhy-Signature` (HMAC-SHA256) for verification.

## WebSocket Events

Connect to `ws://localhost:3001` with `socket.handshake.auth.token = <userId>`.

| Event | Direction | Payload |
|-------|-----------|---------|
| `room:join` | Client → Server | `{ roomId, isHost? }` |
| `room:leave` | Client → Server | `{ roomId }` |
| `stream:start` | Client → Server | `{ roomId, title? }` |
| `stream:end` | Client → Server | `{ roomId, title? }` |
| `chat:message` | Client → Server | `{ roomId, content, type }` |
| `chat:typing` | Client → Server | `{ roomId }` |
| `tip:received` | Client → Server | `{ roomId, amount, fromUser, message? }` |
| `watchparty:sync` | Bidirectional | `{ watchPartyId, type, data }` |
| `viewer:count` | Server → Client | `{ count }` |
>>>>>>> .merge_file_kC0xKw
