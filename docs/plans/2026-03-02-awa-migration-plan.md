# AWA Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the AWA "Designing Workplaces That Think" HTML into a production SvelteKit app with session-based multi-user voting, editable features, and a live facilitator dashboard on Cloudflare.

**Architecture:** SvelteKit 2 + Svelte 5 runes + D1 (via Drizzle ORM) + Cloudflare Workers adapter. Polling-based live dashboard. Single deployable. Follow workspace-studio-v3 patterns: `GameEngine`-style state class, `getDb()` helper with D1 WeakMap cache, Drizzle schema + queries pattern, `*.remote.ts` experimental remote functions.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, TailwindCSS v4, Drizzle ORM, D1, adapter-cloudflare, bun

**Reference:** `docs/remixed-a39be00c.html` (source), `docs/plans/2026-03-02-awa-migration-design.md` (approved design), workspace-studio-v3 at `/home/rdtect/Projects/zyeta/workspace-studio/workspace-studio-v3/` (pattern reference)

---

## Task 1: Cloudflare Adapter + Wrangler + Platform Types

**Files:**
- Modify: `package.json` (add deps)
- Modify: `svelte.config.js` (switch adapter)
- Create: `wrangler.jsonc`
- Modify: `src/app.d.ts` (Platform types)

**Step 1: Install dependencies**

```bash
bun add -d @sveltejs/adapter-cloudflare drizzle-orm wrangler
```

**Step 2: Switch adapter in svelte.config.js**

```js
import adapter from '@sveltejs/adapter-cloudflare'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			platformProxy: {
				configPath: 'wrangler.jsonc',
				persist: true
			}
		})
	}
}

export default config
```

**Step 3: Create wrangler.jsonc**

```jsonc
{
	"$schema": "./node_modules/wrangler/config-schema.json",
	"name": "corenet",
	"compatibility_date": "2026-03-02",
	"compatibility_flags": ["nodejs_compat"],
	"main": ".svelte-kit/cloudflare/_worker.js",
	"assets": {
		"binding": "ASSETS",
		"directory": ".svelte-kit/cloudflare"
	},
	"workers_dev": true,
	"preview_urls": true,
	"d1_databases": [
		{
			"binding": "DB",
			"database_name": "corenet-db",
			"database_id": "placeholder-create-with-wrangler"
		}
	]
}
```

**Step 4: Update src/app.d.ts with Platform types**

Follow workspace-studio-v3 pattern. Define D1Database interface and App.Platform:

```ts
declare global {
	interface D1Database {
		prepare(query: string): D1PreparedStatement
		dump(): Promise<ArrayBuffer>
		batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
		exec(query: string): Promise<D1ExecResult>
	}
	interface D1PreparedStatement {
		bind(...values: unknown[]): D1PreparedStatement
		first<T = unknown>(colName?: string): Promise<T | null>
		run<T = unknown>(): Promise<D1Result<T>>
		all<T = unknown>(): Promise<D1Result<T>>
		raw<T = unknown>(): Promise<T[]>
	}
	interface D1Result<T = unknown> {
		results?: T[]
		success: boolean
		error?: string
		meta: object
	}
	interface D1ExecResult {
		count: number
		duration: number
	}

	interface Env {
		DB: D1Database
	}

	namespace App {
		interface Platform {
			env: Env
			ctx: ExecutionContext
			caches: CacheStorage
			cf?: IncomingRequestCfProperties
		}
	}
}
export {}
```

**Step 5: Verify build**

```bash
bun run check
```

Expected: PASS (no type errors)

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: switch to cloudflare adapter with D1 binding"
```

---

## Task 2: Database Schema + Drizzle ORM Setup

**Files:**
- Create: `src/lib/server/db/schema.ts`
- Create: `src/lib/server/db/index.ts`
- Create: `drizzle.config.ts`
- Create: `migrations/0001_initial.sql`

**Step 1: Create Drizzle schema**

File: `src/lib/server/db/schema.ts`

Follow v3 pattern. Define 5 tables: `sessions`, `sessionFeatures`, `participants`, `votes`, `comments`.

```ts
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	code: text('code').notNull().unique(),
	title: text('title').notNull().default('Designing Workplaces That Think'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
	status: text('status').notNull().default('open') // 'open' | 'closed'
})

