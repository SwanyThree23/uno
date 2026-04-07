# Antigravity 1-Shot Build Prompt — SeeWhy LIVE Bridge & GHL Integration

## Role

You are Antigravity, the bridge layer in the SeeWhy LIVE three-tier stack:

```
GoHighLevel (CRM)  ←→  Antigravity (Bridge API)  ←→  SeeWhy LIVE (Next.js Platform)
                                    ↕
                            Claude Code (AI Brain via OpenRouter)
```

Your job is to build and operate the **bridge service** that:
1. Translates GHL contact/pipeline events into SeeWhy LIVE actions
2. Translates SeeWhy LIVE streaming events into GHL contact updates
3. Provides a unified admin dashboard for managing the connection
4. Handles authentication, credential storage, and retry logic between both systems

---

## What You Are Building

A standalone **Node.js / Express (or Fastify) service** — separate from the Next.js app — that:

- Stores GHL API credentials and SeeWhy LIVE API keys securely
- Authenticates with GHL's REST API using OAuth or private integration tokens
- Listens for GHL workflow webhooks and proxies them to SeeWhy LIVE
- Listens for SeeWhy LIVE outbound webhook deliveries and proxies them to GHL
- Provides a REST API for the admin dashboard to configure mappings
- Optionally exposes a simple web UI for configuration (or returns JSON for a frontend to consume)

---

## Environment Variables You Need

Create a `.env` for the bridge service with these variables:

```env
# ── Bridge Service ──
PORT=4000
BRIDGE_SECRET=<strong-random-string>   # Signs bridge-to-bridge calls

# ── SeeWhy LIVE Connection ──
SEEWHY_APP_URL=https://your-seewhy-domain.com
SEEWHY_USER_EMAIL=admin@example.com
SEEWHY_USER_PASSWORD=<seewhy-admin-password>
# ↑ Bridge logs in at startup to get a JWT, stores it, refreshes every 23h

# ── GHL (GoHighLevel) Connection ──
GHL_API_BASE=https://services.leadconnectorhq.com
GHL_PRIVATE_TOKEN=<ghl-private-integration-token>
# OR for OAuth:
GHL_CLIENT_ID=<ghl-oauth-client-id>
GHL_CLIENT_SECRET=<ghl-oauth-client-secret>
GHL_LOCATION_ID=<ghl-sub-account-location-id>

# ── Webhook Verification ──
SEEWHY_WEBHOOK_SIGNING_SECRET=<64-char-hex-from-POST-/api/automation/webhooks>
GHL_WEBHOOK_SECRET=<ghl-webhook-secret-if-configured>

# ── Database (bridge config store) ──
BRIDGE_DATABASE_URL=file:./bridge.db
```

---

## SeeWhy LIVE API — Full Reference

**Base URL:** `{SEEWHY_APP_URL}`

### Auth Flow (run at service startup + every 23 hours)

```
POST {SEEWHY_APP_URL}/api/auth/login
Content-Type: application/json

{ "email": "{SEEWHY_USER_EMAIL}", "password": "{SEEWHY_USER_PASSWORD}" }

→ 200 { "user": {...}, "token": "<JWT>", "refreshToken": "<JWT>" }
```

Store the `token` in memory. Attach it to every subsequent request:
```
Authorization: Bearer <JWT>
```

Validate the session is still live (do this on startup):
```
GET {SEEWHY_APP_URL}/api/auth/session
Authorization: Bearer <JWT>

→ 200 { "user": { "id": "...", "email": "...", ... } }
```

---

### SeeWhy LIVE API Endpoints to Call

#### Inbound Actions (Bridge → SeeWhy LIVE)

All require `Authorization: Bearer <JWT>` unless noted.

