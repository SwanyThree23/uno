# GoHighLevel 1-Shot Build Prompt — SeeWhy LIVE Frontend, CRM & Automation

## Role

You are GoHighLevel (GHL), the **frontend, CRM, and marketing automation layer**
in the SeeWhy LIVE three-tier stack:

```
GoHighLevel (YOU)  ←→  Antigravity Bridge  ←→  SeeWhy LIVE Platform
     ↕
Contacts / Funnels / Workflows / Email / SMS / Pipelines / Membership
```

You own:
- All **public-facing marketing pages** (funnels, landing pages, opt-in forms)
- All **contact records** and CRM data
- All **workflow automations** (triggered by forms, SeeWhy events, or time delays)
- All **email and SMS** communication with viewers, fans, and creators
- The **membership portal** for SeeWhy LIVE subscribers
- **Pipeline tracking** for tickets, tips, and subscriptions as deals

You do NOT own the live stream player, WebSocket layer, or payment processing —
those live in SeeWhy LIVE. You drive traffic to them and react to their events.

---

## Stack Position: What Talks to You

```
SeeWhy LIVE event fires
        ↓
Antigravity Bridge receives + verifies
        ↓
Antigravity calls GHL REST API:
  - POST /contacts/upsert       → create/update contact
  - POST /contacts/{id}/tags    → add tags
  - POST /contacts/{id}/workflow/{id} → trigger this workflow
        ↓
GHL Workflow reacts:
  - Send SMS/email
  - Move pipeline stage
  - Add to campaign
  - Fire webhook back to Antigravity bridge

Antigravity bridge receives GHL webhook
        ↓
Bridge POSTs to SeeWhy LIVE /api/automation/inbound/{userId}
```

---

## Part 1: Custom Fields Setup

Navigate to **Settings → Custom Fields → Contacts** and create all fields below.
These are the field keys Antigravity writes when SeeWhy LIVE events fire.

| Field Label | Field Key | Type | Notes |
|-------------|-----------|------|-------|
| SeeWhy User ID | `seewhy_user_id` | Text | The SeeWhy LIVE userId |
| SeeWhy Subscriber | `seewhy_subscriber` | Checkbox | true when subscribed |
| Subscription Tier | `subscription_tier` | Dropdown: free, pro, enterprise | |
| Last Stream Room | `last_stream_room` | Text | roomId of last stream attended |
| Last Stream Date | `last_stream_date` | Date | |
| Total Tips Sent | `total_tips_sent` | Number | Cumulative cents |
| Last Tip Amount | `last_tip_amount` | Number | Cents |
| Last Tip Date | `last_tip_date` | Date | |
| Tickets Purchased | `tickets_purchased` | Number | Count |
| Streams Attended | `streams_attended` | Number | Count |
| Watch Parties Joined | `watchparties_joined` | Number | Count |
| Creator Status | `creator_status` | Dropdown: viewer, creator, host | |
| Stripe Connect Active | `stripe_connect_active` | Checkbox | |
| Total Revenue Generated | `total_revenue_generated` | Number | Cents (creator field) |

---

## Part 2: Tags Reference

These are all the tags Antigravity adds/removes. Create them in
**Settings → Tags** so they are pre-populated and searchable.

```
seewhy-viewer
seewhy-creator
seewhy-subscriber
stream-live           ← added when host goes live, removed when stream ends
stream-completed
stream-attended
tip-sent
tip-received          ← on creator's contact record
ticket-buyer
ticket-sold           ← on creator's contact record
watchparty-host
watchparty-viewer
room-{roomId}         ← dynamic, created per room join
subscriber-pro
subscriber-enterprise
churned-subscriber
payment-failed
```

---

## Part 3: Pipeline — SeeWhy LIVE Revenue

Navigate to **CRM → Pipelines → Add Pipeline**.
Name: **SeeWhy LIVE Revenue**

Create these stages in order:

| # | Stage Name | Color |
|---|-----------|-------|
| 1 | Lead (Opted In) | Blue |
| 2 | Viewer (Attended Stream) | Light Blue |
| 3 | Engaged (Tipped / Chatted) | Yellow |
| 4 | Ticket Buyer | Orange |
| 5 | Subscriber — Pro | Green |
| 6 | Subscriber — Enterprise | Dark Green |
| 7 | Creator (Hosting Streams) | Purple |
| 8 | Churned | Red |

Antigravity automatically creates **Opportunities** in this pipeline when
`tip.received` and `ticket.purchased` events fire from SeeWhy LIVE.

---

## Part 4: Funnels

Build the following funnels under **Sites → Funnels**. Each funnel has the
pages listed. Page layouts use GHL's funnel builder.

---

### Funnel 1: Stream Registration Funnel

**Funnel Name:** `SW - Stream Registration`
**Domain/Path:** `/join/{stream-slug}` (use URL params)

#### Page 1 — Opt-In Page

**URL Slug:** `/join`
**Goal:** Capture email + name, redirect to SeeWhy LIVE room

**Page Sections:**

