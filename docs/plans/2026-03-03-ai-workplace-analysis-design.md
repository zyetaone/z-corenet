# AI Workplace Analysis — Design

## Context

After voting, participants see their raw picks on `/thanks` and a "Coming Soon" placeholder on `/visualise`. The facilitator dashboards show group-level analytics but nothing interprets an **individual participant's** choices or the **group's collective dynamics**.

This feature uses **Cloudflare Workers AI** to:

1. **Individual analysis** (Llama 3.3 70B) — personalised workplace profile + evidence scorecard per participant, pre-generated at vote submit time
2. **Group analysis** (Llama 3.3 70B) — collective dynamics narrative + consensus insights for facilitator dashboards
3. **Workspace concept image** (FLUX-2 klein 4B) — AI-generated visualisation of the group's ideal cognitive workplace

## Decisions

| Decision           | Choice                                     | Rationale                                             |
| ------------------ | ------------------------------------------ | ----------------------------------------------------- |
| AI provider        | Cloudflare Workers AI (direct binding)     | Zero dependencies, native CF integration, same worker |
| Model              | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Best narrative quality on free tier, 2-5s response    |
| Generation timing  | Pre-generate at vote submit                | Instant display on results pages, no loading spinner  |
| Storage            | D1 `ai_analyses` table                     | Consistent with existing data layer, no new infra     |
| Output format      | Structured JSON                            | Enables separate summary/detail views                 |
| Tone               | Scientific advisor                         | AWA/CEBMa evidence-based, educational                 |
| Pages (individual) | `/thanks` (summary) + `/visualise` (full)  | Progressive disclosure                                |
| Pages (group)      | `/dashboard` + `/dashboard2`               | Facilitator sees group AI on results reveal           |
| Image model        | `@cf/black-forest-labs/flux-2-klein-4b`    | Fast 4-step inference, free tier, good quality        |
| Image storage      | D1 `ai_analyses` table (base64 data URI)   | Avoids R2 dependency; images ~100-200KB as base64     |
| Image trigger      | On-demand when facilitator views dashboard | One image per session, cached after first generation  |

## Architecture

```
Vote submit (form action)
  ├── saveVotes(db, ...)           ← existing
  ├── saveComment(db, ...)         ← existing
  ├── generateAnalysis(ai, db, ...} ← NEW (non-blocking via ctx.waitUntil)
  └── redirect('/thanks')          ← existing

/thanks (load)
  └── SELECT analysis FROM ai_analyses WHERE participant_id = ? AND session_id = ?
      → Show summary card (profileTitle + profileSummary + evidenceScore)

/visualise (load)
  └── SELECT analysis FROM ai_analyses WHERE participant_id = ? AND session_id = ?
      → Show full analysis (strengths, blind spots, category balance, recommendation)
```

### Non-blocking generation

The AI call (~2-5s) runs via `platform.ctx.waitUntil()` so the redirect to `/thanks` happens immediately. The `/thanks` page handles the race condition:

- If analysis exists: show it
- If not yet ready: show a subtle "Your personalised analysis is being prepared..." message with a 3s auto-refresh

## Infrastructure Changes

### `wrangler.jsonc`

Add Workers AI binding:

```jsonc
{
	"ai": {
		"binding": "AI"
	}
}
```

### `src/app.d.ts`

Add `AI` to `Env`:

```typescript
interface Env {
	DB: D1Database;
	AI: Ai;
}
```

### D1 Migration

New table `ai_analyses`:

```sql
CREATE TABLE IF NOT EXISTS ai_analyses (
  id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  analysis TEXT NOT NULL,        -- JSON blob
  model TEXT NOT NULL,           -- model ID for auditability
  created_at TEXT NOT NULL,      -- ISO 8601
  UNIQUE(participant_id, session_id)
);
```

## New File: `src/lib/server/ai-analysis.ts`

### Prompt Design

**System prompt:**