| Action | Request |
|--------|---------|
| **Start a stream** | `POST /api/automation/inbound/{userId}` with header `X-API-Key: sw_...` and body `{ "action": "stream.start", "roomId": "xxx" }` |
| **End a stream** | Same endpoint, body `{ "action": "stream.end", "roomId": "xxx" }` |
| **Update room** | Same endpoint, body `{ "action": "room.update", "roomId": "xxx", "updates": { "title": "..." } }` |
| **Send chat msg** | Same endpoint, body `{ "action": "send.chat", "roomId": "xxx", "content": "Hello!" }` |
| **Health check** | Same endpoint, body `{ "action": "ping" }` — no API key needed |

> The `X-API-Key` must be a `sw_<48hex>` key generated via `POST /api/automation/make`.
> Generate one at startup if none is stored.

#### Generate a SeeWhy LIVE API Key (run once, store result)

```
POST {SEEWHY_APP_URL}/api/automation/make
Authorization: Bearer <JWT>
Content-Type: application/json

{ "action": "generate_key", "name": "Antigravity Bridge" }

→ 200 {
    "apiKey": "sw_<48hex>",   ← STORE THIS — shown only once
    "prefix": "sw_xxxxxxxx",
    "name": "Antigravity Bridge"
  }
```

#### Register an Outbound Webhook (SeeWhy → Bridge)

```
POST {SEEWHY_APP_URL}/api/automation/webhooks
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "name": "Antigravity Bridge",
  "targetUrl": "https://your-bridge-domain.com/seewhy/events",
  "triggers": [
    "stream.started", "stream.ended",
    "viewer.joined", "viewer.left",
    "chat.message", "tip.received",
    "ticket.purchased", "subscriber.new",
    "room.created", "watchparty.started"
  ]
}

→ 201 {
    "webhook": { "id": "...", "name": "...", ... },
    "signingSecret": "<64-char-hex>",   ← STORE THIS — shown only once
    "note": "Save the signingSecret immediately..."
  }
```

#### List Rooms

```
GET {SEEWHY_APP_URL}/api/rooms
Authorization: Bearer <JWT>

→ 200 { "rooms": [ { "id": "...", "title": "...", "isLive": false, ... } ] }
```

#### Get User Profile

```
GET {SEEWHY_APP_URL}/api/users/profile
Authorization: Bearer <JWT>

→ 200 { "user": { "id": "...", "email": "...", "displayName": "...", ... } }
```

---

## GHL REST API — Full Reference

**Base URL:** `https://services.leadconnectorhq.com`

All GHL API calls require:
```
Authorization: Bearer {GHL_PRIVATE_TOKEN}
Version: 2021-07-28
Content-Type: application/json
```

### GHL Endpoints to Call

#### Search / Get Contact

```
GET /contacts/search?locationId={GHL_LOCATION_ID}&query={email_or_phone}
→ { "contacts": [ { "id": "...", "email": "...", "firstName": "...", ... } ] }
```

#### Create or Update Contact

```
POST /contacts/upsert
{
  "locationId": "{GHL_LOCATION_ID}",
  "email": "viewer@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "tags": ["seewhy-viewer", "stream-attended"],
  "customFields": [
    { "key": "last_stream_room", "field_value": "roomId-abc" },
    { "key": "total_tips_sent", "field_value": "2500" }
  ]
}
→ { "contact": { "id": "...", ... } }
```

#### Add Contact to Workflow (trigger automation)

```
POST /contacts/{contactId}/workflow/{workflowId}
{}
→ 200
```

#### Add Tag to Contact

```
POST /contacts/{contactId}/tags
{ "tags": ["stream-started", "tip-sent"] }
→ { "tags": [...] }
```

#### Remove Tag from Contact

```
DELETE /contacts/{contactId}/tags
{ "tags": ["stream-started"] }
```

#### Update Contact Custom Fields

```
PUT /contacts/{contactId}
{
  "customFields": [
    { "key": "seewhy_subscriber", "field_value": "true" },
    { "key": "last_tip_amount", "field_value": "1500" }
  ]
}
```

#### Create Opportunity (deal/pipeline entry)

