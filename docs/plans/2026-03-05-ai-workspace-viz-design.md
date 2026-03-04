# AI Workspace Visualization — Design

## Context

After voting, participants see their raw picks on `/thanks`. The facilitator dashboard shows group analytics across 3 pages. This feature adds **AI-generated workspace images** using fal.ai, letting participants visualize their choices and giving the facilitator a gallery of individual vs collective workspace designs.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI provider | fal.ai (server-side) | API key stays on server, proven in workspace-studio |
| Model | `fal-ai/nano-banana-2` | Reasoning-guided synthesis, superior architectural quality |
| Cost | ~$0.08/image, ~$15 max per 60-person session | Acceptable for corporate workshop events |
| Image storage | D1 base64 data URI | No new infra, TEXT column handles ~100-200KB JPEG |
| Prompt style | Custom hybrid | workspace-studio rendering specs + CoreNet evidence awareness |
| API architecture | Single `POST /api/generate-image` route | DRY — handles both individual and collective |
| Collective trigger | Button click only | Intentional reveal moment, saves costs |
| Fair use limit | 3 generations per participant (1 initial + 2 regen) | ~$0.24 max per participant |
| Resolution | 1K, 16:9 aspect ratio | Balance of quality, cost, and D1 storage size |
| Output format | JPEG | Smaller base64 than PNG, good for photorealistic content |

## Architecture

```
Thanks page (participant)
  ├── Enter name + email
  ├── POST /api/generate-image { type: 'individual' }
  │   ├── Validate cookies (session_id, participant_id)
  │   ├── Check generation count (max 3)
  │   ├── Update participants table (name, email)
  │   ├── Fetch participant's voted features from DB
  │   ├── Build hybrid prompt
  │   ├── fal.subscribe('fal-ai/nano-banana-2', ...)
  │   ├── Fetch image URL → convert to base64 data URI
  │   ├── Store in workspace_images table
  │   └── Return { imageData, generationsRemaining }
  └── Display image + regenerate/download/fullscreen

Dashboard page 4 (facilitator)
  ├── LEFT: Poll /api/workspace-images for individual gallery
  │   ├── Masonry grid with slow continuous ticker scroll
  │   ├── Click → modal with name + feature choices
  │   └── New images animate in as participants generate
  ├── RIGHT: "Create Workspace from Collective Votes" button
  │   ├── POST /api/generate-image { type: 'collective' }
  │   ├── Uses top 8 features from tally (both phases)
  │   └── Display image + regenerate with reprompt
  └── Both sides: prompt dropdown, regenerate + reprompt input
```

## Database Changes

### Migration: add `email` to `participants`

```sql
ALTER TABLE participants ADD COLUMN email TEXT;
```

### Migration: new `workspace_images` table

```sql
CREATE TABLE IF NOT EXISTS workspace_images (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  participant_id TEXT,
  participant_name TEXT,
  participant_email TEXT,
  image_data TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generation_num INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'individual',
  feature_names TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_wi_session ON workspace_images(session_id);
CREATE INDEX idx_wi_participant ON workspace_images(participant_id);
```

### Drizzle schema addition (`src/lib/server/db/schema.ts`)

```typescript
export const workspaceImages = sqliteTable('workspace_images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull(),
  participantId: text('participant_id'),
  participantName: text('participant_name'),
  participantEmail: text('participant_email'),
  imageData: text('image_data').notNull(),
  prompt: text('prompt').notNull(),
  generationNum: integer('generation_num').notNull().default(1),
  type: text('type').notNull().default('individual'),
  featureNames: text('feature_names'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  index('idx_wi_session').on(table.sessionId),
  index('idx_wi_participant').on(table.participantId),
]);
```

## Prompt Construction (Hybrid)

Combines CoreNet's evidence-aware feature list with workspace-studio's rendering specifications:

```typescript
function buildWorkspacePrompt(
  features: Array<{ name: string; hasEvidence: boolean }>,
  additionalPrompt?: string
): string {
  const evidenceBacked = features.filter(f => f.hasEvidence).map(f => f.name.toLowerCase());
  const nonEvidence = features.filter(f => !f.hasEvidence).map(f => f.name.toLowerCase());
  const allFeatures = features.map(f => f.name.toLowerCase()).join(', ');

  const parts = [
    `Create a photorealistic architectural visualisation of a modern workplace interior`,
    `designed for cognitive performance. The space must prominently feature: ${allFeatures}.`,
  ];

  if (evidenceBacked.length > 0) {
    parts.push(
      `These evidence-backed elements should be prominent and well-integrated: ${evidenceBacked.join(', ')}.`
    );
  }

  parts.push(
    `Show humans actively using the space — people collaborating, working in focus zones,`,
    `taking breaks in green spaces.`,
    `Design an office relevant in 2033. Capture the entire spatial narrative from an elevated`,
    `three-quarter perspective showing multiple interconnected zones and their relationships.`,
    `Hyperrealistic architectural photography | Camera: Wide-angle 24mm lens capturing full`,
    `spatial context | Lighting: Natural daylight with subtle artificial accents | Style:`,
    `Premium architectural digest quality | No text, labels, watermarks, or UI elements.`,
    `Emphasize materiality, spatial flow, and the interplay of light and form.`
  );

  if (additionalPrompt?.trim()) {
    parts.push(`Additional requirements: ${additionalPrompt.trim()}`);
  }

  return parts.join(' ');
}
```

For **collective** images, the function receives the top 8 features from the tally (sorted by vote count across both phases).

For **regeneration** with reprompt:
```typescript
`${previousPrompt} | Alternative version with fresh perspective: ${userInput || 'different design approach while maintaining core requirements'}`
```

## API Route: `POST /api/generate-image`

### Request

```typescript
interface GenerateImageRequest {
  type: 'individual' | 'collective';
  name?: string;          // individual only, first generation
  email?: string;         // individual only, first generation
  additionalPrompt?: string;  // optional reprompt text for regeneration
}
```

Session ID and participant ID come from cookies.

### Response

```typescript
interface GenerateImageResponse {
  imageData: string;           // base64 data URI
  prompt: string;              // the full prompt used
  generationsRemaining: number;
  generationNum: number;
}
```

### Server Logic

1. Validate cookies
2. If `type === 'individual'`:
   - Count existing `workspace_images` for this participant → reject if >= 3
   - Fetch participant's votes (individual + communal features)
   - If name/email provided, update `participants` table
3. If `type === 'collective'`:
   - Count existing collective images for this session → reject if >= 3
   - Build tally, take top 8 features across both phases
4. Build prompt via `buildWorkspacePrompt(features, additionalPrompt)`
5. Call fal.ai:
   ```typescript
   const result = await fal.subscribe('fal-ai/nano-banana-2', {
     input: {
       prompt: builtPrompt,
       num_images: 1,
       aspect_ratio: '16:9',
       resolution: '1K',
       output_format: 'jpeg'
     }
   });
   ```
6. Fetch image from `result.data.images[0].url` → convert to base64 data URI
7. Insert into `workspace_images`
8. Return response

## API Route: `GET /api/workspace-images`

Returns all workspace images for the current session (for dashboard gallery polling).

```typescript
// Response
interface WorkspaceImagesResponse {
  individual: Array<{
    id: string;
    participantName: string;
    imageData: string;
    featureNames: string[];
    createdAt: string;
  }>;
  collective: Array<{
    id: string;
    imageData: string;
    prompt: string;
    createdAt: string;
  }>;
}
```

Dashboard polls this endpoint every 4-5 seconds (same pattern as existing vote polling).

## New Component: `AiLoader.svelte`

Reusable AI generation loader with ZyetaI branding (ported from workspace-studio).

```typescript
interface AiLoaderProps {
  progress: number;          // 0-100 (simulated)
  message?: string;          // "Creating your workspace..."
  showCredit?: boolean;      // show "Powered by ZyetaI" (default true)
  dark?: boolean;            // dark variant for overlay/dashboard
}
```

Visual design:
- "Powered by" small tracking text
- "ZyetaI" in gradient text (teal → accent for CoreNet theme) with bouncing "I" animation (3s cycle)
- Progress bar: teal → accent gradient, smooth 300ms transitions
- Percentage display
- Status message
- Glass card container matching CoreNet's `glass-panel` pattern

