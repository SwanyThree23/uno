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