export const sessionFeatures = sqliteTable('session_features', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	sessionId: text('session_id').notNull(),
	featureId: integer('feature_id').notNull(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	category: text('category').notNull(),
	hasEvidence: integer('has_evidence', { mode: 'boolean' }).notNull().default(false),
	level: text('level').notNull().default('neither'), // 'individual' | 'communal' | 'neither'
	caption: text('caption')
}, (table) => [
	index('sf_session_idx').on(table.sessionId),
	uniqueIndex('sf_session_feature_idx').on(table.sessionId, table.featureId)
])

export const participants = sqliteTable('participants', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	sessionId: text('session_id').notNull(),
	name: text('name'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
}, (table) => [
	index('participants_session_idx').on(table.sessionId)
])

export const votes = sqliteTable('votes', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	participantId: text('participant_id').notNull(),
	sessionId: text('session_id').notNull(),
	phase: text('phase').notNull(), // 'individual' | 'communal'
	featureId: integer('feature_id').notNull()
}, (table) => [
	index('votes_session_idx').on(table.sessionId),
	uniqueIndex('votes_unique_idx').on(table.participantId, table.phase, table.featureId)
])

export const comments = sqliteTable('comments', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	participantId: text('participant_id').notNull(),
	sessionId: text('session_id').notNull(),
	text: text('text').notNull()
}, (table) => [
	index('comments_session_idx').on(table.sessionId)
])

export type Session = typeof sessions.$inferSelect
export type SessionFeature = typeof sessionFeatures.$inferSelect
export type Participant = typeof participants.$inferSelect
export type Vote = typeof votes.$inferSelect
export type Comment = typeof comments.$inferSelect
```

**Step 2: Create DB helper**

File: `src/lib/server/db/index.ts`

Copy the v3 `getDb()` pattern with D1 WeakMap caching:

```ts
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import * as schema from './schema'

export type DbClient = BaseSQLiteDatabase<'async', unknown, typeof schema>

const d1Cache = new WeakMap<object, ReturnType<typeof drizzleD1>>()
let localDbInstance: DbClient | null = null

export function setLocalDb(db: DbClient) {
	localDbInstance = db
}

export function getDb(platform?: App.Platform): DbClient {
	if (platform?.env?.DB) {
		const d1 = platform.env.DB
		let cached = d1Cache.get(d1)
		if (!cached) {
			cached = drizzleD1(d1, { schema })
			d1Cache.set(d1, cached)
		}
		return cached as unknown as DbClient
	}
	if (localDbInstance) return localDbInstance
	throw new Error('No database available. Ensure platform.env.DB is set.')
}
```

**Step 3: Create SQL migration**

File: `migrations/0001_initial.sql`

Raw SQL matching the Drizzle schema. Use the DDL from the design doc with indexes.

**Step 4: Verify build**

```bash
bun run check
```

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add drizzle schema with sessions, features, votes tables"
```

---

## Task 3: Database Queries

**Files:**
- Create: `src/lib/server/db/queries.ts`

**Step 1: Write all CRUD queries**

Follow v3 pattern. Functions needed:

- `createSession(db, code, title)` → insert session, return Session
- `getSessionByCode(db, code)` → select session by code
- `copyDefaultFeatures(db, sessionId, features[])` → batch insert into session_features
- `getSessionFeatures(db, sessionId)` → select all features for session
- `updateSessionFeature(db, id, data)` → update a single feature
- `deleteSessionFeature(db, id)` → delete a feature
- `addSessionFeature(db, sessionId, feature)` → insert one feature
- `createParticipant(db, sessionId, name?)` → insert participant
- `getParticipantCount(db, sessionId)` → count participants
- `saveVotes(db, participantId, sessionId, phase, featureIds[])` → batch insert votes (with onConflictDoNothing)
- `saveComment(db, participantId, sessionId, text)` → insert comment
- `tallyVotes(db, sessionId)` → GROUP BY feature_id, phase with COUNT
- `getComments(db, sessionId)` → all comments for session
- `getVoteCount(db, sessionId)` → count of participants who have voted (distinct participant_id in votes)

Each function: typed args, typed return, uses Drizzle query builder.

**Step 2: Verify build**

```bash
bun run check
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add database query functions for sessions, voting, tallying"
```

---

## Task 4: Default Features Data Module

**Files:**
- Create: `src/lib/data/default-features.ts`
- Create: `src/lib/data/icons.ts`

**Step 1: Extract features from source HTML**