```
You are an AWA (Advanced Workplace Associates) workplace science advisor.
You analyse individual participants' workplace feature selections using evidence
from CEBMa systematic reviews and AWA's cognitive performance research.

Given a participant's individual and communal feature selections, generate a
personalised workplace profile. Be specific about the evidence behind their choices.

Respond with ONLY valid JSON matching this schema:
{
  "profileTitle": "2-4 word archetype, e.g. 'The Deep Focus Architect'",
  "profileSummary": "2-3 sentences describing their workplace personality and priorities",
  "evidenceScore": {
    "ratio": <number 0-100>,
    "interpretation": "1 sentence interpreting what this score means"
  },
  "categoryBalance": "1-2 sentences on which workspace categories dominate or are missing",
  "strengths": ["2-3 evidence-backed strengths in their selections"],
  "blindSpots": ["1-2 areas their choices don't address"],
  "recommendation": "1-2 actionable sentences for their ideal workspace"
}
```

**User prompt (constructed per participant):**

```
INDIVIDUAL SELECTIONS (features chosen for personal workspace):
- Tuneable LED lighting with circadian profiles [EVIDENCE ✓]
- Biophilic design elements [EVIDENCE ✓]
- Sit-stand desks [NO EVIDENCE]
...

COMMUNAL SELECTIONS (features chosen for shared workspace):
- Team anchor points [EVIDENCE ✓]
- Ping pong / foosball table [NO EVIDENCE]
...

STATISTICS:
- Evidence-backed ratio: 67% (8 of 12 picks have evidence)
- Categories covered: light, biophilic, acoustic, wellness, tech, social
- Categories missing: air, furniture
- Individual-communal overlap: 2 features appear in both rounds
```

### Functions

```typescript
interface AnalysisResult {
	profileTitle: string;
	profileSummary: string;
	evidenceScore: { ratio: number; interpretation: string };
	categoryBalance: string;
	strengths: string[];
	blindSpots: string[];
	recommendation: string;
}

// Build prompt from participant's votes
function buildAnalysisPrompt(
	individualFeatures: FeatureWithEvidence[],
	communalFeatures: FeatureWithEvidence[]
): string;

// Call Workers AI and parse response
async function callWorkersAI(ai: Ai, prompt: string): Promise<AnalysisResult>;

// Store result in D1
async function storeAnalysis(
	db: DbClient,
	participantId: string,
	sessionId: string,
	analysis: AnalysisResult,
	model: string
): Promise<void>;

// Load stored analysis
async function getAnalysis(
	db: DbClient,
	participantId: string,
	sessionId: string
): Promise<AnalysisResult | null>;

// Orchestrator: build prompt, call AI, store result
async function generateAndStoreAnalysis(
	ai: Ai,
	db: DbClient,
	participantId: string,
	sessionId: string,
	individualFeatures: FeatureWithEvidence[],
	communalFeatures: FeatureWithEvidence[]
): Promise<void>;
```

## Files to Modify

### `src/routes/vote/+page.server.ts` (form action)

After `saveVotes` + `saveComment`, before `redirect`:

1. Look up feature details for the participant's individual and communal IDs
2. Call `generateAndStoreAnalysis` via `platform.ctx.waitUntil()`
3. Redirect as normal

### `src/routes/vote2/+page.server.ts` (form action)

Same pattern as vote — look up features, call AI via `waitUntil`.

### `src/routes/thanks/+page.server.ts` (load function)

1. Query `ai_analyses` for this participant + session
2. Return `analysis` (or `null` if not yet ready) in page data

### `src/routes/thanks/+page.svelte`

Add between picks columns and "Visualise" button:

- If `data.analysis` exists: glass card with profileTitle, profileSummary, evidenceScore badge
- If `data.analysis` is null: subtle "Analysis being prepared..." message
- "See full analysis →" link to `/visualise`

### `src/routes/visualise/+page.server.ts` (NEW — load function)

1. Require participant cookies (redirect to `/` if missing)
2. Query `ai_analyses` for this participant + session
3. Also query participant's votes (for the radar chart)
4. Return analysis + vote data

### `src/routes/visualise/+page.svelte` (REWRITE — replace Coming Soon)

Full analysis page:

1. **Hero**: Profile title + summary (large text, gradient accent)
2. **Evidence scorecard**: DonutChart (reuse) showing evidence ratio + interpretation text
3. **Strengths**: Green-tinted cards listing evidence-backed strengths
4. **Blind spots**: Amber-tinted cards listing uncovered areas
5. **Category balance**: RadarChart (reuse) showing participant's category distribution
6. **Recommendation**: Highlighted action card
7. **Back link**: to `/thanks`

Fallback if no analysis: show current picks display with "Analysis unavailable" note.

## Error Handling (Individual)

See combined error handling table in Part 3 below.

## Cost (Individual)

