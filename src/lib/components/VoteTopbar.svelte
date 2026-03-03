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
	<div class="flex min-w-0 items-center gap-3">
		<span class="shrink-0 text-2xl">{isIndividual ? '\u{1F9E0}' : '\u{1F91D}'}</span>
		<div class="min-w-0">
			<div
				class="font-display truncate text-base font-bold md:text-lg"
				style="color: {isIndividual ? 'var(--green)' : 'var(--indigo-text)'}"
			>
				{isIndividual ? 'The Individual Brain' : 'The Collective Brain'}
			</div>
			<div class="truncate text-sm font-medium text-white/60 md:text-base">
				{isIndividual ? 'Pick at least 1 from each section' : 'Now think as a team'}
			</div>
		</div>
	</div>

	<!-- Right: progress -->
	<div class="flex shrink-0 items-center gap-4">
		<!-- Section dots -->
		<div class="hidden items-center gap-1.5 sm:flex">
			{#each FEATURE_GROUPS as group (group.key)}
				<div
					class="h-2.5 w-2.5 rounded-full transition-all duration-300 {completedGroups.has(
						group.key
					)
						? isIndividual
							? 'scale-125 bg-(--green)'
							: 'scale-125 bg-(--indigo-text)'
						: 'bg-white/15'}"
					title="{group.label}{completedGroups.has(group.key) ? ' ✓' : ''}"
				></div>
			{/each}
		</div>

		<!-- Counter pill -->
		<div
			class="rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-300 {allDone
				? isIndividual
					? 'bg-(--green)/20 text-(--green)'
					: 'bg-(--indigo-text)/20 text-(--indigo-text)'
				: 'bg-white/8 text-white/60'}"
		>
			<span style="font-variant-numeric: tabular-nums">{totalPicks}</span> picks
		</div>
	</div>

	<!-- Phase accent line -->
	<div
		class="phase-accent"
		class:phase-accent--individual={isIndividual}
		class:phase-accent--communal={!isIndividual}
	></div>
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
		/* needed so .phase-accent can position relative to this element */
		isolation: isolate;
	}

	@media (min-width: 640px) {
		.vote-topbar {
			padding: 0.75rem 1.75rem;
		}
	}

	.phase-accent {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		transition: background-color 0.4s ease;
	}

	.phase-accent--individual {
		background-color: var(--green);
	}

	.phase-accent--communal {
		background-color: var(--indigo-text);
	}
</style>