Port the 28 `FEATURES` entries from `docs/remixed-a39be00c.html:499-528` into a typed array. Also port `ICONS` map (line 530-534) and `CAPTIONS` map (line 536-554).

File: `src/lib/data/default-features.ts`

```ts
export interface DefaultFeature {
	featureId: number
	name: string
	description: string
	category: string
	hasEvidence: boolean
	level: 'individual' | 'communal' | 'neither'
	caption: string | null
}

export const DEFAULT_FEATURES: DefaultFeature[] = [
	{ featureId: 1, name: 'Tuneable LED lighting with circadian profiles', description: '...', category: 'light', hasEvidence: true, level: 'individual', caption: 'Circadian-tuned light regulates...' },
	// ... all 28 features from source HTML lines 500-528
	// Include captions from CAPTIONS map (lines 537-554) inline
]
```

File: `src/lib/data/icons.ts`

```ts
export const CATEGORY_ICONS: Record<string, string> = {
	light: '☀️', tech: '📡', acoustic: '🔇', biophilic: '🌿', wellness: '💧',
	social: '👥', thermal: '🌡️', air: '💨', movement: '🏃', spatial: '🏗️',
	aesthetic: '✨', furniture: '🪑', operational: '🛠️'
}
```

**Step 2: Verify build**

```bash
bun run check
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add 28 default features + icons data modules"
```

---

## Task 5: Theme + Layout CSS

**Files:**
- Modify: `src/routes/layout.css` (add CSS variables + font imports)
- Modify: `src/app.html` (add Google Fonts preconnect)
- Modify: `src/routes/+layout.svelte` (add body class for dark bg)

**Step 1: Add theme CSS variables and Google Fonts**

Port the `:root` variables from source HTML (lines 12-27). Add Google Fonts import. Add base body styles.

`layout.css`:
```css
@import 'tailwindcss';
@plugin '@tailwindcss/forms';
@plugin '@tailwindcss/typography';

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&display=swap');

:root {
	--teal: #008B8B;
	--accent: #00BFA5;
	--dark: #0f1923;
	--dark2: #1a2b3c;
	--green: #00C853;
	--green-dim: #1B5E20;
	--red: #FF5252;
	--red-dim: #B71C1C;
	--orange: #FFB300;
	--indigo: #5C6BC0;
	--purple: #7E57C2;
	--blue-l1: #29B6F6;
	--blue-l2: #0288D1;
	--gold: #FFD54F;
}
```

**Step 2: Update app.html** with Google Fonts preconnect links in `<head>`.

**Step 3: Update +layout.svelte** — body should have dark background and DM Sans font by default. Add TailwindCSS classes for `bg-[var(--dark)] text-white font-sans antialiased`.

**Step 4: Verify dev server renders**

```bash
bun run dev
```

Open browser, confirm dark background, correct fonts loaded.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add AWA theme colors, Google Fonts, dark base layout"
```

---

## Task 6: Landing Page

**Files:**
- Modify: `src/routes/+page.svelte`

**Step 1: Build landing page**

Two actions: "Create Session" (link to `/session/create`) and "Join Session" (input for code → navigates to `/session/[code]`).

Mobile-first layout:
- Centered content, max-width ~500px
- AWA branding (brain emoji icon, title, subtitle)
- Two large buttons/cards: "Create Session" and "Join Session"
- Join input: 6-character code input + "Join" button
- Dark theme (matches dashboard aesthetic)

**Step 2: Run dev server and verify**

```bash
bun run dev
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add landing page with create/join session"
```

---

## Task 7: Session Creation (Facilitator)

**Files:**
- Create: `src/routes/session/create/+page.svelte`
- Create: `src/routes/session/create/+page.server.ts`
- Create: `src/lib/components/FeatureEditor.svelte`

**Step 1: Write the server action**

`+page.server.ts`:
- `actions.default`: validates title, generates 6-char code, inserts session, copies default features into `session_features`, redirects to `/session/[code]/dashboard`

Code generation: `crypto.randomUUID().slice(0, 6).toUpperCase()`

**Step 2: Build FeatureEditor component**

A list of features with:
- Each row: name, category badge, evidence toggle, level dropdown, delete button
- "Add Feature" button at bottom
- All edits are local state ($state array) until parent form submission
- Mobile: vertical cards. Desktop: table-like rows.

**Step 3: Build the create page**

`+page.svelte`:
- Title input (pre-filled with default)
- FeatureEditor (pre-loaded with DEFAULT_FEATURES)
- "Create Session" submit button
- Form action posts to server

**Step 4: Verify end-to-end**

```bash
bun run dev
```

Navigate to `/session/create`, fill title, submit. Verify redirect to dashboard URL with valid code.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add session creation with editable features"
```

