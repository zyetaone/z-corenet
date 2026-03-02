# UX Redesign: Sessionless Facilitator + Visual Clusters

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rethink the entire user flow — facilitator projects dashboard (QR → reveal → analytics → reset), participants vote on mobile through category-clustered cards, land on a thank-you page with their picks. Sessions become invisible infrastructure.

**Architecture:** Two distinct experiences sharing one codebase. Facilitator at `/dashboard` (two-state: Lobby + Analytics). Participant at `/` → `/vote` → `/thanks`. No session codes. Reset creates a new session behind the scenes.

---

## Routes

| Route | Who | Purpose |
|-------|-----|---------|
| `/` | Participant | Intro + name entry → join |
| `/vote` | Participant | Two-phase feature selection (visual clusters) |
| `/thanks` | Participant | Thank you + personal picks |
| `/dashboard` | Facilitator | QR lobby → manual reveal → analytics → reset |
| `/api/votes` | Internal | JSON tally for dashboard polling |
| `/api/reset` | Facilitator | POST: close session, create fresh one |

---

## Facilitator Dashboard (`/dashboard`)

### State 1: Lobby

- Large QR code encoding the root URL (the domain)
- Title: "Designing Workplaces That Think"
- Live counters: "X joined · Y voted" (polls every 3-4s)
- "Show Results" button — subtle until votes come in, then pulses gently
- No auth required

### State 2: Analytics (after manual reveal)

- Score Strip (Individual score, Communal score, Overall %)
- Rank Panels side-by-side (Top 5 each)
- Practical Next Steps (3 action cards)
- Research Footer (AWA + CEBMa links)
- "New Exercise" button (small, corner) with confirmation modal
- Results animate in on reveal (cards fly/fade in sequence)

### Transition

- Facilitator clicks "Show Results" → dashboard state flips from Lobby to Analytics
- State is local (client-side) — not persisted. Refreshing goes back to Lobby if votes exist, or stays Lobby if no votes
- "New Exercise" POSTs to `/api/reset` → dashboard polls detect new session → snaps back to Lobby

---

## Participant Mobile Flow

### Intro (`/`)

- Brain icon, title, subtitle
- Name input (optional)
- "Join Session →" button
- Clean, mobile-first, no phase explainer cards (save screen space — they'll see phases during voting)

### Vote (`/vote`) — Visual Clusters

Features grouped by category with spatial proximity (like sticky notes on a wall):

| Group | Icon | Count |
|-------|------|-------|
| Light & Daylight | 💡 | 2 |
| Air & Thermal | 🌡️ | 2 |
| Acoustic | 🔇 | 2 |
| Biophilic & Nature | 🌿 | 3 |
| Movement & Wellness | 🏃 | 6 |
| Technology | 📱 | 4 |
| Social & Spatial | 🤝 | 3 |
| Furniture & Aesthetics | 🪑 | 6 |

**Layout:**
- Small muted category label as divider (not a header)
- Cards within group: tighter spacing
- Gap between groups: larger spacing
- 2 columns on mobile, 3-4 on tablet/desktop
- Cards identical to current dark-theme FeatureCard

### Thank You (`/thanks`) — New Page

- Checkmark icon + "Thanks for voting!"
- "Your Individual picks:" — list of 5 feature names
- "Your Connected picks:" — list of 5 feature names
- "Look up at the screen for the group results!"
- Picks passed via cookie or returned from vote POST action

---

## Reset Mechanism (`POST /api/reset`)

1. `UPDATE sessions SET status = 'closed' WHERE status = 'open'`
2. Create new session (fresh UUID, internal code, same title)
3. Copy default features to new session
4. Return `{ ok: true }`
5. Dashboard detects new session on next poll → Lobby state

**Stale participant handling:**
- Participants with old `session_id` cookies who hit `/vote` → check session status → if closed, redirect to `/`
- No error shown, just fresh start

---

## QR Code

- Use lightweight client-side QR generation (no new server dependency)
- Encode just the domain: `https://corenet.rdtect.workers.dev`
- Render as SVG for crisp projection at any size
- White QR on dark background to match theme

---

## Data Model

**No schema changes.** Sessions still exist in DB for clean isolation between runs. The `code` column stays (internal use) but is never shown to users.

---

## What Gets Deleted

- Phase explainer cards on intro (simplify entry)
- Session code generation/display/entry
- BrainNetworkBackground component (replaced with simple gradient glow — already done)
- Any remaining session code references

## What Gets Added

- QR code component (client-side SVG generation)
- Dashboard lobby state (QR + counters + reveal button)
- `/thanks` route (personal picks display)
- `/api/reset` endpoint
- Confirmation modal for reset
- Category grouping logic in FeatureGrid
- Category labels/dividers in vote UI

## What Gets Modified

- Dashboard: complete rewrite (two states)
- FeatureGrid: accept grouped features, render with category spacing
- Vote +page.server.ts: return selected feature names on POST (for thanks page)
- Intro +page.svelte: simplify (remove phase cards)
- default-features.ts: add `group` field to each feature for clustering
