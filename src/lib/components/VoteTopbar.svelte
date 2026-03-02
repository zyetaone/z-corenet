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
					class="h-2.5 w-2.5 rounded-full transition-all duration-300 {completedGroups.has(group.key)
						? isIndividual
							? 'bg-[var(--green)] scale-125'
							: 'bg-[var(--indigo-text)] scale-125'
						: 'bg-white/15'}"
					title="{group.label}{completedGroups.has(group.key) ? ' ✓' : ''}"
				></div>
			{/each}
		</div>

		<!-- Counter pill -->
		<div
			class="rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-300 {allDone
				? isIndividual
					? 'bg-[var(--green)]/20 text-[var(--green)]'
					: 'bg-[var(--indigo-text)]/20 text-[var(--indigo-text)]'
				: 'bg-white/8 text-white/60'}"
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