---

## Task 8: Session Layout + Participant Intro

**Files:**
- Create: `src/routes/session/[code]/+layout.svelte`
- Create: `src/routes/session/[code]/+layout.server.ts`
- Modify: `src/routes/session/[code]/+page.svelte` (create this)

**Step 1: Write session layout server load**

`+layout.server.ts`:
- `load({ params, platform })`: fetch session by code from D1. If not found or status === 'closed', throw `error(404)`. Return session data + features.

**Step 2: Build session layout**

`+layout.svelte`:
- Receives session data via `$props()`
- Passes session context down to children via Svelte context (`setContext`)
- Minimal chrome — children handle their own layout

**Step 3: Build participant intro page**

`+page.svelte`:
- Branding: brain icon, "Designing Workplaces That Think" title
- Subtitle: "This exercise explores what matters most for cognitive performance at work"
- **NO mention of phases** — just "Begin Exercise"
- Name input (optional)
- "Begin" button → creates participant record, stores participant ID in a cookie or URL param, navigates to `/session/[code]/vote`
- Mobile-first: centered, max-width 500px, large touch targets

**Step 4: Verify flow**

```bash
bun run dev
```

Create a session, then visit `/session/[code]`. Verify intro renders, name input works, "Begin" navigates to vote page.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add session layout and participant intro page"
```

---

## Task 9: Voting Engine (State Class)

**Files:**
- Create: `src/lib/stores/voting.svelte.ts`

**Step 1: Build VotingEngine class**

Follow v3's `GameEngine` pattern — a class with `$state` and `$derived` runes:

```ts
import { SvelteSet } from 'svelte/reactivity'
import type { SessionFeature } from '$lib/server/db/schema'

export class VotingEngine {
	features = $state<SessionFeature[]>([])
	phase = $state<'individual' | 'communal'>('individual')
	selectedIndividual = new SvelteSet<number>()
	selectedCommunal = new SvelteSet<number>()
	freeText = $state('')
	isSubmitting = $state(false)
	error = $state('')

	readonly currentSelection = $derived(
		this.phase === 'individual' ? this.selectedIndividual : this.selectedCommunal
	)
	readonly count = $derived(this.currentSelection.size)
	readonly canContinue = $derived(this.count === 5)
	readonly buttonText = $derived(
		this.count === 5
			? this.phase === 'individual' ? 'Continue →' : 'Submit & See Results →'
			: `Select ${5 - this.count} more`
	)
	readonly availableFeatures = $derived(
		this.phase === 'communal'
			? this.features.filter(f => !this.selectedIndividual.has(f.featureId))
			: this.features
	)

	constructor(features: SessionFeature[]) {
		this.features = features
	}

	toggle(featureId: number) {
		const sel = this.currentSelection
		if (sel.has(featureId)) {
			sel.delete(featureId)
		} else if (sel.size < 5) {
			sel.add(featureId)
		}
	}

