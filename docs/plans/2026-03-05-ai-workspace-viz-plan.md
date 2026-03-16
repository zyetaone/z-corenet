# AI Workspace Visualization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI-generated workspace images using fal.ai nano-banana-2 to the thanks page (individual) and dashboard page 4 (gallery + collective).

**Architecture:** Single `POST /api/generate-image` endpoint handles both individual and collective generation. Images stored as base64 data URIs in D1. Dashboard polls `GET /api/workspace-images` for gallery updates. ZyetaI-branded loader with simulated progress.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, @fal-ai/client, Drizzle ORM, Cloudflare D1, TailwindCSS v4

**Design doc:** `docs/plans/2026-03-05-ai-workspace-viz-design.md`

---

### Task 1: Install @fal-ai/client + configure environment

**Files:**

- Modify: `package.json`
- Modify: `src/app.d.ts:26-28`
- Modify: `wrangler.jsonc`

**Step 1: Install fal.ai client**

Run: `bun add @fal-ai/client`

**Step 2: Add FAL_API_KEY to Env interface**

In `src/app.d.ts`, update the `Env` interface:

```typescript
interface Env {
	DB: D1Database;
	FAL_API_KEY: string;
}
```

**Step 3: Verify .env has the key**

Check `.env` contains `FAL_API_KEY=...` (already confirmed present).

**Step 4: Commit**

```bash
git add package.json bun.lockb src/app.d.ts
git commit -m "chore: add @fal-ai/client, configure FAL_API_KEY env"
```

---

### Task 2: D1 migration + Drizzle schema

**Files:**

- Create: `migrations/0002_workspace_images.sql`
- Modify: `src/lib/server/db/schema.ts`

**Step 1: Write migration SQL**

Create `migrations/0002_workspace_images.sql`:

```sql
-- Add email column to participants
ALTER TABLE participants ADD COLUMN email TEXT;

-- Workspace images table
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

**Step 2: Update Drizzle schema**

In `src/lib/server/db/schema.ts`, add `email` to `participants` and add `workspaceImages` table:

```typescript
// Add to participants table definition:
email: text('email'),

// Add new table after comments:
export const workspaceImages = sqliteTable(
	'workspace_images',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		sessionId: text('session_id').notNull(),
		participantId: text('participant_id'),
		participantName: text('participant_name'),
		participantEmail: text('participant_email'),
		imageData: text('image_data').notNull(),
		prompt: text('prompt').notNull(),
		generationNum: integer('generation_num').notNull().default(1),
		type: text('type').notNull().default('individual'),
		featureNames: text('feature_names'),
		createdAt: text('created_at')
			.notNull()
			.$defaultFn(() => new Date().toISOString())
	},
	(table) => [
		index('idx_wi_session').on(table.sessionId),
		index('idx_wi_participant').on(table.participantId)
	]
);

export type WorkspaceImage = typeof workspaceImages.$inferSelect;
```

**Step 3: Apply migration locally**

Run: `bunx wrangler d1 execute corenet-db --local --file=migrations/0002_workspace_images.sql`

**Step 4: Verify build**

Run: `bun run check`

**Step 5: Commit**

```bash
git add migrations/0002_workspace_images.sql src/lib/server/db/schema.ts
git commit -m "feat: add workspace_images table + participants.email column"
```

---

### Task 3: Image generator server module (fal.ai + prompt builder)

**Files:**

- Create: `src/lib/server/ai/image-generator.ts`

**Step 1: Create the image generator module**

This module exports three functions:

- `buildWorkspacePrompt()` — constructs the hybrid prompt
- `generateWorkspaceImage()` — calls fal.ai and returns base64
- `configureFal()` — sets up fal.ai client with API key

```typescript
import { fal } from '@fal-ai/client';

const MAX_GENERATIONS = 3;

export { MAX_GENERATIONS };

/**
 * Configure fal.ai client with API key from platform env.
 */
export function configureFal(apiKey: string): void {
	fal.config({ credentials: apiKey });
}

/**
 * Build a hybrid workspace prompt combining CoreNet evidence awareness
 * with workspace-studio rendering specifications.
 */
export function buildWorkspacePrompt(
	features: Array<{ name: string; hasEvidence: boolean }>,
	additionalPrompt?: string
): string {
	const evidenceBacked = features.filter((f) => f.hasEvidence).map((f) => f.name.toLowerCase());
	const allFeatures = features.map((f) => f.name.toLowerCase()).join(', ');

	const parts = [
		`Create a photorealistic architectural visualisation of a modern workplace interior`,
		`designed for cognitive performance. The space must prominently feature: ${allFeatures}.`
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

/**
 * Build regeneration prompt by appending user modifications.
 */
export function buildRegenerationPrompt(previousPrompt: string, userInput?: string): string {
	if (userInput?.trim()) {
		return `${previousPrompt} | Alternative version: ${userInput.trim()}`;
	}
	return `${previousPrompt} | Show me another option with a fresh perspective and different design approach while maintaining the core requirements.`;
}

/**
 * Call fal.ai nano-banana-2 and return a base64 data URI.
 */
export async function generateWorkspaceImage(prompt: string): Promise<{
	imageData: string;
	prompt: string;
}> {
	const result = await fal.subscribe('fal-ai/nano-banana-2', {
		input: {
			prompt,
			num_images: 1,
			aspect_ratio: '16:9',
			resolution: '1K',
			output_format: 'jpeg'
		}
	});

	const imageUrl = result.data?.images?.[0]?.url;
	if (!imageUrl) {
		throw new Error('No image URL in fal.ai response');
	}

	// Fetch the temporary URL and convert to base64 data URI
	const imageResponse = await fetch(imageUrl);
	if (!imageResponse.ok) {
		throw new Error(`Failed to fetch image: ${imageResponse.status}`);
	}

	const arrayBuffer = await imageResponse.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);

	// Convert to base64 in chunks to avoid call stack overflow
	let binary = '';
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
	}
	const base64 = btoa(binary);
	const imageData = `data:image/jpeg;base64,${base64}`;

	return { imageData, prompt };
}
```

**Step 2: Verify build**

Run: `bun run check`

**Step 3: Commit**

```bash
git add src/lib/server/ai/image-generator.ts
git commit -m "feat: add fal.ai image generator with hybrid prompt builder"
```

---

### Task 4: DB query functions for workspace images

**Files:**

- Modify: `src/lib/server/db/queries.ts`

**Step 1: Add workspace image query functions**

Append to `src/lib/server/db/queries.ts`:

```typescript
import { workspaceImages, participants } from './schema';
import type { WorkspaceImage } from './schema';