```
[HERO SECTION]
Background: dark gradient (brand colors)
Logo: SeeWhy LIVE logo (top left)

Headline (H1):
  "Watch {{stream_title}} LIVE — Free"

Sub-headline (H2):
  "Join {{host_name}} for a live stream on {{stream_date}}."
  "Get instant access + reminder texts."

[OPT-IN FORM — see Form 1 below]
  ↓
Button: "Get Free Access →"
Button color: brand primary (#FF4500 or brand red)

[BELOW FORM — Trust signals]
  ✓ Free to attend
  ✓ Get SMS reminder 15 min before
  ✓ Replay available to subscribers
```

**Form Action:** On submit → redirect to `{SEEWHY_APP_URL}/room/{roomId}`

**Hidden Fields on Page:**
- `room_id` — populated via URL param `?room={{roomId}}`
- `host_user_id` — populated via URL param `?host={{userId}}`
- `stream_title` — populated via URL param `?title={{title}}`

---

#### Page 2 — Thank You / Redirect

**URL Slug:** `/join/thanks`

```
[SECTION]
Headline: "You're in! 🎉"
Body: "We just sent you a confirmation text.
       The stream starts {{stream_date}}.
       Click below to enter the room now."

Button: "Enter Live Room →"
Button link: {SEEWHY_APP_URL}/room/{{room_id}}
```

**Automation triggered on this page load:**
→ Workflow: `SW - New Stream Registration` (see Workflow 1)

---

### Funnel 2: Ticket Purchase Funnel

**Funnel Name:** `SW - Ticket Purchase`
**Domain/Path:** `/tickets/{event-slug}`

#### Page 1 — Event Sales Page

```
[HERO]
Headline: "{{event_title}}"
Sub: "{{event_date}} · {{event_time}} · Live on SeeWhy LIVE"

[TWO-COLUMN LAYOUT]
Left:
  - Event description (rich text block)
  - Host bio + avatar
  - "What you'll get:" bullet list
    • Live Q&A
    • Exclusive chat access
    • Replay for 7 days

Right: [TICKET FORM — see Form 2]
  Price displayed: ${{ticket_price}}
  Button: "Reserve My Spot →"

[SOCIAL PROOF]
  "{{viewer_count}} people registered"
  Countdown timer: days/hours/minutes to stream
```

**Button action:** Redirect to `{SEEWHY_APP_URL}/api/stripe/ticket`
with query params `?roomId={{room_id}}&returnUrl=/tickets/{{event-slug}}/confirmed`

---

#### Page 2 — Ticket Confirmed

```
[SECTION]
Headline: "Ticket Confirmed ✓"
Body: "Your spot is reserved. You'll get a text reminder 1 hour before.
       Add to your calendar:"
[Add to Google Calendar link]
[Add to Apple Calendar link]

Button: "Go to My Room →"
Link: {SEEWHY_APP_URL}/room/{{room_id}}
```

**Automation triggered:** Workflow `SW - Ticket Purchase Confirmation` (Workflow 3)

---

### Funnel 3: Creator Onboarding Funnel

**Funnel Name:** `SW - Creator Onboarding`
**Domain/Path:** `/create`

#### Page 1 — Creator Landing

```
[HERO]
Headline: "Start Earning From Your Live Streams"
Sub: "Set up your SeeWhy LIVE creator account in 5 minutes.
      Accept tips, sell tickets, build your audience."

[3-STEP VISUAL]
Step 1: Create your free account
Step 2: Connect Stripe to accept payments
Step 3: Go live and start earning

[CTA FORM — see Form 3]
Button: "Create My Creator Account →"
```

#### Page 2 — Account Created / Stripe Connect

```
[SECTION]
Headline: "Account Created! Connect Stripe to Accept Payments"
Body: "You're one step away from accepting tips and selling tickets."

Button: "Connect Stripe →"
Action: Redirect to {SEEWHY_APP_URL}/api/stripe/connect (GET — starts OAuth)
```

#### Page 3 — Fully Onboarded

```
[SECTION]
Headline: "You're Ready to Go Live! 🎉"
Body: "Your creator account is set up and payments are connected."

[TWO BUTTONS]
"Go to My Dashboard →"  → {SEEWHY_APP_URL}/dashboard
"Create My First Room →" → {SEEWHY_APP_URL}/room/new
```

---

### Funnel 4: Subscription / Upgrade Page

**Funnel Name:** `SW - Upgrade to Pro`
**Domain/Path:** `/upgrade`

#### Page 1 — Pricing

```
[HERO]
Headline: "Unlock Everything on SeeWhy LIVE"

[PRICING TABLE — 2 columns]
┌─────────────────────┬──────────────────────┐
│       PRO           │    ENTERPRISE        │
│   $29/mo or         │   $99/mo or          │
│   $249/yr           │   $799/yr            │
├─────────────────────┼──────────────────────┤
│ ✓ Unlimited rooms   │ ✓ Everything in Pro  │
│ ✓ HD streaming      │ ✓ White label        │
│ ✓ Ticket sales      │ ✓ Custom domain      │
│ ✓ Tip collection    │ ✓ Priority support   │
│ ✓ AI chat assistant │ ✓ API access         │
│ ✓ 7-day replays     │ ✓ Team accounts      │
└─────────────────────┴──────────────────────┘

[4 BUTTONS]
"Start Pro Monthly →"   → {SEEWHY_APP_URL}/api/stripe/checkout (plan: pro_monthly)
"Start Pro Yearly →"    → {SEEWHY_APP_URL}/api/stripe/checkout (plan: pro_yearly)
"Go Enterprise Monthly →" → checkout (plan: enterprise_monthly)
"Go Enterprise Yearly →"  → checkout (plan: enterprise_yearly)

Note: Each button POSTs to the checkout endpoint with Authorization: Bearer <JWT>
Use a JS snippet on the page to read the auth_token cookie and include it.
```