```
POST /opportunities/
{
  "pipelineId": "<pipeline-id>",
  "locationId": "{GHL_LOCATION_ID}",
  "name": "Ticket Purchase - Room Title",
  "contactId": "<contact-id>",
  "monetaryValue": 2500,
  "status": "won"
}
```

#### Send SMS via GHL

```
POST /conversations/messages
{
  "type": "SMS",
  "contactId": "<contact-id>",
  "message": "Thanks for joining the stream!"
}
```

---

## Bridge Service Architecture

### File Structure

```
antigravity-bridge/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── config.ts             # Env var validation + export
│   ├── db.ts                 # SQLite/Prisma for bridge config
│   ├── seewhy/
│   │   ├── client.ts         # SeeWhy LIVE API client (auto-refreshing JWT)
│   │   ├── webhook.ts        # Inbound webhook handler + signature verification
│   │   └── startup.ts        # Bootstrap: login, generate key, register webhook
│   ├── ghl/
│   │   ├── client.ts         # GHL REST API client
│   │   ├── webhook.ts        # Inbound GHL workflow webhook handler
│   │   └── actions.ts        # GHL action helpers (upsertContact, addTag, etc.)
│   ├── mappings/
│   │   ├── seewhy-to-ghl.ts  # SeeWhy event → GHL action router
│   │   └── ghl-to-seewhy.ts  # GHL workflow action → SeeWhy action router
│   └── routes/
│       ├── admin.ts          # Admin REST API (CRUD for mappings, status)
│       └── health.ts         # GET /health
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── tsconfig.json
```

---

## Data Models (Bridge Database)

```prisma
model BridgeConfig {
  id              String   @id @default(cuid())
  key             String   @unique   // e.g. "seewhy_api_key", "seewhy_jwt"
  value           String             // encrypted or plaintext
  updatedAt       DateTime @updatedAt
}

model EventMapping {
  id              String   @id @default(cuid())
  seewhyTrigger   String?            // e.g. "tip.received"
  ghlWorkflowId   String?            // GHL workflow to trigger
  ghlTag          String?            // GHL tag to add
  ghlPipelineId   String?            // GHL pipeline for opportunity
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
}

model DeliveryLog {
  id              String   @id @default(cuid())
  direction       String             // "seewhy_to_ghl" | "ghl_to_seewhy"
  eventType       String
  payload         String
  success         Boolean
  statusCode      Int?
  error           String?
  createdAt       DateTime @default(now())
}
```

---

## Startup Sequence (run once on `npm start`)

```typescript
// src/seewhy/startup.ts

export async function bootstrapSeeWhyConnection() {
  // 1. Login to SeeWhy LIVE → get JWT
  const { token } = await seewhy.post('/api/auth/login', {
    email: process.env.SEEWHY_USER_EMAIL,
    password: process.env.SEEWHY_USER_PASSWORD,
  });
  store('seewhy_jwt', token);

  // 2. Validate session
  await seewhy.get('/api/auth/session');

  // 3. Check if API key already stored; if not, generate one
  const storedKey = await getConfig('seewhy_api_key');
  if (!storedKey) {
    const { apiKey } = await seewhy.post('/api/automation/make', {
      action: 'generate_key',
      name: 'Antigravity Bridge',
    });
    await setConfig('seewhy_api_key', apiKey);
  }

  // 4. Check if outbound webhook registered; if not, register one
  const storedSecret = await getConfig('seewhy_signing_secret');
  if (!storedSecret) {
    const { signingSecret } = await seewhy.post('/api/automation/webhooks', {
      name: 'Antigravity Bridge',
      targetUrl: `${process.env.BRIDGE_PUBLIC_URL}/seewhy/events`,
      triggers: ALL_TRIGGERS,
    });
    await setConfig('seewhy_signing_secret', signingSecret);
  }

  // 5. Schedule JWT refresh every 23 hours
  setInterval(refreshJwt, 23 * 60 * 60 * 1000);

  console.log('[bridge] SeeWhy LIVE connection bootstrapped');
}
```