// ── Workspace Images ──

export async function getWorkspaceImageCount(
	db: DbClient,
	participantId: string,
	sessionId: string
): Promise<number> {
	const [result] = await db
		.select({ count: count() })
		.from(workspaceImages)
		.where(
			sql`${workspaceImages.participantId} = ${participantId} AND ${workspaceImages.sessionId} = ${sessionId}`
		);
	return result.count;
}

export async function getCollectiveImageCount(db: DbClient, sessionId: string): Promise<number> {
	const [result] = await db
		.select({ count: count() })
		.from(workspaceImages)
		.where(
			sql`${workspaceImages.type} = 'collective' AND ${workspaceImages.sessionId} = ${sessionId}`
		);
	return result.count;
}

export async function insertWorkspaceImage(
	db: DbClient,
	data: {
		sessionId: string;
		participantId?: string;
		participantName?: string;
		participantEmail?: string;
		imageData: string;
		prompt: string;
		generationNum: number;
		type: 'individual' | 'collective';
		featureNames: string[];
	}
): Promise<WorkspaceImage> {
	const [row] = await db
		.insert(workspaceImages)
		.values({
			sessionId: data.sessionId,
			participantId: data.participantId ?? null,
			participantName: data.participantName ?? null,
			participantEmail: data.participantEmail ?? null,
			imageData: data.imageData,
			prompt: data.prompt,
			generationNum: data.generationNum,
			type: data.type,
			featureNames: JSON.stringify(data.featureNames)
		})
		.returning();
	return row;
}

export async function getSessionWorkspaceImages(
	db: DbClient,
	sessionId: string
): Promise<WorkspaceImage[]> {
	return db
		.select()
		.from(workspaceImages)
		.where(eq(workspaceImages.sessionId, sessionId))
		.orderBy(sql`${workspaceImages.createdAt} desc`);
}

export async function getLatestParticipantImage(
	db: DbClient,
	participantId: string,
	sessionId: string
): Promise<WorkspaceImage | undefined> {
	const [row] = await db
		.select()
		.from(workspaceImages)
		.where(
			sql`${workspaceImages.participantId} = ${participantId} AND ${workspaceImages.sessionId} = ${sessionId}`
		)
		.orderBy(sql`${workspaceImages.createdAt} desc`)
		.limit(1);
	return row;
}

export async function updateParticipantIdentity(
	db: DbClient,
	participantId: string,
	name: string,
	email: string
): Promise<void> {
	await db.update(participants).set({ name, email }).where(eq(participants.id, participantId));
}
```

**Step 2: Verify build**

Run: `bun run check`

**Step 3: Commit**

```bash
git add src/lib/server/db/queries.ts
git commit -m "feat: add workspace image DB queries"
```

---

### Task 5: POST /api/generate-image endpoint

**Files:**

- Create: `src/routes/api/generate-image/+server.ts`

**Step 1: Create the endpoint**

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { eq, and, sql, count } from 'drizzle-orm';
import { votes, sessionFeatures, workspaceImages, participants } from '$lib/server/db/schema';
import {
	getWorkspaceImageCount,
	getCollectiveImageCount,
	insertWorkspaceImage,
	updateParticipantIdentity
} from '$lib/server/db/queries';
import {
	configureFal,
	buildWorkspacePrompt,
	buildRegenerationPrompt,
	generateWorkspaceImage,
	MAX_GENERATIONS
} from '$lib/server/ai/image-generator';
import { buildTallyResultById } from '$lib/server/tally';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	const sessionId = cookies.get('session_id');
	const participantId = cookies.get('participant_id');
	if (!sessionId) error(401, 'No active session');

	const db = getDb(platform);
	const apiKey = platform?.env?.FAL_API_KEY;
	if (!apiKey) error(503, 'Image generation not available');

	configureFal(apiKey);

	const body = await request.json();
	const { type, name, email, additionalPrompt } = body as {
		type: 'individual' | 'collective';
		name?: string;
		email?: string;
		additionalPrompt?: string;
	};

	if (type !== 'individual' && type !== 'collective') {
		error(400, 'Invalid type');
	}

	let features: Array<{ name: string; hasEvidence: boolean }> = [];
	let currentCount = 0;

	if (type === 'individual') {
		if (!participantId) error(401, 'No participant session');

		// Check generation limit
		currentCount = await getWorkspaceImageCount(db, participantId, sessionId);
		if (currentCount >= MAX_GENERATIONS) {
			error(429, 'Generation limit reached');
		}

		// Update participant identity if provided
		if (name?.trim() || email?.trim()) {
			await updateParticipantIdentity(db, participantId, name?.trim() ?? '', email?.trim() ?? '');
		}

		// Fetch this participant's voted features
		const rows = await db
			.select({
				name: sessionFeatures.name,
				hasEvidence: sessionFeatures.hasEvidence
			})
			.from(votes)
			.innerJoin(
				sessionFeatures,
				and(
					eq(votes.featureId, sessionFeatures.featureId),
					eq(votes.sessionId, sessionFeatures.sessionId)
				)
			)
			.where(and(eq(votes.participantId, participantId), eq(votes.sessionId, sessionId)));

		features = rows.map((r) => ({ name: r.name, hasEvidence: r.hasEvidence }));
	} else {
		// Collective: use top 8 features from tally
		currentCount = await getCollectiveImageCount(db, sessionId);
		if (currentCount >= MAX_GENERATIONS) {
			error(429, 'Generation limit reached');
		}

		const tally = await buildTallyResultById(db, sessionId);
		if (!tally) error(404, 'No tally data');

		// Merge both phases, deduplicate, take top 8
		const merged = new Map<string, { name: string; hasEvidence: boolean; voteCount: number }>();
		for (const f of [...tally.individual.features, ...tally.communal.features]) {
			const existing = merged.get(f.name);
			if (existing) {
				existing.voteCount += f.voteCount;
			} else {
				merged.set(f.name, { name: f.name, hasEvidence: f.hasEvidence, voteCount: f.voteCount });
			}
		}
		features = [...merged.values()]
			.sort((a, b) => b.voteCount - a.voteCount)
			.slice(0, 8)
			.map((f) => ({ name: f.name, hasEvidence: f.hasEvidence }));
	}

	if (features.length === 0) {
		error(400, 'No features found for image generation');
	}

	// Build prompt (new or regeneration)
	let prompt: string;
	if (currentCount > 0 && additionalPrompt !== undefined) {
		// Regeneration: modify previous prompt
		const basePrompt = buildWorkspacePrompt(features);
		prompt = buildRegenerationPrompt(basePrompt, additionalPrompt);
	} else {
		prompt = buildWorkspacePrompt(features, additionalPrompt);
	}

	// Generate image via fal.ai
	const result = await generateWorkspaceImage(prompt);
	const generationNum = currentCount + 1;

	// Store in DB
	await insertWorkspaceImage(db, {
		sessionId,
		participantId: type === 'individual' ? participantId : undefined,
		participantName: name?.trim(),
		participantEmail: email?.trim(),
		imageData: result.imageData,
		prompt: result.prompt,
		generationNum,
		type,
		featureNames: features.map((f) => f.name)
	});

	return json({
		imageData: result.imageData,
		prompt: result.prompt,
		generationsRemaining: MAX_GENERATIONS - generationNum,
		generationNum
	});
};
```