---

### Funnel 5: Watch Party Invite Page

**Funnel Name:** `SW - Watch Party Invite`
**Domain/Path:** `/watch/{party-slug}`

```
[HERO]
Headline: "You're Invited to a Watch Party"
Sub: "{{host_name}} is hosting a synchronized watch party of {{video_title}}"
     "Watch together, chat live, and react in real time."

[OPT-IN FORM — see Form 4]
Button: "Join the Watch Party →"

[BELOW FORM]
"The party starts at: {{start_time}}"
Countdown timer
```

---

## Part 5: Forms

Build all forms under **Sites → Forms** (or inline in funnels above).

---

### Form 1 — Stream Registration

**Name:** `SW - Stream Registration`

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| First Name | Text | Yes | "Your first name" |
| Last Name | Text | No | "Last name (optional)" |
| Email | Email | Yes | "your@email.com" |
| Mobile Phone | Phone | Yes | "For stream reminders" |
| room_id | Hidden | — | (from URL param) |
| host_user_id | Hidden | — | (from URL param) |
| stream_title | Hidden | — | (from URL param) |

**GDPR/Consent checkbox:**
"By submitting, I agree to receive text reminders about this stream.
Standard message rates apply."

**On Submit:**
1. Create/update GHL contact
2. Add tag: `seewhy-viewer`, `stream-attended`
3. Set custom field: `last_stream_room` = room_id value
4. Trigger Workflow: `SW - New Stream Registration`
5. Redirect to: Thank You page

---

### Form 2 — Ticket Purchase Info

**Name:** `SW - Ticket Intent`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First Name | Text | Yes | |
| Last Name | Text | Yes | |
| Email | Email | Yes | |
| Mobile Phone | Phone | Yes | Reminder texts |
| room_id | Hidden | — | From URL param |
| ticket_price | Hidden | — | From URL param |

**On Submit:**
1. Create/update GHL contact
2. Add tag: `ticket-buyer`
3. Set custom field: `tickets_purchased` = `{{tickets_purchased | default: 0 | plus: 1}}`
4. Redirect to Stripe ticket checkout at SeeWhy LIVE

---

### Form 3 — Creator Account Registration

**Name:** `SW - Creator Registration`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First Name | Text | Yes | |
| Last Name | Text | Yes | |
| Email | Email | Yes | |
| Mobile Phone | Phone | Yes | |
| Display Name | Text | Yes | "Your public creator name" |
| Password | Password | Yes | Min 8 chars |
| Confirm Password | Password | Yes | |

**On Submit:**
1. Call SeeWhy LIVE: `POST {SEEWHY_APP_URL}/api/auth/register`
   with `{ email, password, displayName }`
   (use GHL webhook action to POST to Antigravity bridge, which forwards to SeeWhy)
2. Create GHL contact
3. Add tag: `seewhy-creator`
4. Set custom field: `creator_status` = `creator`
5. Trigger Workflow: `SW - Creator Welcome`
6. Redirect to: Stripe Connect page

---

### Form 4 — Watch Party RSVP

**Name:** `SW - Watch Party RSVP`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| First Name | Text | Yes | |
| Email | Email | Yes | |
| Mobile Phone | Phone | Yes | |
| party_id | Hidden | — | From URL param |
| video_title | Hidden | — | From URL param |

**On Submit:**
1. Create/update GHL contact
2. Add tag: `watchparty-viewer`
3. Increment: `watchparties_joined`
4. Trigger Workflow: `SW - Watch Party Reminder`
5. Redirect to: `{SEEWHY_APP_URL}/watchparty/{{party_id}}`

---

## Part 6: Workflows

Build all workflows under **Automation → Workflows**.

---

### Workflow 1 — SW - New Stream Registration

**Trigger:** Contact Tag Added → `stream-attended`
(also fires on Form 1 submit)

**Steps:**