	advancePhase() {
		if (this.phase === 'individual' && this.selectedIndividual.size === 5) {
			this.phase = 'communal'
		}
	}
}
```

**Step 2: Verify build**

```bash
bun run check
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add VotingEngine state class with Svelte 5 runes"
```

---

## Task 10: Voting UI Components

**Files:**
- Create: `src/lib/components/FeatureCard.svelte`
- Create: `src/lib/components/FeatureGrid.svelte`
- Create: `src/lib/components/PhaseBanner.svelte`
- Create: `src/lib/components/VoteTopbar.svelte`
- Create: `src/lib/components/ui/Button.svelte`

**Step 1: Build FeatureCard.svelte**

Props: `feature: SessionFeature`, `selected: boolean`, `disabled: boolean`, `used: boolean`, `phase: 'individual' | 'communal'`, `onclick: () => void`

Port styles from source HTML `.feature-card` (lines 175-200). Use Tailwind utilities. Mobile-first: full width, 48px+ touch targets.

- Checkbox indicator (green for individual, indigo for communal)
- Icon + name + description
- "Used" state grays out (selected in Phase A, now in Phase B)
- "Disabled" state when 5 already selected

**Step 2: Build FeatureGrid.svelte**

Props: receives `engine: VotingEngine`

- Renders `availableFeatures` in a responsive grid (1 col mobile, 2 col desktop)
- Deterministic shuffle (same hash-based shuffle as source HTML line 557)
- Each card calls `engine.toggle(featureId)` on click

**Step 3: Build PhaseBanner.svelte**

Props: `phase: 'individual' | 'communal'`

- Individual: brain emoji + "Select the 5 features with the greatest impact on individual cognitive performance"
- Communal: handshake emoji + "Now for the team perspective — select 5 features for team cognitive performance"
- Mobile-first: padding, readable text

**Step 4: Build VoteTopbar.svelte**

Props: `count: number`, `phase: 'individual' | 'communal'`

- Sticky top bar, dark background
- AWA branding (left)
- Counter pill (right): "0/5 selected" with animated fill when complete
- Mobile: icon + counter only (hide title text)

**Step 5: Build Button.svelte**

Simple gradient button matching source HTML `.btn-primary`. Props: `disabled`, `onclick`, children snippet.

**Step 6: Verify build + visual check**

```bash
bun run dev
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add voting UI components (card, grid, banner, topbar, button)"
```

---

## Task 11: Voting Page (Route)

**Files:**
- Create: `src/routes/session/[code]/vote/+page.svelte`
- Create: `src/routes/session/[code]/vote/+page.server.ts`

**Step 1: Write server load + action**

`+page.server.ts`:
- `load()`: return session features from D1
- `actions.default`: receive `participantId`, `individualIds[]`, `communalIds[]`, `comment?` → insert votes + comment into D1 → redirect to dashboard

**Step 2: Build vote page**

`+page.svelte`:
- Instantiate `VotingEngine` with features from load data
- Render: VoteTopbar + PhaseBanner + FeatureGrid + free text area (Phase B only) + submit Button
- Phase A → Phase B transition: when user clicks "Continue" with 5 selected, call `engine.advancePhase()` with smooth transition
- Phase B: show free text box, grayed-out Phase A selections
- Submit: form action to server, include all selections
- Use `svelte-autofixer` to validate component

**Step 3: Full voting flow test**

```bash
bun run dev
```

Create session → join → intro → begin → pick 5 individual → continue → pick 5 communal → submit → verify redirect to dashboard.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add voting page with two-phase flow"
```

---

## Task 12: Dashboard Components

**Files:**
- Create: `src/lib/components/ScoreStrip.svelte`
- Create: `src/lib/components/RankPanel.svelte`
- Create: `src/lib/components/RankRow.svelte`
- Create: `src/lib/components/EvidenceTag.svelte`
- Create: `src/lib/components/AiPrompt.svelte`

**Step 1: Build EvidenceTag.svelte**

Props: `hasEvidence: boolean`

Green tag "EVIDENCE-BASED" or red tag "LIMITED EVIDENCE". Port from source HTML `.evidence-tag` (lines 324-329).

**Step 2: Build RankRow.svelte**

Props: `rank: number`, `feature: { name, category, hasEvidence, caption, votes, percentage }`, `type: 'individual' | 'communal'`

Port from source HTML `.dash-rank-row` (lines 288-321). Animated bar fill with CSS transition. Evidence tag + caption underneath.

**Step 3: Build RankPanel.svelte**

Props: `title: string`, `subtitle: string`, `icon: string`, `type: 'individual' | 'communal'`, `features: RankedFeature[]`, `totalVotes: number`

Panel with header + list of RankRows. Port from `.dash-panel` (lines 261-281).

**Step 4: Build ScoreStrip.svelte**

Props: `individualScore: number`, `communalScore: number`, `totalCorrect: number`

Three score cards + message. Port from `.dash-score-strip` (lines 338-360). Responsive: horizontal on desktop, stacked on mobile.

**Step 5: Build AiPrompt.svelte (hidden/parked)**

Port the AI prompt generation logic from source HTML (lines 876-894). Render the prompt text and caption grid. Component is built but will be rendered with `hidden` attribute.

**Step 6: Verify build**

```bash
bun run check
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add dashboard components (scores, rankings, evidence tags)"
```

---

## Task 13: Dashboard Page + Live Polling API

