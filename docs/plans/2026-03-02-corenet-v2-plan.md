# CoreNet v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform CoreNet from a "pick 5" survey into an immersive experience with category-aware voting, animated SVG icons, particle field lobby, and facilitator-paced staged analytics.

**Architecture:** Seven tasks in dependency order. Tasks 1-3 are foundational (voting engine, topbar, icons). Task 4 (scoring/API) bridges voting to analytics. Tasks 5-7 (histogram, staged reveal, particles) build the presentation layer. Tasks 3 and 7 can run in parallel with others.

**Tech Stack:** SvelteKit 2, Svelte 5 runes, HTML Canvas, inline SVG + CSS animations, TailwindCSS v4.

---

## Task 1: Rewrite VotingEngine — Category-Aware Selection

**Files:**

- Modify: `src/lib/stores/voting.svelte.ts`
- Modify: `src/routes/vote/+page.svelte`
- Modify: `src/lib/components/FeatureGrid.svelte`
- Reference: `src/lib/data/default-features.ts` (FEATURE_GROUPS, CATEGORY_TO_GROUP)

**Step 1: Rewrite VotingEngine class**

Replace the entire contents of `src/lib/stores/voting.svelte.ts`:

```typescript
import { SvelteSet } from 'svelte/reactivity';
import type { SessionFeature } from '$lib/server/db/schema';
import { FEATURE_GROUPS, CATEGORY_TO_GROUP, type GroupKey } from '$lib/data/default-features';

const SOFT_CAP = 12;
const GROUP_COUNT = FEATURE_GROUPS.length; // 8

export class VotingEngine {
	features = $state<SessionFeature[]>([]);
	phase = $state<'individual' | 'communal'>('individual');
	selectedIndividual = new SvelteSet<number>();
	selectedCommunal = new SvelteSet<number>();
	freeText = $state('');
	isSubmitting = $state(false);
	error = $state('');

	readonly currentSelection = $derived(
		this.phase === 'individual' ? this.selectedIndividual : this.selectedCommunal
	);

	readonly count = $derived(this.currentSelection.size);

	readonly availableFeatures = $derived(
		this.phase === 'communal'
			? this.features.filter((f) => !this.selectedIndividual.has(f.featureId))
			: this.features
	);

	// Map featureId -> group key for quick lookup
	private readonly featureGroupMap = $derived(
		new Map(
			this.features.map((f) => [
				f.featureId,
				(CATEGORY_TO_GROUP[f.category] ?? f.category) as GroupKey
			])
		)
	);

	// Which groups have at least one pick in the current phase
	readonly completedGroups = $derived(() => {
		const groups = new Set<GroupKey>();
		for (const id of this.currentSelection) {
			const group = this.featureGroupMap.get(id);
			if (group) groups.add(group);
		}
		return groups;
	});

	readonly completedGroupCount = $derived(this.completedGroups().size);

	readonly allGroupsCovered = $derived(this.completedGroupCount === GROUP_COUNT);

	readonly atSoftCap = $derived(this.count >= SOFT_CAP);

	readonly canContinue = $derived(this.allGroupsCovered);

	readonly buttonText = $derived(
		this.allGroupsCovered
			? this.phase === 'individual'
				? 'Continue →'
				: 'Submit & See Results →'
			: `${this.completedGroupCount} of ${GROUP_COUNT} sections`
	);

	constructor(features: SessionFeature[]) {
		this.features = features;
	}

	toggle(featureId: number) {
		const sel = this.currentSelection;
		if (sel.has(featureId)) {
			sel.delete(featureId);
		} else if (!this.atSoftCap) {
			sel.add(featureId);
		}
	}

	isGroupComplete(groupKey: GroupKey): boolean {
		return this.completedGroups().has(groupKey);
	}

	advancePhase() {
		if (this.phase === 'individual' && this.allGroupsCovered) {
			this.phase = 'communal';
		}
	}
}
```

**Step 2: Update vote page**

In `src/routes/vote/+page.svelte`, update the `disabledIds` derived to use soft cap instead of hard 5:

```typescript
// Replace the existing disabledIds derived (lines 14-22)
let disabledIds = $derived(
	engine.atSoftCap
		? new Set(
				engine.features
					.filter((f) => !engine.currentSelection.has(f.featureId))
					.map((f) => f.featureId)
			)
		: new Set<number>()
);
```

Also pass `engine` to FeatureGrid so it can check group completion:

```svelte
<FeatureGrid
	features={displayFeatures}
	selectedIds={engine.currentSelection}
	{disabledIds}
	{usedIds}
	phase={engine.phase}
	ontoggle={(id) => engine.toggle(id)}
	completedGroups={engine.completedGroups()}
/>
```

**Step 3: Update FeatureGrid to show section checkmarks**

In `src/lib/components/FeatureGrid.svelte`, add `completedGroups` prop and render checkmarks on group headers:

```svelte
<script lang="ts">
	import type { SessionFeature } from '$lib/server/db/schema';
	import { FEATURE_GROUPS, CATEGORY_TO_GROUP, type GroupKey } from '$lib/data/default-features';
	import FeatureCard from './FeatureCard.svelte';
	import { fly } from 'svelte/transition';

	let {
		features,
		selectedIds,
		disabledIds,
		usedIds,
		phase,
		ontoggle,
		completedGroups
	}: {
		features: SessionFeature[];
		selectedIds: Set<number>;
		disabledIds: Set<number>;
		usedIds: Set<number>;
		phase: 'individual' | 'communal';
		ontoggle: (featureId: number) => void;
		completedGroups: Set<GroupKey>;
	} = $props();

	let grouped = $derived(
		FEATURE_GROUPS.map((group) => ({
			...group,
			features: features.filter(
				(f) => (CATEGORY_TO_GROUP[f.category] ?? f.category) === group.key
			)
		})).filter((g) => g.features.length > 0)
	);
</script>

<div class="space-y-8">
	{#each grouped as group, i (group.key)}
		<div
			in:fly={{ y: 20, duration: 600, delay: i * 100 }}
			class="rounded-3xl border border-white/5 bg-white/5 p-5 shadow-sm sm:p-6"
		>
			<div class="mb-5 flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-2xl text-xl shadow-inner backdrop-blur-md transition-colors duration-300"
					class:bg-white/10={!completedGroups.has(group.key)}
					class:bg-[var(--green)]/15={completedGroups.has(group.key) && phase === 'individual'}
					class:bg-[var(--indigo-text)]/15={completedGroups.has(group.key) && phase === 'communal'}
				>
					{#if completedGroups.has(group.key)}
						<svg class="h-5 w-5 text-[var(--green)]" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
					{:else}
						{group.icon}
					{/if}
				</div>
				<h3 class="font-display text-base font-bold tracking-wide text-white/90 uppercase">
					{group.label}
				</h3>
			</div>

			<div class="grid gap-3.5 sm:gap-2.5" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
				{#each group.features as feature, j (feature.id)}
					<div in:fly={{ y: 10, duration: 400, delay: i * 100 + j * 50 }}>
						<FeatureCard
							{feature}
							selected={selectedIds.has(feature.featureId)}
							disabled={disabledIds.has(feature.featureId)}
							used={usedIds.has(feature.featureId)}
							{phase}
							onclick={() => ontoggle(feature.featureId)}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
```

**Step 4: Verify**

Run: `bun run check`
Expected: 0 errors, 0 warnings

**Step 5: Commit**

```bash
git add src/lib/stores/voting.svelte.ts src/routes/vote/+page.svelte src/lib/components/FeatureGrid.svelte
git commit -m "feat: category-aware voting — pick from each section, soft cap 12"
```

---

## Task 2: Unified Topbar (merge VoteTopbar + PhaseBanner)

**Files:**

- Rewrite: `src/lib/components/VoteTopbar.svelte`
- Delete: `src/lib/components/PhaseBanner.svelte`
- Modify: `src/routes/vote/+page.svelte` (remove PhaseBanner import)

**Step 1: Rewrite VoteTopbar**

Replace the entire contents of `src/lib/components/VoteTopbar.svelte`. The new topbar replaces AWA branding with phase context during voting:

```svelte
<script lang="ts">
	import type { GroupKey } from '$lib/data/default-features';
	import { FEATURE_GROUPS } from '$lib/data/default-features';

	let {
		phase,
		completedGroups,
		totalPicks
	}: {
		phase: 'individual' | 'communal';
		completedGroups: Set<GroupKey>;
		totalPicks: number;
	} = $props();

	const isIndividual = $derived(phase === 'individual');
	const allDone = $derived(completedGroups.size === FEATURE_GROUPS.length);
</script>

<header class="vote-topbar">
	<!-- Left: phase context -->
	<div class="flex items-center gap-3 min-w-0">
		<span class="text-2xl shrink-0">{isIndividual ? '\u{1F9E0}' : '\u{1F91D}'}</span>
		<div class="min-w-0">
			<div
				class="font-display text-base font-bold truncate md:text-lg"
				class:text-[var(--green)]={isIndividual}
				class:text-[var(--indigo-text)]={!isIndividual}
			>
				{isIndividual ? 'The Individual Brain' : 'The Collective Brain'}
			</div>
			<div class="text-xs text-white/45 truncate">
				{isIndividual ? 'Pick from each section below' : 'Now think as a team'}
			</div>
		</div>
	</div>

	<!-- Right: progress -->
	<div class="flex items-center gap-4 shrink-0">
		<!-- Section dots -->
		<div class="hidden sm:flex items-center gap-1.5">
			{#each FEATURE_GROUPS as group (group.key)}
				<div
					class="h-2.5 w-2.5 rounded-full transition-all duration-300"
					class:bg-white/15={!completedGroups.has(group.key)}
					class:bg-[var(--green)]={completedGroups.has(group.key) && isIndividual}
					class:bg-[var(--indigo-text)]={completedGroups.has(group.key) && !isIndividual}
					class:scale-125={completedGroups.has(group.key)}
					title="{group.label}{completedGroups.has(group.key) ? ' ✓' : ''}"
				></div>
			{/each}
		</div>

		<!-- Counter pill -->
		<div
			class="rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-300"
			class:bg-white/8={!allDone}
			class:text-white/60={!allDone}
			class:bg-[var(--green)]/20={allDone && isIndividual}
			class:text-[var(--green)]={allDone && isIndividual}
			class:bg-[var(--indigo-text)]/20={allDone && !isIndividual}
			class:text-[var(--indigo-text)]={allDone && !isIndividual}
		>
			<span style="font-variant-numeric: tabular-nums">{totalPicks}</span> picks
		</div>
	</div>
</header>

<style>
	.vote-topbar {
		background: rgba(15, 25, 35, 0.85);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		position: sticky;
		top: 0;
		z-index: 50;
		box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
	}

	@media (min-width: 640px) {
		.vote-topbar {
			padding: 0.75rem 1.75rem;
		}
	}
</style>
```