```
[1] WAIT — 0 minutes (immediate)
    ACTION: Send SMS
    From: SeeWhy LIVE number
    Message:
    "Hey {{contact.first_name}}! 🎬 You're registered for {{custom.stream_title}}.
     We'll text you when it starts. Reply STOP to unsubscribe."

[2] WAIT — Until stream_date minus 1 day
    ACTION: Send SMS
    Message:
    "📅 Reminder: {{custom.stream_title}} is TOMORROW.
     Click to save your spot: {{custom.room_url}}
     Reply STOP to unsubscribe."

[3] WAIT — Until stream_date minus 60 minutes
    ACTION: Send SMS
    Message:
    "🔴 LIVE in 1 hour! {{custom.stream_title}} starts soon.
     Jump in here: {{custom.room_url}}"

[4] WAIT — Until stream_date minus 15 minutes
    ACTION: Send Email
    Subject: "Going live in 15 minutes — {{custom.stream_title}}"
    Body: [Email Template: Stream Starting Soon — see Email Templates]

[5] WAIT — Until stream_date plus 2 hours (post-stream)
    ACTION: Send SMS
    Message:
    "Hope you caught the stream! 🙏
     Replay + more streams at: {SEEWHY_APP_URL}
     Want pro access? {{upgrade_url}}"

[6] IF/ELSE: Tag contains "seewhy-subscriber"?
    YES → END
    NO  → Add to Campaign: SW - Upgrade Nurture Sequence
```

---

### Workflow 2 — SW - Stream Live Alert

**Trigger:** Inbound Webhook → `/workflows/stream-live`
(Antigravity calls `POST /contacts/{contactId}/workflow/{workflowId}` when
`stream.started` fires from SeeWhy LIVE)

**Steps:**

```
[1] IMMEDIATE
    ACTION: Send SMS to all contacts tagged `stream-attended`
    AND tagged with `room-{roomId}` (use dynamic segment)
    Message:
    "🔴 {{contact.custom.host_name}} just went LIVE!
     Watch now: {{contact.custom.room_url}}"

[2] WAIT — 5 minutes
    ACTION: Send Push Notification (if app installed)
    Title: "Live Now!"
    Body: "{{host_name}} is streaming — tap to watch"

[3] UPDATE CONTACT
    ACTION: Add Tag → `stream-live`
    ACTION: Set Field `last_stream_date` = today
```

---

### Workflow 3 — SW - Ticket Purchase Confirmation

**Trigger:** Contact Tag Added → `ticket-buyer`

**Steps:**

```
[1] IMMEDIATE
    ACTION: Send SMS
    Message:
    "✅ Ticket confirmed! You're in for {{custom.event_title}}.
     {{custom.stream_date}} · {{custom.stream_time}}
     Room link: {{custom.room_url}}
     Reply STOP to unsubscribe."

[2] IMMEDIATE
    ACTION: Send Email
    Subject: "Your ticket to {{custom.event_title}} — SeeWhy LIVE"
    Body: [Email Template: Ticket Confirmation]

[3] IMMEDIATE
    ACTION: Create Opportunity
    Pipeline: SeeWhy LIVE Revenue
    Stage: Ticket Buyer
    Name: "Ticket — {{custom.event_title}}"
    Value: {{custom.ticket_price}}

[4] WAIT — 1 day before event
    ACTION: Send SMS
    Message:
    "📅 Your stream is TOMORROW!
     {{custom.event_title}} · {{custom.stream_time}}
     Jump in: {{custom.room_url}}"

[5] WAIT — 1 hour before event
    ACTION: Send SMS
    Message:
    "⏰ 1 hour until {{custom.event_title}}!
     We'll be live at: {{custom.room_url}}"

[6] WAIT — 24 hours after event
    ACTION: Send Email
    Subject: "How was the stream? ⭐"
    Body: [Email Template: Post-Stream Follow-Up]
```

---

### Workflow 4 — SW - Tip Received (Creator Notification)

**Trigger:** Inbound Webhook from Antigravity when `tip.received` fires

**Steps:**

```
[1] IMMEDIATE — UPDATE CREATOR CONTACT
    ACTION: Add Tag → `tip-received`
    ACTION: Set Field `total_revenue_generated` += tip amount

[2] IMMEDIATE — UPDATE VIEWER CONTACT
    ACTION: Add Tag → `tip-sent`
    ACTION: Set Field `total_tips_sent` += tip amount
    ACTION: Set Field `last_tip_amount` = tip amount
    ACTION: Set Field `last_tip_date` = today

[3] IMMEDIATE
    ACTION: Send SMS to VIEWER
    Message:
    "💛 Your tip was sent! {{creator_name}} appreciates you.
     Keep watching: {{room_url}}"

[4] IMMEDIATE
    ACTION: Send SMS to CREATOR
    Message:
    "💰 You received a ${{tip_amount}} tip from {{viewer_name}}!
     Keep it up 🎉"

[5] WAIT — If total_tips_sent > 5000 (over $50)
    ACTION: Add Tag → `vip-tipper`
    ACTION: Send SMS
    "🌟 You're a VIP! {{creator_name}} wanted to personally thank you.
     You've sent over $50 in support."

[6] CREATE OPPORTUNITY
    Pipeline: SeeWhy LIVE Revenue
    Stage: Engaged
    Name: "Tip — ${{tip_amount_dollars}}"
    Value: {{tip_amount_cents}}
    Contact: Viewer contact
```

---

### Workflow 5 — SW - New Subscriber

**Trigger:** Contact Custom Field `seewhy_subscriber` = `true`
OR Tag Added → `seewhy-subscriber`

**Steps:**