**Step 2: Verify build**

Run: `bun run check`

**Step 3: Commit**

```bash
git add src/routes/api/generate-image/+server.ts
git commit -m "feat: add POST /api/generate-image endpoint for fal.ai generation"
```

---

### Task 6: GET /api/workspace-images endpoint

**Files:**

- Create: `src/routes/api/workspace-images/+server.ts`

**Step 1: Create the gallery polling endpoint**

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getSessionWorkspaceImages } from '$lib/server/db/queries';

export const GET: RequestHandler = async ({ platform, cookies }) => {
	const sessionId = cookies.get('session_id');
	if (!sessionId) error(401, 'No active session');

	const db = getDb(platform);
	const images = await getSessionWorkspaceImages(db, sessionId);

	// Split into individual and collective, return latest per participant
	const individualMap = new Map<string, (typeof images)[0]>();
	const collective: (typeof images)[0][] = [];

	for (const img of images) {
		if (img.type === 'collective') {
			collective.push(img);
		} else if (img.participantId) {
			// Keep only the latest image per participant
			if (!individualMap.has(img.participantId)) {
				individualMap.set(img.participantId, img);
			}
		}
	}

	return json({
		individual: [...individualMap.values()].map((img) => ({
			id: img.id,
			participantName: img.participantName ?? 'Anonymous',
			imageData: img.imageData,
			featureNames: img.featureNames ? JSON.parse(img.featureNames) : [],
			createdAt: img.createdAt
		})),
		collective: collective.map((img) => ({
			id: img.id,
			imageData: img.imageData,
			prompt: img.prompt,
			featureNames: img.featureNames ? JSON.parse(img.featureNames) : [],
			createdAt: img.createdAt
		}))
	});
};
```

**Step 2: Verify build**

Run: `bun run check`

**Step 3: Commit**

```bash
git add src/routes/api/workspace-images/+server.ts
git commit -m "feat: add GET /api/workspace-images for dashboard gallery polling"
```

---

### Task 7: AiLoader component (ZyetaI branding)

**Files:**

- Create: `src/lib/components/AiLoader.svelte`

**Step 1: Create the loader component**

Port from workspace-studio's ImagePreview.svelte, adapted for CoreNet's teal theme:

```svelte
<script lang="ts">
	let {
		progress = 0,
		message = 'Creating your workspace...',
		showCredit = true,
		dark = false
	}: {
		progress?: number;
		message?: string;
		showCredit?: boolean;
		dark?: boolean;
	} = $props();
</script>

