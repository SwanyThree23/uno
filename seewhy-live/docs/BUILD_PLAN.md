# SeeWhy LIVE — Production Build Plan

## Current State
- Backend API skeleton exists (apps/api) with Prisma schema, lib modules
- All routes/services/middleware/sockets are EMPTY — need to be built
- Frontend (apps/web), Mobile (apps/mobile), Infrastructure all MISSING

## Build Order: Phase 1 — Backend
1. lib/jwt.ts, lib/crypto.ts, lib/stripe.ts, lib/email.ts
2. middleware/auth.ts, middleware/rateLimiter.ts, middleware/validate.ts, middleware/rbac.ts
3. routes: auth, users, stages, payments, subscriptions, streamKeys, analytics, marketplace
4. sockets: chatHandler, presenceHandler, streamHandler
5. Update index.ts to wire everything

## Build Order: Phase 2 — Frontend (Next.js 15)
- apps/web with App Router, TailwindCSS, Framer Motion
- Pages: landing, auth, dashboard, studio, watch, marketplace, settings, admin

## Build Order: Phase 3 — Infrastructure
- Docker, nginx, docker-compose, K8s manifests

## Build Order: Phase 4 — Scripts & Docs
- setup, seed, backup scripts
- README, API docs
