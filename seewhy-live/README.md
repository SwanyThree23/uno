# SeeWhy LIVE

> **The creator-first live streaming platform** by SwanyThree EntTech

![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)

---

## Platform Overview

SeeWhy LIVE is a production-grade live streaming and creator monetization platform with:

- 🎥 **Multi-guest video rooms** — up to 20 simultaneous guests via WebRTC (VDO.Ninja)
- 💰 **90/10 revenue split** — creators **always** keep 90% (enforced at 3 layers)
- 🌍 **Multi-platform streaming** — simultaneous YouTube, Twitch, TikTok, Facebook
- 🤖 **AI integration** — real-time transcription, moderation, highlight detection
- 🔒 **Enterprise security** — AES-256-GCM, RS256 JWT, RBAC
- 📊 **Real-time analytics** — live viewer counts, revenue dashboards

---

## Monorepo Structure

```text
seewhy-live/
├── apps/
│   ├── api/          # Node.js + Express + Prisma backend
│   └── web/          # Next.js 15 frontend
├── infrastructure/
│   └── nginx/        # Nginx reverse proxy config
├── scripts/
│   ├── setup.sh      # First-time dev setup
│   └── seed.ts       # Database seed data
├── docs/
│   ├── API.md        # REST API reference
│   └── ENVIRONMENT.md # Environment variables
├── docker-compose.yml
└── .env              # Environment template
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenSSL (for JWT key generation)

### Setup

```bash
# 1. Clone and navigate
cd seewhy-live

# 2. Run automated setup (generates keys, starts services, migrates DB, seeds data)
bash scripts/setup.sh

# 3. Start API development server
cd apps/api && npm run dev

# 4. Start frontend (in a new terminal)
cd apps/web && npm run dev
```

The app will be available at:

- **Frontend**: <http://localhost:3000>
- **API**: <http://localhost:3001>
- **Health Check**: <http://localhost:3001/health>

### Test Accounts (after seeding)

| Role | Email | Password |
| ------ | ------- | ---------- |
| Admin | <admin@seewhylive.com> | Admin1234! |
| Creator | <maya@example.com> | Creator1234! |
| Viewer | <viewer@example.com> | Viewer1234! |

---

## Architecture

### Tech Stack

| Layer | Technology |
| ------- | ----------- |
| Frontend | Next.js 15, TypeScript, TailwindCSS v4, Framer Motion |
| Backend | Express 5, TypeScript, Socket.io |
| Database | PostgreSQL 15 + Prisma ORM |
| Cache/Pub-Sub | Redis 7 |
| Auth | RS256 JWT + refresh rotation |
| Payments | Stripe Connect |
| Streaming | VDO.Ninja WebRTC, MediaMTX RTMP |
| AI | Anthropic Claude API |
| Email | Nodemailer + Postmark |
| Infra | Docker, Nginx |

### 90/10 Revenue Split — Enforced at 3 Layers

1. **Service layer** — `computeFees()` in `lib/stripe.ts` is the only fee source
2. **Database layer** — `platformFee` and `creatorAmount` are always computed server-side
3. **Audit ledger** — `FeeRecord` table provides append-only verification

### WebRTC Architecture

SeeWhy LIVE uses **VDO.Ninja** for multi-guest WebRTC rooms:

- Creator opens studio → stage generates a unique HMAC `roomId`
- Guests join via `vdo.ninja/?room={roomId}&view`
- Viewers watch via `vdo.ninja/?room={roomId}&scene`
- No SFU infrastructure required — pure peer-to-peer or Meshcast relay

### Real-time Features (Socket.io)

Each stage has 3 namespaced channels:

- `stage:{id}:chat` — live chat & superchats
- `stage:{id}:presence` — viewer count (Redis Set)
- `stage:{id}:stream` — health metrics (bitrate, FPS, latency)

Socket.io uses a Redis adapter for horizontal scaling.

---

## API Endpoints

See [`docs/API.md`](./docs/API.md) for full reference.

### Key endpoints

```text
POST /api/auth/register        — Create account
POST /api/auth/login           — Get JWT tokens
POST /api/auth/refresh         — Rotate refresh token
GET  /api/stages               — Browse public stages
POST /api/stages               — Create stage (creator)
POST /api/stages/:id/start     — Go live
POST /api/stages/:id/end       — End stream
POST /api/payments/create-intent — Create payment (superchat/tip)
POST /api/payments/connect/onboard — Stripe Connect setup
GET  /api/analytics/dashboard  — Creator stats
```

---

## Environment Variables

See [`docs/ENVIRONMENT.md`](./docs/ENVIRONMENT.md) for full documentation.

Critical variables:

```env
DATABASE_URL=postgresql://seewhy:dev_password@localhost:5432/seewhy_live
REDIS_URL=redis://localhost:6379
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
ENCRYPTION_SECRET=exactly32characterslongplease___
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Development Commands

```bash
# From repo root:
npm run dev:api     # Start API server with hot reload
npm run dev:web     # Start Next.js frontend

# From apps/api:
npm run prisma:migrate   # Run DB migrations
npm run prisma:generate  # Regenerate Prisma client
npm run build            # TypeScript compilation

# Database:
npx tsx scripts/seed.ts  # Seed dev data

# Docker:
docker compose up -d postgres redis   # Start services only
docker compose up                     # Start all services
docker compose down                   # Stop all services
```

---

## Production Deployment

### Docker Compose (recommended for single-server)

```bash
# Set all env vars in .env, then:
docker compose up -d --build

# Run migrations on first deploy:
docker compose exec api npx prisma migrate deploy
```

### Kubernetes

Kubernetes manifests are in `infrastructure/k8s/` (coming in Phase 4).

---

## Security

- All stream keys encrypted with AES-256-GCM at rest
- JWT uses RS256 asymmetric keys (2048-bit RSA minimum)
- Refresh tokens use family-based rotation (single use, theft detection)
- Rate limiting on all endpoints (Redis-backed)
- SQL injection prevented via Prisma parameterized queries
- Stripe webhooks verified with signature validation
- Helmet.js security headers on all responses

---

## License

MIT — Copyright 2026 SwanyThree EntTech

---

*Built with ❤️ by SwanyThree EntTech for creators everywhere.*