See combined cost table in Part 3 below.

## Components Reused

- `DonutChart.svelte` — evidence score visualization on `/visualise` + dual scores on dashboard
- `RadarChart.svelte` — category distribution on `/visualise`
- `AnimatedCounter.svelte` — evidence score counter on `/thanks`
- `AiPrompt.svelte` — fallback prompt template if FLUX generation unavailable
- Glass card pattern — from existing `/thanks` and dashboard styling
- `CategoryIcon.svelte` — category labels on group analysis cards

---

## Part 2: Group AI Analysis (Dashboards)

### Context

The facilitator dashboards (`/dashboard` and `/dashboard2`) show charts and histograms but no narrative interpretation. The group analysis provides an AI-generated summary of collective voting dynamics.

### Architecture

```
/dashboard or /dashboard2 (load)
  ├── buildTallyResultById(db, sessionId)    ← existing
  ├── getAnalysis(db, '__group__', sessionId) ← NEW
  │   ├── If cached: return it
  │   └── If not: generateGroupAnalysis(ai, db, ...) → store → return
  └── Return tally + groupAnalysis to page
```

### Generation Timing

Unlike individual analysis (pre-generated at vote submit), group analysis is generated **on first dashboard load** because:

- The facilitator may access the dashboard at any time (even before all votes are in)
- Group results change as more participants vote
- Only one generation per session (cached after first call)
- Facilitator can trigger regeneration manually (button)

### Storage

Reuses the `ai_analyses` table with a sentinel participant ID:

```sql
-- participant_id = '__group__' indicates group-level analysis
INSERT INTO ai_analyses (id, participant_id, session_id, analysis, model, created_at)
VALUES (?, '__group__', ?, ?, ?, ?);
```

### Group Analysis Prompt

**System prompt:**

```
You are an AWA (Advanced Workplace Associates) organisational workplace advisor.
You analyse a group's collective workplace feature selections to reveal team dynamics,
consensus patterns, and blind spots, using evidence from CEBMa systematic reviews
and AWA's cognitive performance research.

Given the group's aggregated voting results across individual and communal phases,
generate a group dynamics profile. Be specific about evidence alignment and consensus.

Respond with ONLY valid JSON matching this schema:
{
  "groupTitle": "2-4 word archetype, e.g. 'The Biophilic Collaborators'",
  "groupSummary": "3-4 sentences describing the group's collective workplace personality",
  "consensusFeatures": ["2-3 features with highest agreement across both phases"],
  "contestedFeatures": ["1-2 features with high individual but low communal votes or vice versa"],
  "evidenceAlignment": {
    "individualScore": <number 0-100>,
    "communalScore": <number 0-100>,
    "interpretation": "1-2 sentences comparing evidence literacy across phases"
  },
  "categoryGaps": ["1-2 workspace categories the group undervalues"],
  "groupDynamic": "2-3 sentences on individual vs communal preference tension",
  "facilitatorRecommendation": "2-3 actionable sentences for workspace planning"
}
```

**User prompt (constructed from TallyResult):**

```
GROUP VOTING RESULTS ({participantCount} participants, {voteCount} total votes)

TOP INDIVIDUAL FEATURES (personal workspace):
1. Tuneable LED lighting — 85% (17/20) [EVIDENCE ✓]
2. Biophilic design elements — 75% (15/20) [EVIDENCE ✓]
3. Sit-stand desks — 60% (12/20) [NO EVIDENCE]
...

TOP COMMUNAL FEATURES (shared workspace):
1. Team anchor points — 90% (18/20) [EVIDENCE ✓]
2. Collaborative zones — 70% (14/20) [EVIDENCE ✓]
3. Ping pong / foosball table — 55% (11/20) [NO EVIDENCE]
...

EVIDENCE ALIGNMENT:
- Individual phase: 62% evidence-backed
- Communal phase: 71% evidence-backed

CATEGORY COVERAGE:
- Strongest: biophilic (45 votes), light (38 votes), social (32 votes)
- Weakest: air (5 votes), furniture (8 votes)

OVERLAP:
- Features appearing in both top individual AND communal: [list]
```

### GroupAnalysisResult Type

```typescript
interface GroupAnalysisResult {
	groupTitle: string;
	groupSummary: string;
	consensusFeatures: string[];
	contestedFeatures: string[];
	evidenceAlignment: {
		individualScore: number;
		communalScore: number;
		interpretation: string;
	};
	categoryGaps: string[];
	groupDynamic: string;
	facilitatorRecommendation: string;
}
```