```
[1] IMMEDIATE
    ACTION: Send SMS
    Message:
    "🎉 Welcome to SeeWhy LIVE Pro, {{contact.first_name}}!
     Your subscription is active. Access your dashboard:
     {SEEWHY_APP_URL}/dashboard"

[2] IMMEDIATE
    ACTION: Send Email
    Subject: "Welcome to SeeWhy LIVE Pro 🎬"
    Body: [Email Template: Subscriber Welcome]

[3] IMMEDIATE
    ACTION: Move Opportunity to Stage → "Subscriber — Pro"
    (or Enterprise if tier = enterprise)

[4] WAIT — 3 days
    ACTION: Send Email
    Subject: "Quick-start guide: your first live stream"
    Body: [Email Template: Creator Quick Start]

[5] WAIT — 7 days
    ACTION: Send SMS
    Message:
    "How's your first week on SeeWhy LIVE Pro? 🎬
     Need help? Reply to this message anytime."

[6] WAIT — 30 days
    ACTION: IF streams_attended = 0
    THEN: Send Re-Engagement Email
    Subject: "We miss you! Your pro account is waiting."
```

---

### Workflow 6 — SW - Creator Welcome

**Trigger:** Tag Added → `seewhy-creator`

**Steps:**

```
[1] IMMEDIATE
    ACTION: Send SMS
    Message:
    "👋 Welcome to SeeWhy LIVE, {{contact.first_name}}!
     Your creator account is ready.
     Next step: connect Stripe to accept tips + sell tickets.
     {SEEWHY_APP_URL}/api/stripe/connect"

[2] IMMEDIATE
    ACTION: Send Email
    Subject: "Your SeeWhy LIVE creator account is ready"
    Body: [Email Template: Creator Welcome]

[3] WAIT — 1 day
    IF stripe_connect_active = false
    ACTION: Send SMS
    Message:
    "💳 Don't forget to connect Stripe to start earning!
     It takes 2 minutes: {SEEWHY_APP_URL}/api/stripe/connect
     Questions? Just reply here."

[4] WAIT — 3 days
    ACTION: Send Email
    Subject: "Create your first room — step by step"
    Body: [Email Template: First Room Setup Guide]

[5] WAIT — 7 days
    IF creator has not created a room (check via Antigravity API)
    ACTION: Send SMS
    Message:
    "🎬 Ready to go live? Create your first room in 60 seconds:
     {SEEWHY_APP_URL}/room/new"
```

---

### Workflow 7 — SW - Churn / Subscription Cancelled

**Trigger:** Tag Added → `churned-subscriber`
(Antigravity sets this when `customer.subscription.deleted` fires from Stripe)

**Steps:**

```
[1] IMMEDIATE
    ACTION: Remove Tag → `seewhy-subscriber`
    ACTION: Remove Tag → `subscriber-pro`
    ACTION: Set Field `seewhy_subscriber` = false
    ACTION: Move Opportunity to Stage → Churned

[2] IMMEDIATE
    ACTION: Send Email
    Subject: "We're sorry to see you go"
    Body: [Email Template: Cancellation / Win-Back]

[3] WAIT — 3 days
    ACTION: Send SMS
    Message:
    "Miss SeeWhy LIVE? You can reactivate anytime:
     {SEEWHY_APP_URL}/upgrade
     We'd love to have you back 💙"

[4] WAIT — 14 days
    ACTION: Send Email
    Subject: "Special offer: come back to SeeWhy LIVE Pro"
    Body: Include discount code if available

[5] ADD TO CAMPAIGN: SW - Win-Back Sequence (30-day nurture)
```

---

### Workflow 8 — SW - Payment Failed

**Trigger:** Tag Added → `payment-failed`

**Steps:**

```
[1] IMMEDIATE
    ACTION: Send SMS
    Message:
    "⚠️ SeeWhy LIVE: Your payment didn't go through.
     Update your billing info to keep pro access:
     {SEEWHY_APP_URL}/api/stripe/portal"

[2] IMMEDIATE
    ACTION: Send Email
    Subject: "Action required: update your billing info"
    Body: [Email Template: Payment Failed]

[3] WAIT — 2 days
    IF still tagged payment-failed:
    ACTION: Send SMS
    Message:
    "Reminder: your SeeWhy LIVE subscription is on hold.
     Fix it in 30 seconds: {SEEWHY_APP_URL}/api/stripe/portal"

[4] WAIT — 5 days
    IF still tagged payment-failed:
    ACTION: Add Tag → `churned-subscriber`
    → Triggers Workflow 7 automatically
```

---

### Workflow 9 — SW - Watch Party Reminder

**Trigger:** Tag Added → `watchparty-viewer`

**Steps:**

```
[1] IMMEDIATE
    ACTION: Send SMS
    Message:
    "🍿 You're in! Watch party confirmed: {{custom.video_title}}
     Starts at: {{custom.party_start_time}}
     Join here: {SEEWHY_APP_URL}/watchparty/{{custom.party_id}}"

[2] WAIT — 30 minutes before party start
    ACTION: Send SMS
    Message:
    "🎬 Watch party starts in 30 min!
     {{custom.video_title}} with {{custom.host_name}}
     Jump in: {SEEWHY_APP_URL}/watchparty/{{custom.party_id}}"
```