Progress is simulated client-side: increments randomly (0-20% per 400ms tick) up to 90%, then jumps to 100% when the API responds.

## Thanks Page UX (`/thanks`)

Below the existing Individual + Collective feature cards, add:

### State 1: Form (initial)

```
┌─────────────────────────────────────────────────┐
│  ✨ Visualise Your Workspace                    │
│  See your choices come to life as an AI-        │
│  generated workspace design                     │
│                                                 │
│  ┌──────────────┐ ┌────────────────────────┐    │
│  │ Your Name    │ │ Email                  │    │
│  └──────────────┘ └────────────────────────┘    │
│                                                 │
│  [ Generate My Workspace ]                      │
└─────────────────────────────────────────────────┘
```

### State 2: Generating

```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │         Powered by                        │  │
│  │         ZyetaI                            │  │
│  │         67%                               │  │
│  │  ━━━━━━━━━━━━━━━░░░░░░░░                 │  │
│  │  Creating your workspace...               │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### State 3: Image generated

```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │          [16:9 workspace image]           │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Add to prompt: "more plants, warmer..."   │  │
│  └───────────────────────────────────────────┘  │
│  [ 🔄 Regenerate (2 left) ]  [ ⬇ Download ]   │
│  [ 🔍 View Full Size ]                         │
│                                                 │
│  ▸ View full prompt                             │
└─────────────────────────────────────────────────┘
```

### State 4: Exhausted

Regenerate button disabled, shows "All generations used".

## Dashboard Page 4 — Workspace Gallery

New page added to the existing 3-page dashboard. `DashboardState.TOTAL_PAGES` changes from 3 → 4.

### Layout (split)

```
┌─── LEFT (60%) ─────────────────┐ ┌─── RIGHT (40%) ──────────────┐
│                                │ │                               │
│  Individual Workspaces         │ │  Collective Workspace         │
│  ┌─────┐ ┌───────┐ ┌─────┐   │ │                               │
│  │img1 │ │ img2  │ │img3 │   │ │  [ Create Workspace from      │
│  │Rick │ │ Sara  │ │John │   │ │    Collective Votes ]          │
│  └─────┘ │       │ └─────┘   │ │                               │
│  ┌───────┘       └──┐        │ │  (after click → AiLoader)     │
│  │ img4             │        │ │  (after generation:)           │
│  │ Amy              │        │ │  ┌───────────────────────┐    │
│  └──────────────────┘        │ │  │  collective image     │    │
│  ┌─────┐ ┌─────┐             │ │  └───────────────────────┘    │
│  │img5 │ │img6 │             │ │                               │
│  │Tom  │ │Mia  │             │ │  ┌─────────────────────────┐  │
│  └─────┘ └─────┘             │ │  │ Reprompt text input     │  │
│                                │ │  └─────────────────────────┘  │
│  ↑ slow continuous scroll ↑   │ │  [ 🔄 Regen (2) ] [ ⬇ Save ] │
│  (pauses on hover)             │ │                               │
│                                │ │  ▸ View full prompt           │
└────────────────────────────────┘ └───────────────────────────────┘
```

### Left panel — Masonry ticker

- CSS `columns: 3` masonry layout
- Slow continuous upward scroll (~30px/sec via CSS animation)
- Pauses on hover
- Loops seamlessly
- New images animate in at bottom as participants generate (via polling)
- Each card: rounded thumbnail + name overlay at bottom
- Click opens detail modal

### Detail modal (on image click)

```
┌──────────────────────────────────────────┐
│                                     ✕    │
│  ┌──────────────────────────────────┐    │
│  │     [full 16:9 workspace image]  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Rick's Workspace                        │
│                                          │
│  Individual picks:                       │
│  Circadian lighting, Biophilic design,   │
│  Sit-stand desks, ...                    │
│                                          │
│  Communal picks:                         │
│  Team anchor points, Collaborative       │
│  zones, ...                              │
│                                          │
│  [ ⬇ Download ]  [ 🔍 Full Screen ]     │
│                                          │
│  ▸ View full prompt                      │
└──────────────────────────────────────────┘
```

### Right panel — Collective workspace

- Initially: large CTA button
- On click: AiLoader with ZyetaI branding
- After generation: image + reprompt input + regenerate (3 total) + download
- Collapsible prompt dropdown
- Below: narrative text about individual vs collective comparison

### Prompt Dropdown (reusable, both pages)

Collapsible `<details>` or custom accordion:
- Dark background (`bg-black/30`), rounded
- Monospace text, `text-sm`, `text-white/70`
- Evidence-backed features highlighted in accent color
- Copy-to-clipboard button in top-right corner

## New Files

| File | Purpose |
|------|---------|
| `src/lib/components/AiLoader.svelte` | ZyetaI-branded generation loader with progress |
| `src/lib/components/WorkspaceImage.svelte` | Image display with regenerate/download/fullscreen/prompt dropdown |
| `src/lib/components/ImageModal.svelte` | Dashboard modal for individual image detail |
| `src/lib/components/MasonryTicker.svelte` | Masonry grid with continuous scroll ticker |
| `src/lib/components/PromptDropdown.svelte` | Collapsible full prompt display |
| `src/lib/server/ai/image-generator.ts` | fal.ai integration (prompt building + API call + base64 conversion) |
| `src/routes/api/generate-image/+server.ts` | POST endpoint for image generation |
| `src/routes/api/workspace-images/+server.ts` | GET endpoint for dashboard gallery polling |
| `migrations/0002_workspace_images.sql` | D1 migration for new table + participants email column |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/server/db/schema.ts` | Add `email` to participants, add `workspaceImages` table |
| `src/routes/thanks/+page.svelte` | Add visualization section (form → loader → image) |
| `src/routes/thanks/+page.server.ts` | Load existing workspace image if any |
| `src/routes/dashboard/+page.svelte` | Add page 4 with gallery + collective |
| `src/routes/dashboard/state.svelte.ts` | Add `TOTAL_PAGES = 4`, workspace image polling, collective state |
| `src/routes/dashboard/+page.server.ts` | Load workspace images for initial page data |
| `src/lib/components/StageNav.svelte` | No changes needed (already supports dynamic totalPages) |
| `package.json` | Add `@fal-ai/client` dependency |
| `src/app.d.ts` | Add `FAL_API_KEY` to env types |
| `wrangler.jsonc` | Add `FAL_API_KEY` to secrets/vars |