<div class="flex flex-col items-center gap-4 p-8" class:dark-mode={dark}>
	{#if showCredit}
		<div class="flex flex-col items-center gap-1">
			<span class="credit-label">Powered by</span>
			<h3 class="brand-text">
				Zyeta<span class="bounce-i">I</span>
			</h3>
		</div>
	{/if}

	<div class="flex flex-col items-center gap-2">
		<p class="progress-pct">{progress}%</p>
		<div class="progress-track">
			<div class="progress-fill" style="width: {progress}%"></div>
		</div>
		{#if message}
			<p class="progress-msg">{message}</p>
		{/if}
	</div>
</div>

<style>
	.credit-label {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(15, 25, 35, 0.5);
	}

	.dark-mode .credit-label {
		color: rgba(255, 255, 255, 0.5);
	}

	.brand-text {
		font-size: 1.875rem;
		font-weight: 700;
		background: linear-gradient(135deg, var(--color-teal), var(--color-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.bounce-i {
		display: inline-block;
		background: linear-gradient(135deg, var(--color-teal), var(--color-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: dot-bounce 3s ease-in-out infinite;
		transform-origin: bottom;
	}

	@keyframes dot-bounce {
		0%,
		100% {
			transform: translateY(0) scaleY(1) scaleX(1);
		}
		10% {
			transform: translateY(0) scaleY(0.3) scaleX(1.3);
		}
		20% {
			transform: translateY(-8px) scaleY(1.1) scaleX(0.9);
		}
		30% {
			transform: translateY(0) scaleY(0.95) scaleX(1.05);
		}
		40% {
			transform: translateY(-4px) scaleY(1.05) scaleX(0.95);
		}
		50% {
			transform: translateY(0) scaleY(1) scaleX(1);
		}
	}

	.progress-pct {
		font-size: 1.125rem;
		font-weight: 600;
		color: rgba(15, 25, 35, 0.8);
	}

	.dark-mode .progress-pct {
		color: rgba(255, 255, 255, 0.9);
	}

	.progress-track {
		width: 16rem;
		height: 0.75rem;
		border-radius: 9999px;
		background: rgba(15, 25, 35, 0.1);
		overflow: hidden;
	}

	.dark-mode .progress-track {
		background: rgba(255, 255, 255, 0.1);
	}

	.progress-fill {
		height: 100%;
		border-radius: 9999px;
		background: linear-gradient(90deg, var(--color-teal), var(--color-accent));
		transition: width 0.3s ease-out;
	}

	.progress-msg {
		font-size: 0.8125rem;
		color: rgba(15, 25, 35, 0.5);
	}

	.dark-mode .progress-msg {
		color: rgba(255, 255, 255, 0.5);
	}

	@media (prefers-reduced-motion: reduce) {
		.bounce-i {
			animation: none;
		}
	}
</style>
```

**Step 2: Verify build**

Run: `bun run check`

**Step 3: Commit**

```bash
git add src/lib/components/AiLoader.svelte
git commit -m "feat: add AiLoader component with ZyetaI branding"
```

---

### Task 8: PromptDropdown component

**Files:**

- Create: `src/lib/components/PromptDropdown.svelte`

**Step 1: Create the prompt dropdown**

```svelte
<script lang="ts">
	import { ChevronDown, Copy, Check } from '@lucide/svelte';

	let {
		prompt,
		dark = false
	}: {
		prompt: string;
		dark?: boolean;
	} = $props();

	let open = $state(false);
	let copied = $state(false);

	function copyToClipboard() {
		navigator.clipboard.writeText(prompt);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="prompt-dropdown" class:dark-mode={dark}>
	<button type="button" class="toggle-btn" onclick={() => (open = !open)}>
		<ChevronDown size={14} class="chevron {open ? 'rotated' : ''}" />
		View full prompt
	</button>

	{#if open}
		<div class="prompt-box">
			<button type="button" class="copy-btn" onclick={copyToClipboard}>
				{#if copied}
					<Check size={14} />
				{:else}
					<Copy size={14} />
				{/if}
			</button>
			<pre class="prompt-text">{prompt}</pre>
		</div>
	{/if}
</div>

<style>
	.prompt-dropdown {
		width: 100%;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(15, 25, 35, 0.4);
		cursor: pointer;
		background: none;
		border: none;
		padding: 0.25rem 0;
		transition: color 0.2s;
	}

	.toggle-btn:hover {
		color: rgba(15, 25, 35, 0.7);
	}

	.dark-mode .toggle-btn {
		color: rgba(255, 255, 255, 0.35);
	}

	.dark-mode .toggle-btn:hover {
		color: rgba(255, 255, 255, 0.7);
	}

	:global(.chevron) {
		transition: transform 0.2s;
	}

	:global(.chevron.rotated) {
		transform: rotate(180deg);
	}

	.prompt-box {
		position: relative;
		margin-top: 0.5rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.08);
	}

	.dark-mode .prompt-box {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.copy-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.375rem;
		border-radius: 0.375rem;
		background: rgba(0, 0, 0, 0.06);
		border: none;
		color: rgba(15, 25, 35, 0.4);
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		background: rgba(0, 0, 0, 0.12);
		color: rgba(15, 25, 35, 0.7);
	}

	.dark-mode .copy-btn {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.4);
	}

	.dark-mode .copy-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.7);
	}

	.prompt-text {
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		line-height: 1.6;
		color: rgba(15, 25, 35, 0.6);
		white-space: pre-wrap;
		word-break: break-word;
		margin: 0;
	}

	.dark-mode .prompt-text {
		color: rgba(255, 255, 255, 0.55);
	}
</style>
```

**Step 2: Commit**

```bash
git add src/lib/components/PromptDropdown.svelte
git commit -m "feat: add PromptDropdown component with copy-to-clipboard"
```

---

### Task 9: WorkspaceImage display component

**Files:**

- Create: `src/lib/components/WorkspaceImage.svelte`

**Step 1: Create the image display component**

This component handles image display, regeneration with reprompt, download, fullscreen, and prompt dropdown. Used on both thanks page and dashboard.

```svelte
<script lang="ts">
	import { RefreshCw, Download, Maximize2 } from '@lucide/svelte';
	import PromptDropdown from './PromptDropdown.svelte';

	let {
		imageData,
		prompt,
		generationsRemaining,
		onregenerate,
		dark = false
	}: {
		imageData: string;
		prompt: string;
		generationsRemaining: number;
		onregenerate: (additionalPrompt?: string) => void;
		dark?: boolean;
	} = $props();

	let repromptText = $state('');
	let fullscreen = $state(false);

	function download() {
		const link = document.createElement('a');
		link.href = imageData;
		link.download = `workspace-${Date.now()}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function toggleFullscreen() {
		fullscreen = !fullscreen;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && fullscreen) {
			fullscreen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="workspace-image" class:dark-mode={dark}>
	<!-- Image -->
	<button type="button" class="image-container" onclick={toggleFullscreen}>
		<img src={imageData} alt="AI-generated workspace" class="workspace-img" />
	</button>

	<!-- Reprompt input -->
	<div class="reprompt-row">
		<input
			type="text"
			class="reprompt-input"
			placeholder="Add to prompt: &quot;more plants, warmer lighting...&quot;"
			bind:value={repromptText}
			disabled={generationsRemaining <= 0}
		/>
	</div>

	<!-- Action buttons -->
	<div class="actions-row">
		<button
			type="button"
			class="action-btn"
			disabled={generationsRemaining <= 0}
			onclick={() => {
				onregenerate(repromptText || undefined);
				repromptText = '';
			}}
		>
			<RefreshCw size={14} />
			{#if generationsRemaining > 0}
				Regenerate ({generationsRemaining} left)
			{:else}
				All generations used
			{/if}
		</button>
		<button type="button" class="action-btn" onclick={download}>
			<Download size={14} /> Download
		</button>
		<button type="button" class="action-btn" onclick={toggleFullscreen}>
			<Maximize2 size={14} /> Full Size
		</button>
	</div>

	<!-- Prompt dropdown -->
	<PromptDropdown {prompt} {dark} />
</div>

<!-- Fullscreen overlay -->
{#if fullscreen}
	<div
		class="fullscreen-overlay"
		role="dialog"
		aria-modal="true"
		onclick={toggleFullscreen}
		onkeydown={(e) => e.key === 'Escape' && toggleFullscreen()}
		tabindex="-1"
	>
		<img src={imageData} alt="AI-generated workspace (full size)" class="fullscreen-img" />
	</div>
{/if}

<style>
	.workspace-image {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	.image-container {
		cursor: zoom-in;
		border: none;
		background: none;
		padding: 0;
		border-radius: 1rem;
		overflow: hidden;
	}

	.workspace-img {
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 1rem;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
	}

	.reprompt-row {
		width: 100%;
	}

	.reprompt-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(15, 25, 35, 0.12);
		background: rgba(15, 25, 35, 0.03);
		font-size: 0.8125rem;
		color: rgba(15, 25, 35, 0.8);
		font-family: var(--font-sans);
		transition: border-color 0.2s;
	}

	.reprompt-input:focus {
		outline: none;
		border-color: var(--color-teal);
	}

	.reprompt-input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dark-mode .reprompt-input {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.8);
	}

	.actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 0.625rem;
		border: 1px solid rgba(15, 25, 35, 0.1);
		background: rgba(15, 25, 35, 0.04);
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(15, 25, 35, 0.6);
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(15, 25, 35, 0.08);
		color: rgba(15, 25, 35, 0.8);
	}

	.action-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.dark-mode .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.6);
	}

	.dark-mode .action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.8);
	}

	.fullscreen-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(8px);
		cursor: zoom-out;
		padding: 2rem;
	}

	.fullscreen-img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: 0.5rem;
	}
</style>
```

**Step 2: Commit**

```bash
git add src/lib/components/WorkspaceImage.svelte
git commit -m "feat: add WorkspaceImage component with regenerate/download/fullscreen"
```

---

### Task 10: Thanks page — add visualization section

**Files:**

- Modify: `src/routes/thanks/+page.server.ts`
- Modify: `src/routes/thanks/+page.svelte`

**Step 1: Update thanks page server load**

Add existing workspace image loading to `+page.server.ts`:

```typescript
// Add to imports:
import { getLatestParticipantImage, getWorkspaceImageCount } from '$lib/server/db/queries';
import { MAX_GENERATIONS } from '$lib/server/ai/image-generator';

// After the existing query, before the return, add:
const existingImage = await getLatestParticipantImage(db, participantId, sessionId);
const imageCount = existingImage ? await getWorkspaceImageCount(db, participantId, sessionId) : 0;

// Update return:
return {
	individual,
	communal,
	existingImage: existingImage
		? {
				imageData: existingImage.imageData,
				prompt: existingImage.prompt,
				generationsRemaining: MAX_GENERATIONS - imageCount
			}
		: null,
	hasFalKey: !!platform?.env?.FAL_API_KEY
};
```

**Step 2: Update thanks page template**

Add visualization section after the existing grid in `+page.svelte`. The component manages its own state machine: form → generating → image display.

Add these imports:

```typescript
import AiLoader from '$lib/components/AiLoader.svelte';
import WorkspaceImage from '$lib/components/WorkspaceImage.svelte';
import { Sparkles } from '@lucide/svelte';
```

Add state variables:

```typescript
let vizState = $state<'form' | 'generating' | 'done'>(data.existingImage ? 'done' : 'form');
let userName = $state('');
let userEmail = $state('');
let progress = $state(0);
let progressMsg = $state('Creating your workspace...');
let currentImage = $state(data.existingImage?.imageData ?? '');
let currentPrompt = $state(data.existingImage?.prompt ?? '');
let generationsRemaining = $state(data.existingImage?.generationsRemaining ?? 3);

// Simulated progress
let progressInterval: ReturnType<typeof setInterval> | null = null;

function startProgress() {
	progress = 0;
	progressInterval = setInterval(() => {
		if (progress < 90) {
			progress = Math.min(90, progress + Math.random() * 20);
		}
	}, 400);
}

function stopProgress() {
	if (progressInterval) clearInterval(progressInterval);
	progress = 100;
}

async function generateImage(additionalPrompt?: string) {
	vizState = 'generating';
	startProgress();
	progressMsg = additionalPrompt ? 'Regenerating workspace...' : 'Creating your workspace...';

	try {
		const res = await fetch('/api/generate-image', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'individual',
				name: userName || undefined,
				email: userEmail || undefined,
				additionalPrompt
			})
		});

		if (!res.ok) {
			const err = await res.json().catch(() => ({ message: 'Generation failed' }));
			throw new Error(err.message ?? `HTTP ${res.status}`);
		}

		const result = await res.json();
		stopProgress();

		currentImage = result.imageData;
		currentPrompt = result.prompt;
		generationsRemaining = result.generationsRemaining;
		vizState = 'done';
	} catch (e) {
		stopProgress();
		vizState = currentImage ? 'done' : 'form';
		// Could add toast/error display here
		console.error('Image generation failed:', e);
	}
}
```

Add visualization section in the template (after the closing `</div>` of the grid, before the outer closing):

```svelte
{#if data.hasFalKey}
	<div
		class="mt-4 rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.15)] md:p-8"
	>
		{#if vizState === 'form'}
			<div class="flex flex-col items-center gap-4 text-center">
				<div class="flex items-center gap-2 text-accent">
					<Sparkles size={20} />
					<h3 class="font-display text-xl font-bold text-slate-900">Visualise Your Workspace</h3>
				</div>
				<p class="text-sm text-slate-500">
					See your choices come to life as an AI-generated workspace design
				</p>
				<div class="flex w-full max-w-md gap-3">
					<input
						type="text"
						placeholder="Your Name"
						bind:value={userName}
						class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal focus:outline-none"
					/>
					<input
						type="email"
						placeholder="Email"
						bind:value={userEmail}
						class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal focus:outline-none"
					/>
				</div>
				<button
					type="button"
					class="rounded-xl bg-gradient-to-r from-teal to-accent px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
					disabled={!userName.trim() || !userEmail.trim()}
					onclick={() => generateImage()}
				>
					Generate My Workspace
				</button>
			</div>
		{:else if vizState === 'generating'}
			<AiLoader {progress} message={progressMsg} />
		{:else}
			<WorkspaceImage
				imageData={currentImage}
				prompt={currentPrompt}
				{generationsRemaining}
				onregenerate={(additionalPrompt) => generateImage(additionalPrompt)}
			/>
		{/if}
	</div>
{/if}
```

**Step 3: Verify build**

Run: `bun run check`

**Step 4: Commit**

```bash
git add src/routes/thanks/+page.server.ts src/routes/thanks/+page.svelte
git commit -m "feat: add workspace visualization section to thanks page"
```

---

### Task 11: ImageModal component (for dashboard gallery)

**Files:**

- Create: `src/lib/components/ImageModal.svelte`

**Step 1: Create the modal**

```svelte
<script lang="ts">
	import { X, Download, Maximize2 } from '@lucide/svelte';
	import PromptDropdown from './PromptDropdown.svelte';

	let {
		image,
		onclose
	}: {
		image: {
			participantName: string;
			imageData: string;
			featureNames: string[];
			prompt?: string;
		};
		onclose: () => void;
	} = $props();

	let fullscreen = $state(false);

	function download() {
		const link = document.createElement('a');
		link.href = image.imageData;
		link.download = `workspace-${image.participantName}-${Date.now()}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (fullscreen) {
				fullscreen = false;
			} else {
				onclose();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<div
	class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
	role="presentation"
	onclick={onclose}
></div>

<!-- Modal -->
<div
	class="fixed inset-4 z-50 mx-auto my-auto flex max-h-[90vh] max-w-2xl flex-col overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
	role="dialog"
	aria-modal="true"
>
	<!-- Close button -->
	<button
		type="button"
		class="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
		onclick={onclose}
	>
		<X size={18} />
	</button>

	<!-- Image -->
	<div class="p-4 pb-0">
		<img
			src={image.imageData}
			alt="{image.participantName}'s workspace"
			class="w-full rounded-2xl object-cover"
			style="aspect-ratio: 16/9"
		/>
	</div>

	<!-- Content -->
	<div class="flex flex-col gap-3 p-5">
		<h3 class="font-display text-lg font-bold text-white">
			{image.participantName}'s Workspace
		</h3>

		{#if image.featureNames.length > 0}
			<div>
				<p class="mb-1 text-xs font-semibold tracking-wider text-white/40 uppercase">
					Feature choices
				</p>
				<p class="text-sm leading-relaxed text-white/70">
					{image.featureNames.join(', ')}
				</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex gap-2">
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
				onclick={download}
			>
				<Download size={13} /> Download
			</button>
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
				onclick={() => (fullscreen = true)}
			>
				<Maximize2 size={13} /> Full Size
			</button>
		</div>

		{#if image.prompt}
			<PromptDropdown prompt={image.prompt} dark={true} />
		{/if}
	</div>
</div>

<!-- Fullscreen -->
{#if fullscreen}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
		role="dialog"
		aria-modal="true"
		onclick={() => (fullscreen = false)}
		onkeydown={(e) => e.key === 'Escape' && (fullscreen = false)}
		tabindex="-1"
	>
		<img
			src={image.imageData}
			alt="{image.participantName}'s workspace (full size)"
			class="max-h-full max-w-full object-contain"
		/>
	</div>
{/if}
```

**Step 2: Commit**

```bash
git add src/lib/components/ImageModal.svelte
git commit -m "feat: add ImageModal for dashboard gallery detail view"
```

---

### Task 12: MasonryTicker component

**Files:**

- Create: `src/lib/components/MasonryTicker.svelte`

**Step 1: Create the masonry ticker**

CSS `columns` masonry with continuous upward scroll animation. Pauses on hover. Each card shows thumbnail + name overlay.

```svelte
<script lang="ts">
	type GalleryImage = {
		id: string;
		participantName: string;
		imageData: string;
		featureNames: string[];
		createdAt: string;
	};

	let {
		images,
		onselect
	}: {
		images: GalleryImage[];
		onselect: (image: GalleryImage) => void;
	} = $props();

	let paused = $state(false);
	let needsScroll = $derived(images.length > 6);
</script>

<div
	class="masonry-container"
	class:scrolling={needsScroll && !paused}
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
>
	<div class="masonry-track">
		{#each images as image (image.id)}
			<button type="button" class="masonry-card" onclick={() => onselect(image)}>
				<img src={image.imageData} alt="{image.participantName}'s workspace" loading="lazy" />
				<span class="card-name">{image.participantName}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.masonry-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: 1rem;
	}

	.masonry-track {
		columns: 3;
		column-gap: 0.5rem;
		padding: 0.25rem;
	}

	@media (max-width: 768px) {
		.masonry-track {
			columns: 2;
		}
	}

	.scrolling .masonry-track {
		animation: ticker-scroll 30s linear infinite;
	}

	@keyframes ticker-scroll {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(-50%);
		}
	}

	.masonry-card {
		display: inline-block;
		width: 100%;
		margin-bottom: 0.5rem;
		border-radius: 0.75rem;
		overflow: hidden;
		position: relative;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: none;
		padding: 0;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.masonry-card:hover {
		transform: scale(1.02);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.masonry-card img {
		width: 100%;
		display: block;
		border-radius: 0.75rem;
	}

	.card-name {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.5rem 0.625rem;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		color: white;
		font-size: 0.6875rem;
		font-weight: 700;
		border-radius: 0 0 0.75rem 0.75rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.scrolling .masonry-track {
			animation: none;
		}
	}
</style>
```

**Step 2: Commit**

```bash
git add src/lib/components/MasonryTicker.svelte
git commit -m "feat: add MasonryTicker component with continuous scroll"
```

---

### Task 13: Dashboard state — add page 4 + workspace image polling

**Files:**

- Modify: `src/routes/dashboard/state.svelte.ts`

**Step 1: Update DashboardState**

Add to `DashboardState` class:

1. Change `TOTAL_PAGES` from `3` to `4`
2. Add workspace image state and polling
3. Add collective generation state

```typescript
// Change:
static readonly TOTAL_PAGES = 4;

// Add new state fields (after existing $state fields):
workspaceImages = $state.raw<{
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
		featureNames: string[];
		createdAt: string;
	}>;
}>({ individual: [], collective: [] });

collectiveImage = $state<string | null>(null);
collectivePrompt = $state<string>('');
collectiveGenerationsRemaining = $state(3);

// Add polling method:
async pollWorkspaceImages() {
	try {
		const res = await fetch('/api/workspace-images');
		if (res.ok) {
			this.workspaceImages = await res.json();
			// Update collective state from latest
			const latest = this.workspaceImages.collective[0];
			if (latest) {
				this.collectiveImage = latest.imageData;
				this.collectivePrompt = latest.prompt;
				this.collectiveGenerationsRemaining = 3 - this.workspaceImages.collective.length;
			}
		}
	} catch {
		// silently ignore
	}
}
```

**Step 2: Add page 4 metadata**

In `+page.svelte`, update `PAGE_META`:

```typescript
const PAGE_META = [
	{ title: 'Fuelling the Individual Brain', subtitle: 'Your top 3 personal priorities' },
	{ title: 'Fuelling the Collective Brain', subtitle: 'Your top 3 team priorities' },
	{ title: 'Consensus & Alignment', subtitle: 'Comparing focus areas and collective weight' },
	{ title: 'Workspace Gallery', subtitle: 'Individual and collective workspace visualisations' }
] as const;
```

**Step 3: Verify build**

Run: `bun run check`

**Step 4: Commit**

```bash
git add src/routes/dashboard/state.svelte.ts
git commit -m "feat: add page 4 state + workspace image polling to DashboardState"
```

---

### Task 14: Dashboard page 4 — gallery + collective UI

**Files:**

- Modify: `src/routes/dashboard/+page.svelte`

**Step 1: Add workspace image polling effect**

Add alongside the existing vote polling `$effect`:

```typescript
$effect(() => {
	if (!s.showResults) return;
	const interval = setInterval(() => s.pollWorkspaceImages(), 5000);
	return () => clearInterval(interval);
});
```

**Step 2: Add page 4 imports**

```typescript
import MasonryTicker from '$lib/components/MasonryTicker.svelte';
import ImageModal from '$lib/components/ImageModal.svelte';
import WorkspaceImage from '$lib/components/WorkspaceImage.svelte';
import AiLoader from '$lib/components/AiLoader.svelte';
import { Sparkles } from '@lucide/svelte';
```

**Step 3: Add page 4 state**

```typescript
let selectedImage = $state<{
	participantName: string;
	imageData: string;
	featureNames: string[];
	prompt?: string;
} | null>(null);

let collectiveGenerating = $state(false);
let collectiveProgress = $state(0);
let collectiveProgressInterval: ReturnType<typeof setInterval> | null = null;

function startCollectiveProgress() {
	collectiveProgress = 0;
	collectiveProgressInterval = setInterval(() => {
		if (collectiveProgress < 90) {
			collectiveProgress = Math.min(90, collectiveProgress + Math.random() * 20);
		}
	}, 400);
}

function stopCollectiveProgress() {
	if (collectiveProgressInterval) clearInterval(collectiveProgressInterval);
	collectiveProgress = 100;
}

async function generateCollective(additionalPrompt?: string) {
	collectiveGenerating = true;
	startCollectiveProgress();

	try {
		const res = await fetch('/api/generate-image', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type: 'collective', additionalPrompt })
		});

		if (!res.ok) throw new Error(`HTTP ${res.status}`);

		const result = await res.json();
		stopCollectiveProgress();

		s.collectiveImage = result.imageData;
		s.collectivePrompt = result.prompt;
		s.collectiveGenerationsRemaining = result.generationsRemaining;
	} catch (e) {
		console.error('Collective generation failed:', e);
	} finally {
		collectiveGenerating = false;
		stopCollectiveProgress();
	}
}
```

**Step 4: Add page 4 template**

In the `{#if s.page === 3}` block, add an `{:else if s.page === 4}` case:

```svelte
{:else if s.page === 4}
	<!-- PAGE 4 — Workspace Gallery -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
		<!-- Left: Individual gallery (60%) -->
		<div class="lg:col-span-3">
			<h3 class="mb-2 text-sm font-bold tracking-wider text-white/50 uppercase">
				Individual Workspaces
			</h3>
			{#if s.workspaceImages.individual.length === 0}
				<div class="flex h-64 items-center justify-center rounded-2xl border border-white/8 bg-white/5">
					<p class="text-sm text-white/30">No workspace images yet — participants can generate from the results page</p>
				</div>
			{:else}
				<div class="h-[60vh]">
					<MasonryTicker
						images={s.workspaceImages.individual}
						onselect={(img) => (selectedImage = img)}
					/>
				</div>
			{/if}
		</div>

		<!-- Right: Collective workspace (40%) -->
		<div class="lg:col-span-2">
			<h3 class="mb-2 text-sm font-bold tracking-wider text-white/50 uppercase">
				Collective Workspace
			</h3>
			<div class="rounded-2xl border border-white/8 bg-white/5 p-4">
				{#if collectiveGenerating}
					<AiLoader progress={collectiveProgress} message="Creating collective workspace..." dark={true} />
				{:else if s.collectiveImage}
					<WorkspaceImage
						imageData={s.collectiveImage}
						prompt={s.collectivePrompt}
						generationsRemaining={s.collectiveGenerationsRemaining}
						onregenerate={(additionalPrompt) => generateCollective(additionalPrompt)}
						dark={true}
					/>
				{:else}
					<div class="flex flex-col items-center gap-4 py-12">
						<Sparkles size={32} class="text-accent" />
						<p class="text-center text-sm text-white/50">
							Generate a workspace from the group's top-voted features
						</p>
						<button
							type="button"
							class="rounded-xl bg-gradient-to-r from-teal to-accent px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
							onclick={() => generateCollective()}
						>
							Create Workspace from Collective Votes
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
```

**Step 5: Add the modal (outside the page content, at root level)**

```svelte
{#if selectedImage}
	<ImageModal image={selectedImage} onclose={() => (selectedImage = null)} />
{/if}
```

**Step 6: Verify build**

Run: `bun run check`

**Step 7: Commit**

```bash
git add src/routes/dashboard/+page.svelte
git commit -m "feat: add dashboard page 4 with masonry gallery + collective workspace"
```

---

### Task 15: Apply migration to remote D1 + final verification

**Step 1: Run local verification**

```bash
bun run check
bun run build
```

**Step 2: Apply migration locally (if not already)**

```bash
bunx wrangler d1 execute corenet-db --local --file=migrations/0002_workspace_images.sql
```

**Step 3: Test locally**

```bash
bun run dev
```

Walk through:

1. Join session, vote both phases
2. On `/thanks`, enter name + email, click "Generate My Workspace"
3. Verify AiLoader appears with ZyetaI branding + progress
4. Verify image appears after generation
5. Test regenerate with reprompt text
6. Test download + fullscreen
7. Test prompt dropdown + copy
8. On `/dashboard`, navigate to page 4
9. Verify individual images appear in masonry grid
10. Click image → verify modal
11. Click "Create Workspace from Collective Votes" → verify generation
12. Test collective regenerate with reprompt

**Step 4: Apply migration to production D1**

```bash
bunx wrangler d1 execute corenet-db --file=migrations/0002_workspace_images.sql
```

**Step 5: Deploy**

```bash
bun run build && bunx wrangler pages deploy .svelte-kit/cloudflare
```

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final verification and cleanup"
```

---

## Task Dependency Graph

```
Task 1 (install + env) ─┐
                         ├─→ Task 3 (image generator)
Task 2 (DB schema)   ───┤
                         ├─→ Task 4 (DB queries)
                         │
                         ├─→ Task 5 (POST endpoint) ←── Task 3, Task 4
                         ├─→ Task 6 (GET endpoint)  ←── Task 4
                         │
Task 7 (AiLoader)     ──┤
Task 8 (PromptDropdown)─┤
                         ├─→ Task 9 (WorkspaceImage) ←── Task 8
                         │
                         ├─→ Task 10 (Thanks page)  ←── Task 5, Task 7, Task 9
                         │
Task 11 (ImageModal) ───┤
Task 12 (MasonryTicker)─┤
                         ├─→ Task 13 (Dashboard state)
                         ├─→ Task 14 (Dashboard page 4) ←── Task 6, Task 7, Task 9, Task 11, Task 12, Task 13
                         │
                         └─→ Task 15 (Deploy) ←── ALL
```

**Parallel opportunities:**

- Tasks 1 + 2 can run in parallel
- Tasks 7 + 8 + 11 + 12 can all run in parallel (independent components)
- Tasks 3 + 4 can run in parallel (after 1 + 2)
- Tasks 5 + 6 can run in parallel (after 3 + 4)