**Step 2: Update vote page**

In `src/routes/vote/+page.svelte`:

- Remove the PhaseBanner import and usage
- Update VoteTopbar props:

```svelte
<!-- Remove this line: -->
<!-- import PhaseBanner from '$lib/components/PhaseBanner.svelte'; -->

<!-- Remove this line from template: -->
<!-- <PhaseBanner phase={engine.phase} /> -->

<!-- Update VoteTopbar: -->
<VoteTopbar
	phase={engine.phase}
	completedGroups={engine.completedGroups()}
	totalPicks={engine.count}
/>
```

**Step 3: Delete PhaseBanner**

Delete `src/lib/components/PhaseBanner.svelte` entirely.

**Step 4: Verify**

Run: `bun run check`
Expected: 0 errors, 0 warnings

**Step 5: Commit**

```bash
git add src/lib/components/VoteTopbar.svelte src/routes/vote/+page.svelte
git rm src/lib/components/PhaseBanner.svelte
git commit -m "feat: unified topbar — phase context replaces AWA branding during voting"
```

---

## Task 3: Custom Animated SVG Category Icons

**Files:**

- Create: `src/lib/components/icons/LightIcon.svelte`
- Create: `src/lib/components/icons/AirIcon.svelte`
- Create: `src/lib/components/icons/AcousticIcon.svelte`
- Create: `src/lib/components/icons/BiophilicIcon.svelte`
- Create: `src/lib/components/icons/WellnessIcon.svelte`
- Create: `src/lib/components/icons/TechIcon.svelte`
- Create: `src/lib/components/icons/SocialIcon.svelte`
- Create: `src/lib/components/icons/FurnitureIcon.svelte`
- Create: `src/lib/components/CategoryIcon.svelte`
- Modify: `src/lib/components/FeatureCard.svelte` (use CategoryIcon instead of emoji)
- Modify: `src/lib/components/FeatureGrid.svelte` (use CategoryIcon in group headers)

**Step 1: Create icon components**

Create `src/lib/components/icons/LightIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<!-- Central circle -->
	<circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9" />
	<!-- Rays -->
	{#each [0, 45, 90, 135, 180, 225, 270, 315] as angle}
		<line
			x1={12 + 6.5 * Math.cos((angle * Math.PI) / 180)}
			y1={12 + 6.5 * Math.sin((angle * Math.PI) / 180)}
			x2={12 + 9 * Math.cos((angle * Math.PI) / 180)}
			y2={12 + 9 * Math.sin((angle * Math.PI) / 180)}
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			class:ray-animated={animated}
			style="--ray-delay: {angle / 360}s"
		/>
	{/each}
</svg>

<style>
	.ray-animated {
		animation: ray-pulse 3s ease-in-out infinite;
		animation-delay: var(--ray-delay);
	}
	@keyframes ray-pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ray-animated {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
```

Create `src/lib/components/icons/AirIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<path
		d="M3 8h12a3 3 0 100-3"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		class:flow={animated}
		style="--flow-delay: 0s"
	/>
	<path
		d="M3 12h16a3 3 0 110 3"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		class:flow={animated}
		style="--flow-delay: 0.3s"
	/>
	<path
		d="M3 16h10a3 3 0 100 3"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		class:flow={animated}
		style="--flow-delay: 0.6s"
	/>
</svg>

<style>
	.flow {
		animation: wind-flow 4s ease-in-out infinite;
		animation-delay: var(--flow-delay);
	}
	@keyframes wind-flow {
		0%,
		100% {
			opacity: 0.4;
			transform: translateX(0);
		}
		50% {
			opacity: 1;
			transform: translateX(2px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.flow {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
```