### Functions (added to `src/lib/server/ai-analysis.ts`)

```typescript
// Build group analysis prompt from TallyResult
function buildGroupAnalysisPrompt(tally: TallyResult): string;

// Orchestrator: build prompt, call AI, store with participant_id='__group__'
async function generateAndStoreGroupAnalysis(
	ai: Ai,
	db: DbClient,
	sessionId: string,
	tally: TallyResult
): Promise<GroupAnalysisResult>;
```

### Files to Modify for Group Analysis

#### `src/routes/dashboard/+page.server.ts`

1. Import `getAnalysis`, `generateAndStoreGroupAnalysis` from `$lib/server/ai-analysis`
2. After building tally, check for cached group analysis: `getAnalysis(db, '__group__', sessionId)`
3. If not cached, call `generateAndStoreGroupAnalysis(ai, db, sessionId, tally)`
4. Return `{ ...result, groupAnalysis }` in page data

#### `src/routes/dashboard2/+page.server.ts`

Same pattern as dashboard.

#### `src/routes/dashboard/+page.svelte`

Add a new collapsible card in the analytics stages (or as a floating panel):

- **Group profile**: groupTitle + groupSummary as hero text
- **Consensus features**: highlighted feature cards
- **Evidence alignment**: dual donut charts (individual vs communal scores)
- **Category gaps**: amber warning cards
- **Group dynamic**: narrative text block
- **Facilitator recommendation**: action card with emphasis styling
- **Regenerate button**: allows facilitator to trigger a fresh analysis

#### `src/routes/dashboard2/+page.svelte`

Same group analysis card, adapted to dashboard2's layout.

---

## Part 3: Workspace Concept Image (Dashboards)

### Context

The existing `AiPrompt.svelte` component generates a copy-paste prompt for external image tools (Midjourney, DALL-E). This section replaces that with **native AI image generation** using Cloudflare Workers AI FLUX model, displayed directly on the dashboard.

### Model

`@cf/black-forest-labs/flux-2-klein-4b` — optimised for fast inference:

- 4 fixed denoising steps (not configurable)
- Default output: 1024×768 PNG
- Response: raw binary image data
- Cost: free tier included with Workers AI

### API Pattern

FLUX models on Workers AI use a multipart FormData interface:

```typescript
const form = new FormData();
form.append('prompt', promptText);
form.append('num_steps', '4'); // fixed for klein

// Workers AI expects the multipart body as a stream
const encoder = new Response(form);
const contentType = encoder.headers.get('content-type')!;

const imageResponse = await ai.run('@cf/black-forest-labs/flux-2-klein-4b', {
	multipart: { body: encoder.body!, contentType }
});

// imageResponse is a ReadableStream of PNG bytes
const imageBytes = new Uint8Array(await new Response(imageResponse).arrayBuffer());
const base64 = btoa(String.fromCharCode(...imageBytes));
const dataUri = `data:image/png;base64,${base64}`;
```

### Storage

Stored in the same `ai_analyses` table with a different sentinel:

```sql
-- participant_id = '__workspace_image__' for the generated image
INSERT INTO ai_analyses (id, participant_id, session_id, analysis, model, created_at)
VALUES (?, '__workspace_image__', ?, ?, ?, ?);
-- analysis column contains the base64 data URI string
```

**Note**: Base64 PNG at 1024×768 is ~100-200KB. D1 TEXT columns handle this fine (max 1MB per row). This avoids adding R2 as a new dependency.

### Image Prompt

Derived from the existing `AiPrompt.svelte` template, constructed dynamically from the top-voted features:

```typescript
function buildWorkspaceImagePrompt(tally: TallyResult): string {
	// Take top 5 features across both phases
	const combined = [...tally.individual.features, ...tally.communal.features]
		.sort((a, b) => b.voteCount - a.voteCount)
		.slice(0, 8);

	const featureList = combined.map((f) => f.name.toLowerCase()).join(', ');

	return (
		`Create a photorealistic architectural visualisation of a modern workplace interior ` +
		`designed for cognitive performance. The space must prominently feature: ${featureList}. ` +
		`Show humans actively using the space — people collaborating, working in focus zones, ` +
		`taking breaks in green spaces. Warm natural light, visible plants and natural materials. ` +
		`Wide-angle professional architectural photography. Clean modern design.`
	);
}
```