## Error Handling

| Scenario | Behavior |
|----------|----------|
| fal.ai API call fails | Show error toast, allow retry (doesn't count against limit) |
| fal.ai returns no image URL | Log error, show "Generation failed" with retry button |
| Base64 conversion fails | Fall back to temporary fal.ai URL (will expire) |
| Generation limit reached | Disable regenerate, show "All generations used" |
| No FAL_API_KEY configured | Hide visualization section entirely |
| D1 storage fails | Return image to client anyway, log storage error |
| Image too large for D1 | Use lower quality JPEG (quality 80) to reduce size |
| Network timeout | 30s timeout on fal.ai call, show timeout error |

## Cost

| Metric | Value |
|--------|-------|
| Per image | $0.08 (1K JPEG) |
| Per participant (max 3) | $0.24 |
| Per session (40 people) | ~$9.68 worst case |
| Per session (60 people) | ~$14.48 worst case |
| Collective image (max 3) | $0.24 |
| Realistic per session | ~$7-10 (not everyone maxes out) |

## Verification

1. `bun run build` — clean compile
2. `bun run check` — no type errors
3. Create session, vote, verify thanks page shows visualization form
4. Enter name + email, generate image — verify image appears
5. Regenerate with reprompt text — verify updated image + counter
6. Exhaust 3 generations — verify button disables
7. Download image — verify file saves
8. View full size — verify fullscreen overlay
9. View prompt dropdown — verify full prompt display with evidence highlighting
10. Open dashboard page 4 — verify individual images appear in masonry grid
11. Verify ticker scroll works, pauses on hover
12. Click individual image — verify modal with name + features
13. Click "Create Workspace from Collective Votes" — verify AiLoader + image
14. Regenerate collective with reprompt — verify updated image
15. Test with no FAL_API_KEY — verify graceful degradation (section hidden)
16. Deploy: `bunx wrangler pages deploy .svelte-kit/cloudflare`