Create `src/lib/components/icons/AcousticIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<circle cx="12" cy="12" r="2" fill="currentColor" />
	<circle
		cx="12"
		cy="12"
		r="5"
		stroke="currentColor"
		stroke-width="1.5"
		fill="none"
		class:ring={animated}
		style="--ring-delay: 0s"
	/>
	<circle
		cx="12"
		cy="12"
		r="8"
		stroke="currentColor"
		stroke-width="1.5"
		fill="none"
		class:ring={animated}
		style="--ring-delay: 0.4s"
	/>
	<circle
		cx="12"
		cy="12"
		r="11"
		stroke="currentColor"
		stroke-width="1"
		fill="none"
		class:ring={animated}
		style="--ring-delay: 0.8s"
	/>
</svg>

<style>
	.ring {
		animation: ring-expand 3s ease-out infinite;
		animation-delay: var(--ring-delay);
	}
	@keyframes ring-expand {
		0% {
			opacity: 0.8;
			transform-origin: center;
			transform: scale(0.95);
		}
		100% {
			opacity: 0;
			transform-origin: center;
			transform: scale(1.15);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ring {
			animation: none;
			opacity: 0.4;
		}
	}
</style>
```

Create `src/lib/components/icons/BiophilicIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<!-- Stem -->
	<path d="M12 22V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	<!-- Leaf -->
	<path
		d="M12 10C12 10 7 4 4 5C1 6 3 12 12 10Z"
		fill="currentColor"
		opacity="0.8"
		class:sway={animated}
	/>
	<path
		d="M12 14C12 14 17 8 20 9C23 10 21 16 12 14Z"
		fill="currentColor"
		opacity="0.6"
		class:sway-reverse={animated}
	/>
</svg>

<style>
	.sway {
		animation: leaf-sway 4s ease-in-out infinite;
		transform-origin: 12px 10px;
	}
	.sway-reverse {
		animation: leaf-sway-reverse 4.5s ease-in-out infinite;
		transform-origin: 12px 14px;
	}
	@keyframes leaf-sway {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(3deg);
		}
	}
	@keyframes leaf-sway-reverse {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(-2deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sway,
		.sway-reverse {
			animation: none;
		}
	}
</style>
```

Create `src/lib/components/icons/WellnessIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<!-- Head -->
	<circle cx="12" cy="5" r="2.5" fill="currentColor" opacity="0.9" />
	<!-- Body -->
	<path d="M12 8v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	<!-- Arms -->
	<path
		d="M8 10l4 2 4-2"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class:stretch={animated}
	/>
	<!-- Legs -->
	<path d="M12 13l-3 6M12 13l3 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>

<style>
	.stretch {
		animation: arm-stretch 3.5s ease-in-out infinite;
		transform-origin: 12px 10px;
	}
	@keyframes arm-stretch {
		0%,
		100% {
			transform: scaleY(1);
		}
		50% {
			transform: scaleY(1.1) translateY(-1px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.stretch {
			animation: none;
		}
	}
</style>
```

Create `src/lib/components/icons/TechIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<!-- Nodes -->
	<circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.7" />
	<circle cx="18" cy="6" r="2" fill="currentColor" opacity="0.7" />
	<circle cx="12" cy="12" r="2.5" fill="currentColor" />
	<circle cx="6" cy="18" r="2" fill="currentColor" opacity="0.7" />
	<circle cx="18" cy="18" r="2" fill="currentColor" opacity="0.7" />
	<!-- Connections -->
	<line
		x1="8"
		y1="7"
		x2="10"
		y2="11"
		stroke="currentColor"
		stroke-width="1"
		class:pulse-line={animated}
		style="--line-delay: 0s"
	/>
	<line
		x1="16"
		y1="7"
		x2="14"
		y2="11"
		stroke="currentColor"
		stroke-width="1"
		class:pulse-line={animated}
		style="--line-delay: 0.2s"
	/>
	<line
		x1="8"
		y1="17"
		x2="10"
		y2="13"
		stroke="currentColor"
		stroke-width="1"
		class:pulse-line={animated}
		style="--line-delay: 0.4s"
	/>
	<line
		x1="16"
		y1="17"
		x2="14"
		y2="13"
		stroke="currentColor"
		stroke-width="1"
		class:pulse-line={animated}
		style="--line-delay: 0.6s"
	/>
</svg>

<style>
	.pulse-line {
		animation: line-pulse 2.5s ease-in-out infinite;
		animation-delay: var(--line-delay);
	}
	@keyframes line-pulse {
		0%,
		100% {
			opacity: 0.2;
		}
		50% {
			opacity: 0.8;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pulse-line {
			animation: none;
			opacity: 0.5;
		}
	}
</style>
```

