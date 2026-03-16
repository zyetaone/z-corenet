# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CoreNet** is a SvelteKit live-voting app for AWA (Advanced Workplace Associates) workplace design workshops. Participants vote on individual and communal workplace features; a facilitator-facing dashboard tallies results in real time with evidence-based scoring. An AI image generation feature creates personalized workspace visualisations from voted features.

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
bunx wrangler pages deploy .svelte-kit/cloudflare                                # Deploy to Cloudflare Pages
```

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5 (runes: `$state`, `$derived`, `$effect`, `$props`)
- **Language**: TypeScript (strict mode)
- **Database**: Cloudflare D1 (SQLite) via Drizzle ORM — binding `DB` in `wrangler.jsonc`
- **Image Storage**: Cloudflare R2 — binding `IMAGES` in `wrangler.jsonc`, bucket `corenet-images`
- **AI Image Gen**: fal.ai (`nano-banana-2` for generation, `nano-banana-2/edit` for editing)
- **Styling**: TailwindCSS v4 via Vite plugin — uses `@import 'tailwindcss'` + `@plugin` syntax (not `@tailwind` directives)
- **Package manager**: bun
- **Deployment**: Cloudflare Pages (`@sveltejs/adapter-cloudflare`) — use `wrangler pages deploy`, NOT `wrangler deploy`

## Architecture

### Route Structure

```
/                      → Landing page (join session form) — creates participant + sets cookies
/vote                  → Two-phase voting UI (individual → communal)
/thanks                → Post-vote confirmation + AI workspace visualisation
/dashboard             → Facilitator live dashboard (4 pages: individual, communal, consensus, gallery)
/api/votes             → GET: TallyResult JSON for current session
/api/reset             → POST: close session + create fresh one (admin PIN required)
/api/generate-image    → POST: SSE stream — generates/edits workspace images via fal.ai
/api/workspace-images  → GET: gallery images (?all=1 for cross-session showcase)
/api/images/[...key]   → GET: R2 image proxy with immutable caching
/api/retake            → POST: clear participant cookies for quiz retake
```

### Session & Auth Flow

Sessions are tracked via two httpOnly cookies set at `/`:

- `session_id` — identifies the AWA session (maps to a D1 `sessions` row)
- `participant_id` — identifies the individual voter

Shared session helpers in `src/lib/server/session.ts`:

- `resolveSessionAndParticipant(db, cookies)` — self-heals stale cookies (creates new session/participant if needed)
- `getOrCreateOpenSession(db)` — finds latest open session or creates one
- `requireParticipant(cookies)` — reads cookies, redirects to `/` if missing
- `getActiveTally(db, sessionId)` — always prefers latest open session for live data

### Database (Drizzle + D1)

Schema at `src/lib/server/db/schema.ts`. Tables: `sessions`, `session_features`, `participants`, `votes`, `comments`, `workspace_images`.

- `getDb(platform)` in `src/lib/server/db/index.ts` — resolves the D1 binding
- Query functions in `src/lib/server/db/queries.ts`
- Tally logic in `src/lib/server/tally.ts` — produces `TallyResult` with per-phase `PhaseResult`

### Image Storage (R2)

- Images uploaded to R2 via `uploadImageToR2()` in `src/lib/server/r2.ts`
- DB `image_data` column stores R2 key (e.g. `workspaces/<sessionId>/<imageId>.webp`)
- Legacy rows with `data:image/...` prefix are served directly (backward compatible)
- R2 images served via `/api/images/[...key]` proxy with 1-year immutable cache
- `isR2Key(value)` helper distinguishes R2 keys from legacy base64

### Image Generation (fal.ai)

- `src/lib/server/ai/image-generator.ts` — fal.ai client, prompt builders, progress callbacks
- Generation returns SSE stream: `{type: "progress"}` → `{type: "result"}` or `{type: "error"}`
- Individual limit: 3 generations per participant; Collective limit: 10
- Edit uses `nano-banana-2/edit` with `image_urls` array

### Shared Types

- `src/lib/types/` — shared client/server boundary types
- `src/lib/types/tally.ts` — `RankedFeature`, `PhaseResult`, `TallyResult`
- `src/lib/types/workspace.ts` — `WorkspaceImagesResponse`, image shapes
- `src/lib/types/voting.ts` — `PickedFeature`
- `src/lib/types/dashboard.ts` — `RadarDataset`, `CategoryStat`
- `src/lib/types/index.ts` — barrel re-export

### State Management (Svelte 5 Class Pattern)

State is encapsulated in classes using Svelte 5 runes (not stores):

- **`VotingEngine`** (`src/lib/stores/voting.svelte.ts`) — manages two-phase voting, group coverage constraint, soft cap of 12 per phase
- **`DashboardState`** (`src/routes/dashboard/state.svelte.ts`) — polling, combined rankings, radar data, category stats, consensus alignment, workspace image gallery

Classes use `$state`, `$derived`, `$derived.by` as class fields.

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

# currentDate

Today's date is 2026-03-07.