---

### Workflow 10 — SW - GHL → SeeWhy LIVE Action Trigger

**Trigger:** Any of:
- Pipeline stage moved to "Subscriber — Pro"
- Manual trigger from contact record
- Tag Added → `trigger-stream-start`

**Steps:**

```
[1] IMMEDIATE
    ACTION: Webhook
    Method: POST
    URL: https://your-bridge-domain.com/ghl/trigger
    Headers:
      X-Bridge-Secret: {{bridge_secret}}
      Content-Type: application/json
    Body:
    {
      "action": "{{custom.seewhy_action}}",
      "roomId": "{{custom.last_stream_room}}",
      "userId": "{{custom.seewhy_user_id}}",
      "content": "{{custom.chat_message}}"
    }
```

---

## Part 7: Inbound Webhook Triggers

GHL receives events FROM Antigravity bridge at these trigger URLs.
Navigate to **Automation → Workflows → Triggers → Inbound Webhook** to set up.

Create one Inbound Webhook trigger workflow per event type:

| Event | Workflow Triggered | URL Generated by GHL |
|-------|-------------------|---------------------|
| stream.started | SW - Stream Live Alert | `https://services.leadconnectorhq.com/hooks/{ID}` |
| stream.ended | SW - Stream Ended Cleanup | Same pattern |
| tip.received | SW - Tip Received | Same pattern |
| ticket.purchased | SW - Ticket Purchase Confirmation | Same pattern |
| subscriber.new | SW - New Subscriber | Same pattern |
| viewer.joined | SW - Viewer Tag Update | Same pattern |

**Give each webhook URL to Antigravity** so it can call them via:
```
POST /contacts/{contactId}/workflow/{workflowId}
```

**Or** configure Antigravity to POST the raw event payload to the GHL inbound
webhook URL directly — GHL will parse the body and use it as trigger data.

---

## Part 8: Email Templates

Build under **Marketing → Emails → Templates**.

---

### Email: Stream Starting Soon

**Subject:** `Going live in 15 minutes — {{custom.stream_title}}`

```html
Preheader: "Your stream is about to start 🎬"

[Header: SeeWhy LIVE logo]

Hey {{contact.first_name}},

{{custom.stream_title}} goes live in just 15 minutes.

[BIG BUTTON]
"Watch Live Now →"
link: {{custom.room_url}}

Stream details:
• Host: {{custom.host_name}}
• Date: {{custom.stream_date}}
• Room: {{custom.stream_title}}

Can't make it live? Upgrade to Pro to get 7-day replay access.

[Secondary button] "Upgrade for Replays →"
link: {SEEWHY_APP_URL}/upgrade

See you in the room,
The SeeWhy LIVE Team

[Footer: unsubscribe link, address]
```

---

### Email: Ticket Confirmation

**Subject:** `Your ticket to {{custom.event_title}} — SeeWhy LIVE`

```html
Preheader: "You're confirmed! Here's everything you need."

[Header: SeeWhy LIVE logo + event banner image]

Hi {{contact.first_name}},

Your ticket is confirmed! 🎟️

EVENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Event:    {{custom.event_title}}
Date:     {{custom.stream_date}}
Time:     {{custom.stream_time}}
Your link: {{custom.room_url}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[BIG BUTTON] "Enter the Room →"
link: {{custom.room_url}}

ADD TO CALENDAR:
[Google Calendar] [Apple Calendar] [Outlook]

You'll receive a text reminder 1 hour before the stream starts.

See you live,
{{custom.host_name}} + the SeeWhy LIVE Team

[Footer]
```

---

### Email: Subscriber Welcome

**Subject:** `Welcome to SeeWhy LIVE Pro 🎬`

```html
Preheader: "Your pro access is active. Here's how to get started."

[Header: Hero image — celebration/confetti]

Welcome to the pro side, {{contact.first_name}}! 🎉

Your SeeWhy LIVE Pro subscription is now active.

HERE'S WHAT YOU CAN DO:
✓ Create unlimited live stream rooms
✓ Sell tickets to your events
✓ Collect tips from your viewers
✓ Access the AI chat assistant
✓ Watch 7-day replays of any stream

[BUTTON] "Go to My Dashboard →"
link: {SEEWHY_APP_URL}/dashboard

YOUR FIRST STEPS:
1. Create your first room → {SEEWHY_APP_URL}/room/new
2. Connect Stripe to accept payments → {SEEWHY_APP_URL}/api/stripe/connect
3. Share your stream link with your audience

Questions? Just reply to this email.

Welcome aboard,
The SeeWhy LIVE Team

[Footer]
```

---

### Email: Creator Welcome

**Subject:** `Your SeeWhy LIVE creator account is ready`