Create `src/lib/components/icons/SocialIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<!-- Person left -->
	<circle cx="8" cy="7" r="2.5" fill="currentColor" opacity="0.8" />
	<path d="M4 17c0-2.2 1.8-4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	<!-- Person right -->
	<circle cx="16" cy="7" r="2.5" fill="currentColor" opacity="0.8" />
	<path d="M20 17c0-2.2-1.8-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	<!-- Connection arc -->
	<path
		d="M8 13c1.5-1 6.5-1 8 0"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		class:reach={animated}
	/>
</svg>

<style>
	.reach {
		animation: reach-connect 3s ease-in-out infinite;
		transform-origin: center;
	}
	@keyframes reach-connect {
		0%,
		100% {
			opacity: 0.3;
			transform: scaleX(0.9);
		}
		50% {
			opacity: 0.9;
			transform: scaleX(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.reach {
			animation: none;
			opacity: 0.6;
		}
	}
</style>
```

Create `src/lib/components/icons/FurnitureIcon.svelte`:

```svelte
<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	class="category-icon"
	class:subtle-shift={animated}
>
	<!-- Desk top -->
	<rect x="3" y="10" width="18" height="2" rx="1" fill="currentColor" opacity="0.9" />
	<!-- Legs -->
	<rect x="5" y="12" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.6" />
	<rect x="17" y="12" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.6" />
	<!-- Monitor -->
	<rect
		x="9"
		y="4"
		width="6"
		height="5"
		rx="1"
		stroke="currentColor"
		stroke-width="1.5"
		fill="none"
	/>
	<line x1="12" y1="9" x2="12" y2="10" stroke="currentColor" stroke-width="1.5" />
</svg>

<style>
	.subtle-shift {
		animation: desk-settle 5s ease-in-out infinite;
	}
	@keyframes desk-settle {
		0%,
		100% {
			transform: perspective(200px) rotateY(0deg);
		}
		50% {
			transform: perspective(200px) rotateY(1.5deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.subtle-shift {
			animation: none;
		}
	}
</style>
```

**Step 2: Create CategoryIcon dispatcher**

Create `src/lib/components/CategoryIcon.svelte`:

```svelte
<script lang="ts">
	import type { GroupKey } from '$lib/data/default-features';
	import LightIcon from './icons/LightIcon.svelte';
	import AirIcon from './icons/AirIcon.svelte';
	import AcousticIcon from './icons/AcousticIcon.svelte';
	import BiophilicIcon from './icons/BiophilicIcon.svelte';
	import WellnessIcon from './icons/WellnessIcon.svelte';
	import TechIcon from './icons/TechIcon.svelte';
	import SocialIcon from './icons/SocialIcon.svelte';
	import FurnitureIcon from './icons/FurnitureIcon.svelte';

	let {
		group,
		size = 24,
		animated = true
	}: {
		group: GroupKey | string;
		size?: number;
		animated?: boolean;
	} = $props();
</script>

{#if group === 'light'}
	<LightIcon {size} {animated} />
{:else if group === 'air'}
	<AirIcon {size} {animated} />
{:else if group === 'acoustic'}
	<AcousticIcon {size} {animated} />
{:else if group === 'biophilic'}
	<BiophilicIcon {size} {animated} />
{:else if group === 'wellness'}
	<WellnessIcon {size} {animated} />
{:else if group === 'tech'}
	<TechIcon {size} {animated} />
{:else if group === 'social'}
	<SocialIcon {size} {animated} />
{:else if group === 'furniture'}
	<FurnitureIcon {size} {animated} />
{:else}
	<!-- Fallback dot -->
	<svg width={size} height={size} viewBox="0 0 24 24"
		><circle cx="12" cy="12" r="4" fill="currentColor" /></svg
	>
{/if}
```

**Step 3: Integrate into FeatureCard and FeatureGrid**

In `src/lib/components/FeatureCard.svelte`:

- Replace `import { CATEGORY_ICONS } from '$lib/data/icons'` with `import CategoryIcon from './CategoryIcon.svelte'`
- Replace `import { CATEGORY_TO_GROUP } from '$lib/data/default-features'`
- Replace the emoji icon span with `<CategoryIcon group={CATEGORY_TO_GROUP[feature.category] ?? feature.category} size={22} animated={!disabled && !used} />`
- Remove the `let icon = $derived(...)` line

In `src/lib/components/FeatureGrid.svelte`:

- Import `CategoryIcon` and replace `{group.icon}` emoji with `<CategoryIcon group={group.key} size={22} />`

**Step 4: Verify**

Run: `bun run check`
Expected: 0 errors, 0 warnings

**Step 5: Commit**

