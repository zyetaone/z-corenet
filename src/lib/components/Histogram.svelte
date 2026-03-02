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
			class="flex items-center gap-3 rounded-xl px-3 py-2 transition-all duration-500 {showEvidence && feature.hasEvidence ? 'bg-[var(--green)]/8' : 'bg-white/3'}"
			style={animateIn ? `animation: bar-enter 0.5s ease-out both; animation-delay: ${i * 60}ms` : ''}
		>
			<!-- Rank number -->
			<span class="w-6 text-right text-sm font-bold tabular-nums text-white/40">
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
							class="shrink-0 text-xs font-bold transition-opacity duration-500 {feature.hasEvidence ? 'text-[var(--green)]' : 'text-white/25'}"
						>
							{feature.hasEvidence ? '✓ Evidence' : '—'}
						</span>
					{/if}
				</div>
				<!-- Bar -->
				<div class="h-2 rounded-full bg-white/8 overflow-hidden">
					<div
						class="h-full rounded-full transition-all duration-700 ease-out {showEvidence && feature.hasEvidence ? 'bg-[var(--green)]' : 'bg-[var(--accent)]'}"
						style="width: {(feature.voteCount / maxVoteCount) * 100}%"
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
		:global([style*="bar-enter"]) {
			animation: none !important;
			opacity: 1;
			transform: none;
		}
	}
</style>