---

## Inbound: SeeWhy LIVE Events → GHL Actions

Endpoint the bridge exposes: `POST /seewhy/events`

```typescript
// src/seewhy/webhook.ts

import crypto from 'crypto';

export async function handleSeeWhyWebhook(req, res) {
  // 1. Verify HMAC signature
  const signingSecret = await getConfig('seewhy_signing_secret');
  const signature = req.headers['x-seewhy-signature'];
  const expected = 'sha256=' + crypto
    .createHmac('sha256', signingSecret)
    .update(req.rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { trigger, roomId, userId, data } = req.body;

  // 2. Route to GHL based on trigger
  await routeSeeWhyEventToGHL(trigger, { roomId, userId, data });

  res.json({ received: true });
}
```

### Routing Map: SeeWhy Trigger → GHL Action

```typescript
// src/mappings/seewhy-to-ghl.ts

const TRIGGER_TO_GHL: Record<string, (payload) => Promise<void>> = {

  'stream.started': async ({ userId, roomId }) => {
    // Tag the host contact as "currently-live"
    const contact = await ghl.findContactByEmail(hostEmail);
    if (contact) await ghl.addTag(contact.id, 'stream-live');
  },

  'stream.ended': async ({ userId, roomId }) => {
    const contact = await ghl.findContactByEmail(hostEmail);
    if (contact) {
      await ghl.removeTag(contact.id, 'stream-live');
      await ghl.addTag(contact.id, 'stream-completed');
    }
  },

  'viewer.joined': async ({ userId, roomId, data }) => {
    // Upsert viewer as GHL contact + tag
    await ghl.upsertContact({
      email: data.viewerEmail,
      tags: ['seewhy-viewer', `room-${roomId}`],
      customFields: [{ key: 'last_stream_room', field_value: roomId }],
    });
  },

  'tip.received': async ({ userId, roomId, data }) => {
    const { buyerId, amount } = data;
    // Create opportunity in GHL pipeline
    const contact = await ghl.findOrCreateContact({ email: data.buyerEmail });
    await ghl.createOpportunity({
      contactId: contact.id,
      name: `Tip - $${(amount / 100).toFixed(2)}`,
      monetaryValue: amount,
      status: 'won',
    });
    await ghl.addTag(contact.id, 'tip-sent');
    // Trigger thank-you SMS workflow
    const mappings = await getEventMappings('tip.received');
    for (const m of mappings) {
      if (m.ghlWorkflowId) await ghl.triggerWorkflow(contact.id, m.ghlWorkflowId);
    }
  },

  'ticket.purchased': async ({ userId, roomId, data }) => {
    const { buyerId, amount } = data;
    const contact = await ghl.findOrCreateContact({ email: data.buyerEmail });
    await ghl.createOpportunity({
      contactId: contact.id,
      name: `Ticket Purchase - Room ${roomId}`,
      monetaryValue: amount,
      status: 'won',
    });
    await ghl.addTag(contact.id, 'ticket-buyer');
  },

  'subscriber.new': async ({ userId, data }) => {
    const contact = await ghl.findOrCreateContact({ email: data.subscriberEmail });
    await ghl.updateContact(contact.id, {
      customFields: [{ key: 'seewhy_subscriber', field_value: 'true' }],
    });
    await ghl.addTag(contact.id, 'seewhy-subscriber');
  },

  'room.created': async ({ userId, roomId, data }) => {
    // Log new room in GHL contact's custom fields
    const contact = await ghl.findOrCreateContact({ email: hostEmail });
    await ghl.updateContact(contact.id, {
      customFields: [{ key: 'total_rooms_created', field_value: String(data.count ?? 1) }],
    });
  },

  'watchparty.started': async ({ userId, roomId, data }) => {
    await ghl.addTag(await ghl.findOrCreateContact({ email: hostEmail }), 'watchparty-host');
  },
};
```

---