```bash
git add src/lib/components/icons/ src/lib/components/CategoryIcon.svelte src/lib/components/FeatureCard.svelte src/lib/components/FeatureGrid.svelte
git commit -m "feat: custom animated SVG category icons replace emoji"
```

---

## Task 4: Scoring Logic + API Changes

**Files:**

- Modify: `src/lib/server/tally.ts` (new scoring model, return all features)
- Modify: `src/routes/api/votes/+server.ts` (no changes needed — passthrough)
- Modify: `src/routes/dashboard/+page.server.ts` (no changes needed — passthrough)

**Step 1: Rewrite tally.ts scoring**

The key changes:

1. Return ALL features with vote counts (not just top 5)
2. Score = evidence ratio (% of picks that were evidence-based) instead of count-of-5
3. Add `group` field to each ranked feature for the histogram

Update the interfaces and `buildPhaseResult` in `src/lib/server/tally.ts`:

```typescript
// Updated interfaces
export interface RankedFeature {
	name: string;
	category: string;
	group: string;
	hasEvidence: boolean;
	caption: string | null;
	voteCount: number;
	percentage: number;
}

export interface PhaseResult {
	score: number; // evidence ratio 0-100
	totalPicks: number; // total votes cast across all participants
	evidencePicks: number; // votes that went to evidence-based features
	features: RankedFeature[]; // ALL features sorted by vote count desc
}
```

Update `buildPhaseResult`:

```typescript
function buildPhaseResult(
	phase: string,
	tallies: Array<{ featureId: number; phase: string; voteCount: number }>,
	featuresMap: Map<
		number,
		{ name: string; category: string; group: string; hasEvidence: boolean; caption: string | null }
	>,
	participantCount: number
): PhaseResult {
	const phaseTallies = tallies
		.filter((t) => t.phase === phase)
		.sort((a, b) => b.voteCount - a.voteCount);

	const features: RankedFeature[] = phaseTallies.map((t) => {
		const feature = featuresMap.get(t.featureId);
		return {
			name: feature?.name ?? 'Unknown',
			category: feature?.category ?? 'unknown',
			group: feature?.group ?? 'unknown',
			hasEvidence: feature?.hasEvidence ?? false,
			caption: feature?.caption ?? null,
			voteCount: t.voteCount,
			percentage: participantCount > 0 ? Math.round((t.voteCount / participantCount) * 100) : 0
		};
	});

	const totalPicks = phaseTallies.reduce((sum, t) => sum + t.voteCount, 0);
	const evidencePicks = phaseTallies
		.filter((t) => featuresMap.get(t.featureId)?.hasEvidence)
		.reduce((sum, t) => sum + t.voteCount, 0);
	const score = totalPicks > 0 ? Math.round((evidencePicks / totalPicks) * 100) : 0;

	return { score, totalPicks, evidencePicks, features };
}
```

Also update the `featuresMap` construction to include `group`:

```typescript
const featuresMap = new Map(
	sessionFeatures.map((f) => [
		f.featureId,
		{
			name: f.name,
			category: f.category,
			group: (f as any).group ?? f.category, // group field from sessionFeatures
			hasEvidence: f.hasEvidence,
			caption: f.caption
		}
	])
);
```

**Note:** The `sessionFeatures` table may not have a `group` column. If not, derive it at tally time using `CATEGORY_TO_GROUP`:

```typescript
import { CATEGORY_TO_GROUP } from '$lib/data/default-features';

// In the featuresMap:
group: CATEGORY_TO_GROUP[f.category] ?? f.category,
```

**Step 2: Verify**

Run: `bun run check`
Expected: 0 errors, 0 warnings

**Step 3: Commit**

```bash
git add src/lib/server/tally.ts
git commit -m "feat: evidence ratio scoring — return all features with vote counts"
```

---

## Task 5: Histogram Component

**Files:**

- Create: `src/lib/components/Histogram.svelte`

**Step 1: Build the animated histogram**

This component renders a horizontal bar chart of features ranked by vote count. It supports progressive reveal (showing/hiding evidence markers).

Create `src/lib/components/Histogram.svelte`:

```svelte
<script lang="ts">
	import CategoryIcon from './CategoryIcon.svelte';
	import type { RankedFeature } from '$lib/server/tally';

	let {
		features,
		showEvidence = false,
		maxBars = 15,
		animateIn = false
	}: {
		features: RankedFeature[];
		showEvidence?: boolean;
		maxBars?: number;
		animateIn?: boolean;
	} = $props();

	const maxVoteCount = $derived(
		features.length > 0 ? Math.max(...features.map((f) => f.voteCount)) : 1
	);

	const visibleFeatures = $derived(features.slice(0, maxBars));
</script>

<div class="space-y-2.5">
	{#each visibleFeatures as feature, i (feature.name)}
		<div
			class="flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-500"
			class:bg-[var(--green)]/8={showEvidence && feature.hasEvidence}
			class:bg-white/3={!showEvidence || !feature.hasEvidence}
			style={animateIn ? `animation: bar-enter 0.5s ease-out both; animation-delay: ${i * 60}ms` : ''}
		>
			<!-- Rank number -->
			<span
				class="w-6 text-right text-sm font-bold tabular-nums text-white/40"
			>
				{i + 1}
			</span>

			<!-- Category icon -->
			<div class="shrink-0 text-white/60">
				<CategoryIcon group={feature.group} size={18} animated={false} />
			</div>

			<!-- Name + bar -->
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<span class="text-sm font-semibold text-white truncate">{feature.name}</span>
					{#if showEvidence}
						<span
							class="shrink-0 text-xs font-bold transition-opacity duration-500"
							class:text-[var(--green)]={feature.hasEvidence}
							class:text-white/25={!feature.hasEvidence}
						>
							{feature.hasEvidence ? '✓ Evidence' : '—'}
						</span>
					{/if}
				</div>
				<!-- Bar -->
				<div class="h-2 rounded-full bg-white/8 overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-700 ease-out"
						class:bg-[var(--green)]={showEvidence && feature.hasEvidence}
						class:bg-[var(--accent)]={!showEvidence || !feature.hasEvidence}
						style="width: {animateIn ? (feature.voteCount / maxVoteCount) * 100 : 0}%"
					></div>
				</div>
			</div>

			<!-- Vote count -->
			<span class="shrink-0 text-sm font-bold tabular-nums text-white/60">
				{feature.percentage}%
			</span>
		</div>
	{/each}
</div>

<style>
	@keyframes bar-enter {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		div[style*="bar-enter"] {
			animation: none !important;
			opacity: 1;
			transform: none;
		}
	}
</style>
```

**Step 2: Verify**

Run: `bun run check`
Expected: 0 errors, 0 warnings

**Step 3: Commit**

```bash
git add src/lib/components/Histogram.svelte
git commit -m "feat: animated histogram component for analytics reveal"
```

---

## Task 6: Staged Analytics Reveal

**Files:**

- Create: `src/lib/components/StageNav.svelte`
- Major rewrite: `src/routes/dashboard/+page.svelte`

**Step 1: Create StageNav component**

Create `src/lib/components/StageNav.svelte`:

```svelte
<script lang="ts">
	let {
		currentStage,
		totalStages,
		onprev,
		onnext
	}: {
		currentStage: number;
		totalStages: number;
		onprev: () => void;
		onnext: () => void;
	} = $props();
</script>

<nav class="flex items-center justify-center gap-6 py-6" aria-label="Analytics stages">
	<button
		type="button"
		class="rounded-full border border-white/10 bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-default"
		disabled={currentStage === 0}
		onclick={onprev}
		aria-label="Previous stage"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
		</svg>
	</button>

	<!-- Progress dots -->
	<div class="flex items-center gap-2">
		{#each Array(totalStages) as _, i}
			<div
				class="h-2.5 rounded-full transition-all duration-300"
				class:w-2.5={i !== currentStage}
				class:w-8={i === currentStage}
				class:bg-white/15={i !== currentStage}
				class:bg-[var(--accent)]={i === currentStage}
			></div>
		{/each}
	</div>

	<button
		type="button"
		class="rounded-full border border-white/10 bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-default"
		disabled={currentStage === totalStages - 1}
		onclick={onnext}
		aria-label="Next stage"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
	</button>
</nav>
```

**Step 2: Rewrite dashboard with staged reveal**

Rewrite `src/routes/dashboard/+page.svelte` to implement the 4-stage state machine. The key changes:

- Add `stage` state (0-3) alongside `showResults`
- Stage 0: "What You Chose" — combined histogram, no evidence
- Stage 1: "What The Evidence Says" — evidence markers appear
- Stage 2: "Individual vs Collective" — split into two histograms
- Stage 3: "What This Means" — interpretation + next steps + research
- Keyboard navigation (ArrowLeft/ArrowRight)
- Retain the lobby state (unchanged)
- Retain particle field from user's current code
- Retain ResetButton functionality

The analytics section template should be structured as:

```svelte
{#if showResults}
	<!-- Stage title -->
	<!-- Stage content (conditional on stage number) -->
	<!-- StageNav at bottom -->
{/if}
```

Stage titles: `['What You Chose', 'What The Evidence Says', 'Individual vs Collective', 'What This Means']`

Import `Histogram` and `StageNav`. Use `onMount` to add keyboard listener. On `handleReset`, reset `stage` to 0.

The combined histogram (stages 0-1) shows all features from both phases merged and sorted by total vote count. Stage 2 shows two separate `Histogram` components side by side.

**Step 3: Verify**

Run: `bun run check`
Expected: 0 errors, 0 warnings

**Step 4: Commit**