```html
Preheader: "Start streaming in 3 steps."

[Header: Creator dashboard screenshot or illustration]

Hi {{contact.first_name}},

Your SeeWhy LIVE creator account is all set up!

TO START EARNING, COMPLETE THESE 3 STEPS:

[STEP 1] ✓ Account Created
[STEP 2] Connect Stripe → {SEEWHY_APP_URL}/api/stripe/connect
[STEP 3] Create Your First Room → {SEEWHY_APP_URL}/room/new

[PRIMARY BUTTON] "Connect Stripe →"
link: {SEEWHY_APP_URL}/api/stripe/connect

Why connect Stripe?
• Accept tips from your viewers during live streams
• Sell tickets to your events
• Get paid out directly to your bank account
• SeeWhy LIVE takes only {{platform_fee}}% — you keep the rest

[SECONDARY BUTTON] "View Creator Dashboard →"

Questions? Reply to this email or visit our help center.

Let's go live,
The SeeWhy LIVE Team

[Footer]
```

---

### Email: Cancellation / Win-Back

**Subject:** `We're sorry to see you go`

```html
Preheader: "Your account has been cancelled — but we'd love you back."

[Header: Simple, warm design]

Hi {{contact.first_name}},

Your SeeWhy LIVE Pro subscription has been cancelled.

You'll still have access until {{custom.subscription_end_date}}.
After that, your account will revert to the free plan.

WHAT YOU'LL LOSE:
• Ticket sales & tips
• AI chat assistant
• 7-day replay access
• Custom rooms

WANT TO COME BACK?
You can reactivate anytime — your content and settings are saved.

[BUTTON] "Reactivate My Account →"
link: {SEEWHY_APP_URL}/upgrade

If you cancelled because of a specific issue, we'd love to fix it.
Just hit reply and tell us what went wrong.

Thank you for being part of SeeWhy LIVE.

The Team

[Footer]
```

---

## Part 9: SMS Snippets (Quick Reference)

Store these under **Marketing → SMS Templates**:

| Template Name | Message |
|---------------|---------|
| `SW - Stream Reminder 1hr` | `⏰ 1 hour until {{stream_title}}! Join here: {{room_url}}` |
| `SW - Stream Reminder 15min` | `🔴 Going LIVE in 15 min! {{stream_title}}: {{room_url}}` |
| `SW - Stream Live Now` | `🔴 LIVE NOW: {{stream_title}} — Watch: {{room_url}}` |
| `SW - Tip Thank You` | `💛 Your ${{tip_amount}} tip was sent to {{creator_name}}!` |
| `SW - Ticket Confirmed` | `✅ Ticket confirmed for {{event_title}} on {{stream_date}}.` |
| `SW - Sub Welcome` | `🎉 SeeWhy LIVE Pro is active! Dashboard: {{dashboard_url}}` |
| `SW - Payment Failed` | `⚠️ Payment failed. Update billing: {{portal_url}}` |
| `SW - Win-Back 3day` | `Miss SeeWhy LIVE? Reactivate: {{upgrade_url}} 💙` |

---

## Part 10: Membership Area (for Subscribers)

Navigate to **Sites → Membership** → Create Site: **SeeWhy LIVE Members**

### Structure

```
Members Area
├── Home (dashboard)
│   └── Links to active streams, recent rooms, creator tools
├── My Streams
│   └── Embedded link to {SEEWHY_APP_URL}/dashboard
├── Past Replays
│   └── Embedded iframe or redirect: {SEEWHY_APP_URL}/rooms?filter=ended
├── Watch Parties
│   └── Redirect: {SEEWHY_APP_URL}/watchparty
├── Upgrade / Billing
│   └── Link to {SEEWHY_APP_URL}/api/stripe/portal
└── Creator Tools (visible to creator-tagged contacts only)
    ├── Create Room → {SEEWHY_APP_URL}/room/new
    ├── Stream Config → {SEEWHY_APP_URL}/dashboard
    └── Connect Stripe → {SEEWHY_APP_URL}/api/stripe/connect
```

**Access Rules:**
- Home, My Streams: `seewhy-subscriber` OR `seewhy-creator` tag required
- Creator Tools: `seewhy-creator` tag required
- Past Replays: `seewhy-subscriber` tag required (free users see upgrade prompt)

---

## Part 11: Custom Menu (Navigation)

Navigate to **Sites → Client Portal → Custom Menus**.

Create menu: **SeeWhy LIVE Navigation**

```
Menu Items:
1. Home               → /members/home
2. Live Streams       → {SEEWHY_APP_URL}/rooms
3. Watch Parties      → {SEEWHY_APP_URL}/watchparty
4. My Dashboard       → {SEEWHY_APP_URL}/dashboard
5. Upgrade to Pro     → {GHL_DOMAIN}/upgrade
6. Billing            → {SEEWHY_APP_URL}/api/stripe/portal
```

---

## Part 12: Snapshots (Export / Repurpose)

Once everything above is built, export a **GHL Snapshot** containing:
- All 5 funnels
- All 4 forms
- All 10 workflows
- The pipeline
- All email templates
- All SMS templates
- All custom fields and tags
- The membership site

**Snapshot Name:** `SeeWhy LIVE - Full Stack v1.0`

This snapshot can be imported into any new GHL sub-account to instantly
replicate the entire SeeWhy LIVE CRM + automation setup.

---

## Part 13: Configuration Checklist

