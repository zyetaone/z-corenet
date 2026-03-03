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

	let hasAnimated = $state(false);

	$effect(() => {
		if (!hasAnimated) {
			const timer = setTimeout(() => {
				hasAnimated = true;
			}, 1500);
			return () => clearTimeout(timer);
		}
	});
</script>

<div class="space-y-2.5">
	{#each visibleFeatures as feature, i (feature.name)}
		<div
			class="group relative flex items-center gap-4 rounded-2xl border px-4 py-3 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg {showEvidence &&
			feature.hasEvidence
				? 'border-(--green)/20 bg-(--green)/5 hover:border-(--green)/40 hover:bg-(--green)/10'
				: 'border-[#1a2b3c]/5 bg-white/70 hover:border-[#1a2b3c]/15 hover:bg-white/95'} {i === 0
				? 'shadow-[0_0_15px_rgba(0,191,165,0.1)] ring-1 ring-(--accent)/20'
				: ''}"
			style={animateIn && !hasAnimated
				? `animation: bar-enter 0.5s ease-out both; animation-delay: ${i * 60}ms`
				: ''}
		>
			<!-- Rank number -->
			<span
				class="w-6 shrink-0 text-right text-base font-bold text-[#1a2b3c]/30 tabular-nums transition-colors group-hover:text-(--accent)"
			>
				{i + 1}.
			</span>

			<!-- Category icon -->
			<div
				class="shrink-0 text-[#1a2b3c]/50 transition-transform duration-500 group-hover:scale-110 group-hover:text-(--teal)"
			>
				<CategoryIcon group={feature.group} size={18} animated={false} />
			</div>

			<!-- Name + bar -->
			<div class="min-w-0 flex-1">
				<div class="mb-1.5 flex items-baseline justify-between gap-2">
					<span
						class="truncate text-sm font-extrabold text-[#1a2b3c]/90 transition-colors group-hover:text-[#1a2b3c] md:text-base"
						>{feature.name}</span
					>
					{#if showEvidence}
						<span
							class="shrink-0 text-xs font-bold transition-opacity duration-500 {feature.hasEvidence
								? 'text-(--green-text)'
								: 'text-[#1a2b3c]/25'}"
						>
							{feature.hasEvidence ? '✓ Evidence-Backed' : '—'}
						</span>
					{/if}
				</div>
				<!-- Bar -->
				<div
					class="relative h-2.5 overflow-hidden rounded-full bg-[#1a2b3c]/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
				>
					<div
						class="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-1000 ease-out {showEvidence &&
						feature.hasEvidence
							? 'bg-linear-to-r from-(--green) to-(--green)'
							: 'bg-linear-to-r from-(--teal) to-(--accent)'}"
						style="width: {(feature.voteCount / maxVoteCount) *
							100}%; box-shadow: inset 0 1px 1px rgba(255,255,255,0.4);"
					></div>
				</div>
			</div>

			<!-- Vote count badge -->
			<div class="flex shrink-0 flex-col items-end justify-center">
				<span class="text-xs font-bold tracking-wider text-[#1a2b3c]/40 uppercase">Votes</span>
				<span
					class="text-xl font-extrabold text-[#1a2b3c] tabular-nums transition-colors group-hover:text-(--accent)"
				>
					{feature.percentage}%
				</span>
			</div>
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
		:global([style*='bar-enter']) {
			animation: none !important;
			opacity: 1;
			transform: none;
		}
	}
</style>