```bash
git add src/lib/components/StageNav.svelte src/routes/dashboard/+page.svelte
git commit -m "feat: 4-stage facilitator-paced analytics reveal"
```

---

## Task 7: Particle Field (Lobby Background)

**Files:**

- Create: `src/lib/components/ParticleField.svelte`
- Modify: `src/routes/dashboard/+page.svelte` (replace current particle divs with canvas)

**Step 1: Create ParticleField canvas component**

Create `src/lib/components/ParticleField.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';

	let {
		participantCount = 0,
		phase = 'individual'
	}: {
		participantCount?: number;
		phase?: 'individual' | 'communal';
	} = $props();

	let canvas: HTMLCanvasElement;
	let animationId: number;

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
	}

	let particles: Particle[] = [];
	const MAX_PARTICLES = 50;
	const CONNECTION_DISTANCE = 120;

	function spawnParticle(w: number, h: number): Particle {
		return {
			x: Math.random() * w,
			y: Math.random() * h,
			vx: (Math.random() - 0.5) * 0.5,
			vy: (Math.random() - 0.5) * 0.5,
			radius: 3 + Math.random() * 4
		};
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Check reduced motion
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		function resize() {
			canvas.width = canvas.offsetWidth * devicePixelRatio;
			canvas.height = canvas.offsetHeight * devicePixelRatio;
			ctx!.scale(devicePixelRatio, devicePixelRatio);
		}
		resize();
		window.addEventListener('resize', resize);

		function animate() {
			if (!ctx) return;
			const w = canvas.offsetWidth;
			const h = canvas.offsetHeight;

			// Sync particle count to participantCount
			const target = Math.min(participantCount * 3, MAX_PARTICLES);
			while (particles.length < target) {
				particles.push(spawnParticle(w, h));
			}

			ctx.clearRect(0, 0, w, h);

			// Update and draw particles
			for (const p of particles) {
				if (!reduceMotion) {
					p.x += p.vx;
					p.y += p.vy;

					// Bounce off edges
					if (p.x < 0 || p.x > w) p.vx *= -1;
					if (p.y < 0 || p.y > h) p.vy *= -1;

					// Collective mode: gentle pull toward center
					if (phase === 'communal') {
						p.vx += (w / 2 - p.x) * 0.0001;
						p.vy += (h / 2 - p.y) * 0.0001;
					}
				}

				// Draw particle
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(0, 191, 165, 0.15)';
				ctx.fill();
			}

			// Draw connections in collective mode
			if (phase === 'communal' && !reduceMotion) {
				ctx.strokeStyle = 'rgba(0, 191, 165, 0.06)';
				ctx.lineWidth = 1;
				for (let i = 0; i < particles.length; i++) {
					for (let j = i + 1; j < particles.length; j++) {
						const dx = particles[i].x - particles[j].x;
						const dy = particles[i].y - particles[j].y;
						const dist = Math.sqrt(dx * dx + dy * dy);
						if (dist < CONNECTION_DISTANCE) {
							ctx.globalAlpha = 1 - dist / CONNECTION_DISTANCE;
							ctx.beginPath();
							ctx.moveTo(particles[i].x, particles[i].y);
							ctx.lineTo(particles[j].x, particles[j].y);
							ctx.stroke();
						}
					}
				}
				ctx.globalAlpha = 1;
			}

			animationId = requestAnimationFrame(animate);
		}

		animate();

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="pointer-events-none fixed inset-0 z-0 h-full w-full"
	aria-hidden="true"
></canvas>
```

**Step 2: Integrate into dashboard**

In `src/routes/dashboard/+page.svelte`, replace the existing div-based particle system with:

```svelte
import ParticleField from '$lib/components/ParticleField.svelte';

<!-- In the lobby section, before the main content: -->
{#if !showResults}
	<ParticleField participantCount={results.participantCount} phase="individual" />
{/if}
```

Remove the existing `particles` state, `$effect` for particle generation, and the `{#each particles}` template block.

**Step 3: Verify**

Run: `bun run check`
Expected: 0 errors, 0 warnings

**Step 4: Build and deploy**

Run: `bun run build && bunx wrangler deploy`
Expected: successful deployment

**Step 5: Commit**

```bash
git add src/lib/components/ParticleField.svelte src/routes/dashboard/+page.svelte
git commit -m "feat: canvas particle field for dashboard lobby"
```

---

## Execution Order & Dependencies

```
Task 1 (VotingEngine) ──→ Task 2 (Topbar) ──→ Task 4 (Scoring)
                     ╲                                    ↓
                      ╲──→ Task 3 (Icons) ──→ Task 5 (Histogram) ──→ Task 6 (Staged Reveal)
                                                                            ↑
                                              Task 7 (Particles) ──────────╯
```

- Tasks 2 and 3 can run in parallel after Task 1
- Task 7 can run in parallel with Tasks 5-6
- Task 6 depends on Tasks 4 and 5