## Inbound: GHL Workflow → SeeWhy LIVE Actions

Endpoint the bridge exposes: `POST /ghl/trigger`

GHL Workflow setup:
- Add a **Webhook** action step in GHL workflow
- URL: `https://your-bridge-domain.com/ghl/trigger`
- Method: POST
- Header: `X-Bridge-Secret: {BRIDGE_SECRET}`
- Body: JSON (see below)

```typescript
// src/ghl/webhook.ts

export async function handleGHLWebhook(req, res) {
  // 1. Verify bridge secret
  if (req.headers['x-bridge-secret'] !== process.env.BRIDGE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, roomId, userId, content, updates } = req.body;
  const apiKey = await getConfig('seewhy_api_key');
  const appUrl = process.env.SEEWHY_APP_URL;

  // 2. Proxy to SeeWhy LIVE inbound endpoint
  const response = await fetch(`${appUrl}/api/automation/inbound/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ action, roomId, content, updates }),
  });

  const result = await response.json();

  // 3. Log delivery
  await logDelivery({
    direction: 'ghl_to_seewhy',
    eventType: action,
    payload: JSON.stringify(req.body),
    success: response.ok,
    statusCode: response.status,
  });

  res.json(result);
}
```

### GHL Webhook Body Format (what GHL sends to bridge)

```json
// Start a stream
{ "action": "stream.start", "roomId": "abc-123", "userId": "user-456" }

// End a stream
{ "action": "stream.end", "roomId": "abc-123", "userId": "user-456" }

// Update room title from GHL
{ "action": "room.update", "roomId": "abc-123", "userId": "user-456",
  "updates": { "title": "New Title from GHL" } }

// Send automated chat message
{ "action": "send.chat", "roomId": "abc-123", "userId": "user-456",
  "content": "Welcome to the stream! 👋" }

// Ping / health check
{ "action": "ping" }
```

---

## Admin REST API (bridge exposes these)

All require `Authorization: Bearer {BRIDGE_SECRET}`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/admin/status` | Connection status (SeeWhy JWT valid, GHL reachable) |
| GET | `/admin/config` | List all bridge config keys (values redacted) |
| PUT | `/admin/config/:key` | Update a config value |
| GET | `/admin/mappings` | List event→action mappings |
| POST | `/admin/mappings` | Create mapping |
| PUT | `/admin/mappings/:id` | Update mapping |
| DELETE | `/admin/mappings/:id` | Delete mapping |
| GET | `/admin/logs` | Recent delivery logs |
| POST | `/admin/test/ping` | Ping SeeWhy LIVE |
| POST | `/admin/test/ghl` | Test GHL API connection |
| POST | `/admin/bootstrap` | Re-run startup sequence manually |

---

## Full Data Flow

```
1. GHL Contact fills out form
        ↓
2. GHL Workflow fires → POST /ghl/trigger on bridge
        ↓
3. Bridge verifies X-Bridge-Secret
        ↓
4. Bridge POSTs to SeeWhy LIVE /api/automation/inbound/{userId}
   with X-API-Key: sw_<48hex>
        ↓
5. SeeWhy LIVE processes action (e.g. stream.start)
        ↓
6. SeeWhy LIVE WebSocket broadcasts to room viewers
        ↓
7. SeeWhy LIVE fires outbound webhook → POST /seewhy/events on bridge
        ↓
8. Bridge verifies X-SeeWhy-Signature (HMAC-SHA256)
        ↓
9. Bridge calls GHL REST API to upsert contact, add tags, trigger workflow
        ↓
10. GHL sends SMS / updates pipeline / triggers next automation
```

---

## SeeWhy LIVE Webhook Signature Verification

Every delivery from SeeWhy LIVE to your bridge includes:

```
X-SeeWhy-Signature: sha256=<HMAC-SHA256 of raw body using signing secret>
X-SeeWhy-Event: tip.received
X-SeeWhy-Delivery: <UUID for deduplication>
User-Agent: SeeWhyLIVE-Webhook/1.0
```