### Generation Timing

- Generated alongside group analysis on first dashboard load
- Cached in D1 — subsequent loads use the stored image
- Facilitator can regenerate (new analysis triggers new image too)

### Functions (added to `src/lib/server/ai-analysis.ts`)

```typescript
// Build image prompt from top features
function buildWorkspaceImagePrompt(tally: TallyResult): string;

// Call FLUX model, return base64 data URI
async function generateWorkspaceImage(ai: Ai, tally: TallyResult): Promise<string>; // returns data:image/png;base64,...

// Orchestrator: generate image + store
async function generateAndStoreWorkspaceImage(
	ai: Ai,
	db: DbClient,
	sessionId: string,
	tally: TallyResult
): Promise<string>;

// Load stored image
async function getWorkspaceImage(db: DbClient, sessionId: string): Promise<string | null>;
```

### Files to Modify for Workspace Image

#### `src/routes/dashboard/+page.server.ts`

1. Import `getWorkspaceImage`, `generateAndStoreWorkspaceImage`
2. Alongside group analysis, check for cached image
3. If not cached, generate via `ctx.waitUntil()` (non-blocking, image takes ~5-10s)
4. Return `{ ...result, groupAnalysis, workspaceImage }` in page data

#### `src/routes/dashboard2/+page.server.ts`

Same pattern.

#### `src/routes/dashboard/+page.svelte`

Add workspace image display:

- **Hero image card**: full-width image with rounded corners, subtle shadow
- Placed in analytics as a new stage or within the "Verdict" stage
- If image not yet ready: skeleton placeholder with "Generating workspace visualisation..." text
- If image ready: fade-in reveal with the group's top features overlaid as subtle labels
- Below image: "Powered by FLUX AI · Based on your group's top-voted features" caption

#### `src/routes/dashboard2/+page.svelte`

Same image display, adapted to layout.

#### `src/lib/components/AiPrompt.svelte` (DEPRECATE)

The existing copy-paste prompt component becomes unnecessary once native image generation is in place. Keep it as a fallback (hidden by default) for cases where AI binding is unavailable.

---

## Combined Error Handling

| Scenario                            | Behavior                                                             |
| ----------------------------------- | -------------------------------------------------------------------- |
| Individual AI call fails            | Log error, redirect proceeds — `/thanks` shows picks without AI card |
| AI returns invalid JSON             | Retry once with stricter prompt; if still fails, store error state   |
| Analysis not ready on `/thanks`     | Show "preparing..." + meta refresh after 3s                          |
| Analysis not found on `/visualise`  | Show fallback content (picks summary, no AI)                         |
| Workers AI timeout (>30s)           | `waitUntil` handles gracefully, analysis marked as failed            |
| Group analysis fails                | Dashboard shows charts without AI card — fallback to raw data        |
| FLUX image generation fails         | Show AiPrompt.svelte as fallback (copy-paste prompt)                 |
| FLUX returns empty/corrupt data     | Log error, show "Image unavailable" with regenerate button           |
| D1 base64 storage exceeds row limit | Truncate gracefully, log warning — unlikely at 1024×768              |

## Combined Cost

| Metric                     | Value                                        |
| -------------------------- | -------------------------------------------- |
| Individual analysis tokens | ~700 tokens per participant                  |
| Group analysis tokens      | ~800 tokens per session                      |
| FLUX image generation      | 1 image per session (free tier)              |
| Free tier (text)           | 10,000 tokens/day (~14 participants)         |
| Free tier (image)          | Included with Workers AI                     |
| Paid tier (text)           | ~$0.005 per participant + $0.001 per session |
| Paid tier (image)          | ~$0.01 per image                             |

## Verification

1. `bun run build` — clean compile
2. Create session, vote with known feature set
3. Verify `/thanks` shows AI summary card within ~5s
4. Verify `/visualise` shows full analysis with charts
5. Open `/dashboard` — verify group analysis card appears
6. Open `/dashboard` — verify workspace image generates and displays
7. Open `/dashboard2` — verify same group analysis + image
8. Test regeneration: click regenerate, verify new analysis + image
9. Test error case: temporarily disable AI binding, verify graceful fallback on all pages
10. Deploy with `bunx wrangler deploy`
