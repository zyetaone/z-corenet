# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CoreNet** is a SvelteKit live-voting app for AWA (Advanced Workplace Associates) workplace design workshops. Participants vote on individual and communal workplace features; a facilitator-facing dashboard tallies results in real time with evidence-based scoring.

## Commands

```bash
bun run dev          # Start dev server (Vite)
bun run build        # Production build
bun run preview      # Preview production build locally
bun run check        # svelte-kit sync + svelte-check (type checking)
bun run check:watch  # Type checking in watch mode
bun run lint         # Prettier check
bun run format       # Prettier auto-fix
```

### Cloudflare / Wrangler

```bash
bunx wrangler d1 execute corenet-db --local --file=migrations/0001_initial.sql  # Apply schema locally
bunx wrangler dev --local                                                        # Run with local D1
bunx wrangler deploy                                                             # Deploy to Cloudflare
```

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5 (runes: `$state`, `$derived`, `$effect`, `$props`)
- **Language**: TypeScript (strict mode)
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM — binding name `DB` in `wrangler.jsonc`
- **Styling**: TailwindCSS v4 via Vite plugin — uses `@import 'tailwindcss'` + `@plugin` syntax (not `@tailwind` directives)
- **Package manager**: bun
- **Deployment**: Cloudflare Workers (`@sveltejs/adapter-cloudflare`)

## Architecture

### Route Structure

```
/                → Landing page (join session form) — +page.server.ts creates participant + sets cookies
/vote            → Two-phase voting UI (individual → communal)
/vote2           → Alternate voting UI design (A/B variant, same server logic)
/thanks          → Post-vote confirmation
/dashboard       → Facilitator live dashboard (design variant 1)
/dashboard2      → Facilitator live dashboard (design variant 2)
/api/votes       → GET: returns TallyResult JSON for current session
/api/reset       → POST: clears all votes for current session
```

### Session & Auth Flow

Sessions are tracked via two httpOnly cookies set at `/`:

- `session_id` — identifies the AWA session (maps to a D1 `sessions` row)
- `participant_id` — identifies the individual voter

On first join, `/` server action finds or creates a `sessions` row and creates a `participants` row, then redirects to `/vote`.

### Database (Drizzle + D1)

Schema at `src/lib/server/db/schema.ts`. Tables: `sessions`, `session_features`, `participants`, `votes`, `comments`.

- `getDb(platform)` in `src/lib/server/db/index.ts` — resolves the D1 binding from `platform.env.DB` in production; falls back to a local instance set via `setLocalDb()` for testing
- Query functions in `src/lib/server/db/queries.ts`
- Tally logic in `src/lib/server/tally.ts` — produces `TallyResult` with per-phase `PhaseResult` (score, ranked features, evidence ratio)

### State Management (Svelte 5 Class Pattern)

State is encapsulated in classes using Svelte 5 runes (not stores):

- **`VotingEngine`** (`src/lib/stores/voting.svelte.ts`) — manages two-phase voting, group coverage constraint (must pick from all 8 feature groups), soft cap of 12 per phase
- **`DashboardBaseState`** (`src/lib/stores/dashboard-base.svelte.ts`) — base class with polling (`/api/votes`), combined feature rankings, radar chart data, evidence ratio
- **`DashboardState`** (`src/routes/dashboard/state.svelte.ts`) — extends base with category breakdowns, evidence segments, consensus alignment
- **`DashboardState`** (`src/routes/dashboard2/state.svelte.ts`) — alternate dashboard extension

Classes use `$state`, `$derived`, `$derived.by` as class fields. Instantiate by passing `initialData` from `+page.server.ts` load function.

### Data Layer

- `src/lib/data/default-features.ts` — canonical feature list (`DEFAULT_FEATURES[]`), `FEATURE_GROUPS` (8 groups), `CATEGORY_TO_GROUP` mapping, `GroupKey` type
- Features are copied from defaults into `session_features` per session on creation
- 8 feature groups: `light`, `air`, `acoustic`, `biophilic`, `wellness`, `tech`, `social`, `furniture`

### Key Domain Rules

- **Voting constraint**: participants must pick at least one feature from each of the 8 groups (both individual and communal phases)
- **Soft cap**: max 12 picks per phase, but an extra pick is always allowed from an uncovered group
- **Evidence score**: `evidencePicks / totalPicks * 100` per phase — features marked `hasEvidence: true` count as "green"
- **Communal phase**: features already picked in individual phase are excluded from communal options

## Svelte MCP Server

This project has the Svelte MCP server configured (`.mcp.json`). When writing Svelte code:

1. Use `list-sections` first to discover relevant docs
2. Use `get-documentation` to fetch sections matching the task
3. Run `svelte-autofixer` on every Svelte component before finalizing
4. Use Svelte 5 runes syntax exclusively (no `let` stores, no `$:` reactive statements)

## Formatting Rules

Prettier config (`.prettierrc`): tabs, single quotes, no trailing commas, 100 char width. Svelte parser for `.svelte` files. Tailwind class sorting uses `./src/routes/layout.css` as stylesheet reference.