### Step 1 — Custom Fields & Tags
- [ ] Create all 14 custom contact fields (Part 1)
- [ ] Create all tags in Settings → Tags (Part 2)

### Step 2 — Pipeline
- [ ] Create SeeWhy LIVE Revenue pipeline with 8 stages (Part 3)

### Step 3 — Funnels
- [ ] Build Stream Registration Funnel (2 pages) (Part 4, Funnel 1)
- [ ] Build Ticket Purchase Funnel (2 pages) (Part 4, Funnel 2)
- [ ] Build Creator Onboarding Funnel (3 pages) (Part 4, Funnel 3)
- [ ] Build Upgrade/Subscription Page (1 page) (Part 4, Funnel 4)
- [ ] Build Watch Party Invite Page (1 page) (Part 4, Funnel 5)

### Step 4 — Forms
- [ ] Build Form 1: Stream Registration (Part 5)
- [ ] Build Form 2: Ticket Intent (Part 5)
- [ ] Build Form 3: Creator Registration (Part 5)
- [ ] Build Form 4: Watch Party RSVP (Part 5)
- [ ] Embed each form in its corresponding funnel page

### Step 5 — Workflows
- [ ] Workflow 1: New Stream Registration
- [ ] Workflow 2: Stream Live Alert
- [ ] Workflow 3: Ticket Purchase Confirmation
- [ ] Workflow 4: Tip Received (Creator Notification)
- [ ] Workflow 5: New Subscriber
- [ ] Workflow 6: Creator Welcome
- [ ] Workflow 7: Churn / Subscription Cancelled
- [ ] Workflow 8: Payment Failed
- [ ] Workflow 9: Watch Party Reminder
- [ ] Workflow 10: GHL → SeeWhy LIVE Action Trigger

### Step 6 — Inbound Webhooks
- [ ] Create inbound webhook trigger per event type (Part 7)
- [ ] Copy each generated webhook URL
- [ ] Give all URLs to Antigravity bridge operator to configure

### Step 7 — Email Templates
- [ ] Stream Starting Soon
- [ ] Ticket Confirmation
- [ ] Subscriber Welcome
- [ ] Creator Welcome
- [ ] Cancellation / Win-Back

### Step 8 — SMS Templates
- [ ] All 8 SMS templates (Part 9)

### Step 9 — Membership Site
- [ ] Create Members Area with 5 sections (Part 10)
- [ ] Set access rules per section

### Step 10 — Navigation
- [ ] Create SeeWhy LIVE Navigation menu (Part 11)
- [ ] Attach to Membership site

### Step 11 — Snapshot
- [ ] Export full snapshot: SeeWhy LIVE - Full Stack v1.0

---

## Part 14: Variables Reference

These are the merge tags / custom values used throughout funnels, workflows,
emails and SMS. Set as **Custom Values** in Settings → Custom Values:

| Variable | Value | Used In |
|----------|-------|---------|
| `{{seewhy_app_url}}` | `https://your-seewhy-domain.com` | All links |
| `{{bridge_url}}` | `https://your-bridge-domain.com` | Webhook actions |
| `{{bridge_secret}}` | `<bridge secret>` | Webhook headers |
| `{{platform_fee}}` | `15` | Creator emails |
| `{{upgrade_url}}` | `{seewhy_app_url}/upgrade` | Win-back SMS |
| `{{dashboard_url}}` | `{seewhy_app_url}/dashboard` | Subscriber SMS |
| `{{portal_url}}` | `{seewhy_app_url}/api/stripe/portal` | Payment failed SMS |
| `{{support_email}}` | `support@seewhy.live` | Email footers |

---

## The Complete Data Flow Through GHL

```
1. Prospect sees Stream Registration funnel (GHL hosts the page)
          ↓
2. Prospect fills out Form 1 (name + email + phone)
          ↓
3. GHL creates contact, adds tags, fires Workflow 1
          ↓
4. Workflow 1 sends confirmation SMS immediately
          ↓
5. Day of stream: Workflow 1 sends reminder SMS + email
          ↓
6. Host goes live on SeeWhy LIVE
          ↓
7. SeeWhy LIVE fires stream.started event
          ↓
8. Antigravity receives event, calls GHL REST API:
   - Tags all registered contacts with `stream-live`
   - Triggers Workflow 2 (Stream Live Alert) on each
          ↓
9. GHL Workflow 2 sends "Going LIVE now!" SMS to all registrants
          ↓
10. Viewer joins stream, tips the creator
          ↓
11. SeeWhy LIVE fires tip.received event
          ↓
12. Antigravity calls GHL REST API:
    - Upserts viewer contact
    - Adds `tip-sent` tag
    - Triggers Workflow 4 (Tip Received)
    - Creates Opportunity in pipeline
          ↓
13. Workflow 4 sends thank-you SMS to viewer + notification to creator
          ↓
14. Stream ends — SeeWhy LIVE fires stream.ended
          ↓
15. Antigravity removes `stream-live` tag, adds `stream-completed`
          ↓
16. Workflow 1 (post-stream step) fires: "Hope you caught the stream!" SMS
    + adds to Upgrade Nurture campaign for non-subscribers
```
