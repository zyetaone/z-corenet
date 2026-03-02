# AWA Workplace Cognitive Design Tool — Migration Design

**Date**: 2026-03-02
**Status**: Approved
**Source**: `docs/remixed-a39be00c.html` (920-line single-file HTML app)
**Target**: SvelteKit 2 + Svelte 5 + D1 + Cloudflare

---

## Goal

Port the AWA "Designing Workplaces That Think" interactive exercise from a single HTML file into a production SvelteKit app with real multi-user voting, session management, and a live dashboard. Deploy to Cloudflare.

## Key Design Decisions

1. **Real multi-user voting** — no simulation. Real participants, real votes, real tallying.
2. **Session-based** — facilitator creates a session (gets join code/link), participants join and vote within that session.
3. **Live dashboard** — results update via polling (3-5s interval) as participants vote.
4. **Editable features** — facilitator can add/remove/edit the 28 default features per session.
5. **No phase reveal upfront** — intro screen does NOT mention Phase A/B. Phase B is a surprise transition.
6. **Mobile-first** — all layouts designed for mobile, responsive up to desktop.
7. **AI prompt section** — built but hidden (parked for now).
8. **Approach**: SPA with SvelteKit API routes + D1. Polling for live updates. Single deployable.

---

## Data Model (D1)

```sql
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  code       TEXT UNIQUE NOT NULL,
  title      TEXT NOT NULL DEFAULT 'Designing Workplaces That Think',
  created_at INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'open'  -- 'open' | 'closed'
);

CREATE TABLE session_features (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL REFERENCES sessions(id),
  feature_id   INTEGER NOT NULL,  -- ordering key within session
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  category     TEXT NOT NULL,
  has_evidence INTEGER NOT NULL DEFAULT 0,  -- boolean
  level        TEXT NOT NULL DEFAULT 'neither',  -- 'individual' | 'communal' | 'neither'
  caption      TEXT,  -- evidence caption, nullable
  UNIQUE(session_id, feature_id)
);

CREATE TABLE participants (
  id         TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  name       TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE votes (
  id             TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id),
  session_id     TEXT NOT NULL REFERENCES sessions(id),
  phase          TEXT NOT NULL,  -- 'individual' | 'communal'
  feature_id     INTEGER NOT NULL,
  UNIQUE(participant_id, phase, feature_id)
);

CREATE TABLE comments (
  id             TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL REFERENCES participants(id),
  session_id     TEXT NOT NULL REFERENCES sessions(id),
  text           TEXT NOT NULL
);
```

When a session is created, the 28 default features are copied from `$lib/data/default-features.ts` into `session_features`. The facilitator can then customize before sharing the join link.

---

## Route Structure

```
src/routes/
├── +layout.svelte              # Root layout: fonts, CSS, dark theme
├── +page.svelte                # Landing: "Create Session" or "Join Session"
├── layout.css                  # TailwindCSS entry + CSS custom properties
│
├── session/
│   ├── create/
│   │   ├── +page.svelte        # Facilitator: title, feature editor, create button
│   │   └── +page.server.ts     # POST: insert session + copy default features
│   │
│   └── [code]/
│       ├── +layout.svelte      # Session layout: loads session data via context
│       ├── +layout.server.ts   # load(): fetch session by code, 404 if not found
│       ├── +page.svelte        # Participant intro (name input, begin button)
│       │                       # NO mention of phases
│       │
│       ├── vote/
│       │   ├── +page.svelte    # Voting flow (Phase A → Phase B client-side)
│       │   └── +page.server.ts # load(): features for this session
│       │                       # POST action: submit votes + comment
│       │
│       └── dashboard/
│           ├── +page.svelte    # Live dashboard with polling
│           └── +page.server.ts # load(): initial aggregate data
│
├── api/
│   └── session/
│       └── [code]/
│           ├── +server.ts      # GET: session status + participant count
│           └── votes/
│               └── +server.ts  # GET: tallied results (polled every 3-5s)
```