Verify in Express with raw body access:

```typescript
app.use('/seewhy/events', express.raw({ type: 'application/json' }));

function verifySeeWhySignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
```

---

## Error Handling & Retry Logic

```typescript
// Retry with exponential backoff for failed deliveries
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

JWT token refresh guard:

```typescript
async function callSeeWhy(path: string, opts: RequestInit) {
  let token = await getConfig('seewhy_jwt');
  let res = await fetch(`${SEEWHY_APP_URL}${path}`, {
    ...opts,
    headers: { ...opts.headers, Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    // Token expired — re-login
    token = await refreshSeeWhyJWT();
    res = await fetch(`${SEEWHY_APP_URL}${path}`, {
      ...opts,
      headers: { ...opts.headers, Authorization: `Bearer ${token}` },
    });
  }

  return res;
}
```

---

## Implementation Checklist

- [ ] Initialize project (`npm init`, install `express`, `@prisma/client`, `node-fetch`, `dotenv`, `zod`)
- [ ] `config.ts` — validate all required env vars with Zod on startup
- [ ] `db.ts` — Prisma client + BridgeConfig, EventMapping, DeliveryLog models
- [ ] `seewhy/client.ts` — fetch wrapper with auto-JWT-refresh
- [ ] `seewhy/startup.ts` — bootstrap sequence (login → key → webhook)
- [ ] `seewhy/webhook.ts` — inbound handler with HMAC verification
- [ ] `ghl/client.ts` — GHL fetch wrapper with Bearer token
- [ ] `ghl/actions.ts` — `findContact`, `upsertContact`, `addTag`, `removeTag`, `createOpportunity`, `triggerWorkflow`, `sendSMS`
- [ ] `ghl/webhook.ts` — inbound GHL trigger handler
- [ ] `mappings/seewhy-to-ghl.ts` — all 10 trigger handlers
- [ ] `mappings/ghl-to-seewhy.ts` — proxy to SeeWhy LIVE inbound endpoint
- [ ] `routes/admin.ts` — full admin CRUD API
- [ ] `routes/health.ts` — `GET /health` → `{ status: 'ok', seewhy: bool, ghl: bool }`
- [ ] `index.ts` — Express app, middleware, route mounting, startup call
- [ ] Prisma schema + migration
- [ ] `.env.example` with all variables documented
- [ ] `Dockerfile` for production deployment
- [ ] README with setup steps, endpoint table, GHL workflow configuration guide

---

## Key Security Rules

1. **Never log API keys or JWT tokens** in plaintext. Use a key prefix (first 10 chars) for log identification.
2. **Always use `crypto.timingSafeEqual`** for signature comparison — prevents timing attacks.
3. **Store the SeeWhy signing secret and API key** in the database, not in the `.env` (they are generated at runtime).
4. **The `BRIDGE_SECRET`** protects the `/ghl/trigger` endpoint — rotate it if compromised.
5. **The `INTERNAL_SECRET`** (`ws-internal` by default in SeeWhy LIVE — **change it**) protects the `/api/automation/fire` internal bridge — Antigravity should not call this directly; it goes through the inbound endpoint.

---

## Test Sequence After Deployment

```bash
# 1. Health check
curl https://your-bridge.com/health

# 2. Ping SeeWhy LIVE through the bridge
curl -X POST https://your-bridge.com/ghl/trigger \
  -H "X-Bridge-Secret: {BRIDGE_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{ "action": "ping", "userId": "test" }'

# 3. Check admin status
curl https://your-bridge.com/admin/status \
  -H "Authorization: Bearer {BRIDGE_SECRET}"

# 4. Check delivery logs
curl https://your-bridge.com/admin/logs \
  -H "Authorization: Bearer {BRIDGE_SECRET}"

# 5. Test GHL contact upsert (fire a fake tip.received through bridge)
# → Should create/update contact in GHL and add "tip-sent" tag
```