**Files:**
- Create: `src/routes/session/[code]/dashboard/+page.svelte`
- Create: `src/routes/session/[code]/dashboard/+page.server.ts`
- Create: `src/routes/api/session/[code]/votes/+server.ts`
- Create: `src/routes/api/session/[code]/+server.ts`

**Step 1: Write API endpoints**

`api/session/[code]/+server.ts` — GET: return session status + participant count
`api/session/[code]/votes/+server.ts` — GET: return tallied results (ranked features for both phases, scores, comments, participant count)

Tallying logic (from source HTML `buildDashboard` lines 735-755):
- Group votes by phase + feature_id
- Count per feature
- Rank top 5 per phase
- Calculate evidence accuracy scores
- Return JSON

**Step 2: Write dashboard server load**

`+page.server.ts`:
- `load()`: fetch initial tallied results (same query as API), return as SSR data

**Step 3: Build dashboard page**

`+page.svelte`:
- SSR initial load data
- Poll `/api/session/[code]/votes` every 4 seconds using `$effect` + `setInterval`
- Render: header (logo + stats) + ScoreStrip + two RankPanels (individual + communal) + suggestions + AiPrompt (hidden) + research footer
- Animate bar fills on data update
- Port header from source HTML `.dash-header` (lines 228-253)
- Port research footer from `.dash-research-footer` (lines 362-376)
- Mobile: everything stacks vertically

**Step 4: Full end-to-end test**

```bash
bun run dev
```

1. Create session
2. Open dashboard in one tab
3. Open participant link in another tab
4. Vote as participant
5. Watch dashboard update within 4 seconds

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add live dashboard with polling and vote tallying"
```

---

## Task 14: Polish + Mobile QA

**Files:**
- Various component files for responsive fixes

**Step 1: Mobile viewport testing**

Open dev tools, test all screens at:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)
- 1024px (desktop)

Fix any:
- Horizontal overflow
- Touch targets < 48px
- Text truncation
- Topbar layout issues
- Feature grid column collapse

**Step 2: Transitions and animations**

- Smooth phase transition (Phase A → Phase B): fade or slide
- Bar fill animation on dashboard load (use `$effect` to trigger after render)
- Button hover/active states
- Card selection animation

**Step 3: Run prettier + check**

```bash
bun run format && bun run check
```

**Step 4: Commit**

```bash
git add -A && git commit -m "fix: mobile responsive polish and animations"
```

---

## Task 15: Cloudflare Deployment

**Files:**
- Modify: `wrangler.jsonc` (real database_id)
- Modify: `.gitignore` (add .wrangler)

**Step 1: Create D1 database**

```bash
bunx wrangler d1 create corenet-db
```

Copy the returned database_id into `wrangler.jsonc`.

**Step 2: Run migration**

```bash
bunx wrangler d1 execute corenet-db --file=./migrations/0001_initial.sql
```

**Step 3: Build and deploy**

```bash
bun run build
bunx wrangler deploy
```

**Step 4: Verify on production URL**

Visit the deployed URL. Create a session, vote, check dashboard.

**Step 5: Commit**

```bash
git add -A && git commit -m "chore: configure cloudflare deployment with D1"
```

---

## Task Order + Dependencies

```
Task 1 (adapter)
  └→ Task 2 (schema)
       └→ Task 3 (queries)
            └→ Task 7 (session create) → Task 8 (session layout + intro)
                                              └→ Task 11 (vote page)
                                                    └→ Task 13 (dashboard)
Task 4 (features data) ← independent, needed by Task 7
Task 5 (theme CSS) ← independent, needed by Task 6
Task 6 (landing page) ← needs Task 5
Task 9 (voting engine) ← independent, needed by Task 11
Task 10 (voting components) ← needs Task 9, needed by Task 11
Task 12 (dashboard components) ← independent, needed by Task 13
Task 14 (polish) ← needs Task 13
Task 15 (deploy) ← needs Task 14
```

**Parallelizable groups:**
- Group A: Tasks 1 → 2 → 3 (infrastructure)
- Group B: Tasks 4, 5, 6 (data + theme + landing) — can run in parallel with Group A
- Group C: Tasks 9, 10 (voting engine + components) — can run in parallel with Group A
- Group D: Task 12 (dashboard components) — can run in parallel with Group C
- Sequential: Tasks 7 → 8 → 11 → 13 → 14 → 15 (need infra + components)