---

## Component Architecture

```
src/lib/
├── data/
│   └── default-features.ts     # 28 default features (template for new sessions)
│
├── components/
│   ├── FeatureCard.svelte       # Selectable card: icon, name, desc, check
│   ├── FeatureGrid.svelte       # Grid of FeatureCards with selection logic
│   ├── FeatureEditor.svelte     # Add/remove/edit features (facilitator)
│   ├── PhaseBanner.svelte       # Phase header with description
│   ├── VoteTopbar.svelte        # Sticky topbar: phase badge + counter
│   ├── ScoreStrip.svelte        # Three score cards (ind/com/overall)
│   ├── RankPanel.svelte         # Ranked feature list with animated bars
│   ├── RankRow.svelte           # Single ranked feature row
│   ├── EvidenceTag.svelte       # Green/red evidence badge
│   ├── AiPrompt.svelte          # AI visualization prompt (hidden/parked)
│   └── ui/
│       ├── Button.svelte        # Primary button (gradient style)
│       └── Input.svelte         # Text input (name, etc.)
│
├── stores/
│   └── voting.svelte.ts         # Voting state: $state/$derived runes
│
└── server/
    ├── db.ts                    # D1 helper (typed queries)
    └── session.ts               # Session CRUD operations
```

---

## State Management

`$lib/stores/voting.svelte.ts`:

```
selectedA: Set<number>     — $state, individual phase picks
selectedB: Set<number>     — $state, communal phase picks
phase: 'a' | 'b'          — $state, current voting phase
participantName: string    — $state
count: number              — $derived from current phase set size
canSubmit: boolean         — $derived (count === 5)
buttonText: string         — $derived from phase + count
```

---

## User Flow

### Facilitator

1. Lands on `/` → clicks "Create Session"
2. `/session/create` — edits title, customizes features (defaults pre-loaded), clicks "Create"
3. Gets session code + shareable link (`/session/ABC123`)
4. Navigates to `/session/ABC123/dashboard` to watch live results
5. Shares link with participants

### Participant

1. Opens `/session/ABC123`
2. Sees branding + "This exercise explores what matters most for cognitive performance"
3. Optionally enters name, clicks "Begin"
4. **Phase A** (not labeled as such): "Select the 5 features with the greatest impact on individual cognitive performance"
5. Picks 5 → "Continue"
6. **Phase B** (surprise): "Now for the team perspective — from the remaining features, pick 5 for team cognitive performance"
7. Picks 5 + optional free text → "Submit"
8. Redirected to dashboard (or "Thank you" screen)

---

## Mobile-First Layout

- Feature grid: 1 column on mobile (`< 640px`), 2 columns on `sm:` breakpoint
- Feature cards: full-width, 48px+ touch targets
- Topbar: icon + counter only on mobile (no title text)
- Dashboard score strip: stacks vertically on mobile
- Dashboard panels: stack vertically on mobile
- Base font: 16px, headings scale down on mobile
- No horizontal scrolling anywhere

---

## Cloudflare Deployment

- Switch from `@sveltejs/adapter-auto` to `@sveltejs/adapter-cloudflare`
- D1 database binding in `wrangler.toml`
- Platform type: `App.Platform` with `env.DB` for D1 access
- API routes access D1 via `platform.env.DB`

---

## Styling Strategy

- TailwindCSS v4 utilities for layout, spacing, typography
- CSS custom properties in `layout.css` for theme colors (--teal, --accent, --dark, etc.)
- Google Fonts: DM Sans (body) + Playfair Display (headings)
- Scoped `<style>` in components only for animations (bar fill transitions, fade-in)
- `@tailwindcss/forms` for input styling
- `@tailwindcss/typography` for any prose content

---

## Parked Features

- **AI Prompt Section**: Component built, rendered in dashboard DOM, but hidden. Can be toggled visible later via facilitator control or feature flag.
