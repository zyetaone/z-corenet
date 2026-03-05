<script lang="ts">
	import CategoryIcon from './CategoryIcon.svelte';
	import EvidenceTag from './EvidenceTag.svelte';
	import type { RankedFeature } from '$lib/server/tally';
	import { useAnimateOnce } from '$lib/utils/use-animate-once.svelte';

	let {
		features
	}: {
		features: RankedFeature[];
	} = $props();

	const top3 = $derived(features.slice(0, 3));

	const medalColors = ['bg-amber-400', 'bg-slate-400', 'bg-amber-600'];
	const revealDelays = [200, 400, 600];

	// Derive card widths from percentages relative to #1
	const barWidths = $derived.by(() => {
		if (top3.length === 0) return [];
		const maxPct = top3[0].percentage || 1;
		return top3.map((f) => {
			const ratio = f.percentage / maxPct;
			// Scale between 60% and 100% so even small values are readable
			return `${Math.round(60 + ratio * 40)}%`;
		});
	});

	const anim = useAnimateOnce();
</script>

<div class="flex flex-col gap-8">
	{#each top3 as feature, i (feature.name)}
		{@const isFirst = i === 0}
		<div
			class="podium-row relative overflow-hidden rounded-2xl border bg-white shadow-lg
				{isFirst ? 'border-accent/30 shadow-accent/10' : 'border-black/5'}"
			style="width: {barWidths[i]}; {!anim.done
				? `animation: slide-in 0.5s ease-out both; animation-delay: ${revealDelays[i]}ms;`
				: ''}"
		>
			<!-- Full-card background fill -->
			<div
				class="card-fill absolute inset-0 {isFirst ? 'bg-accent/18' : 'bg-teal/12'}"
				style="--fill-width: {feature.percentage}%; animation-delay: {revealDelays[i] + 400}ms"
			></div>

			<div class="relative flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
				<!-- Medal -->
				<span
					class="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm font-extrabold text-white {medalColors[i]}"
				>
					{i + 1}
				</span>

				<!-- Icon -->
				<div class="shrink-0 {isFirst ? 'text-accent' : 'text-teal'}">
					<CategoryIcon group={feature.group} size={28} animated={true} />
				</div>

				<!-- Name + caption -->
				<div class="min-w-0 flex-1">
					<h3
						class="truncate font-display font-bold text-slate-900
							{isFirst ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}"
					>
						{feature.name}
					</h3>
					{#if feature.caption}
						<p class="mt-0.5 truncate text-xs text-slate-400 italic">{feature.caption}</p>
					{/if}
				</div>

				<!-- Percentage -->
				<div class="shrink-0 text-right">
					<span
						class="text-lg sm:text-2xl font-extrabold tabular-nums {isFirst
							? 'text-accent'
							: 'text-slate-700'}"
					>
						{Math.round(feature.percentage)}%
					</span>
				</div>

				<!-- Evidence badge -->
				<div class="shrink-0">
					<EvidenceTag hasEvidence={feature.hasEvidence} compact={true} />
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes fill-grow {
		from {
			width: 0%;
		}
		to {
			width: var(--fill-width);
		}
	}

	.card-fill {
		width: var(--fill-width);
		animation: fill-grow 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@media (prefers-reduced-motion: reduce) {
		:global([style*='slide-in']) {
			animation: none !important;
			opacity: 1;
			transform: none;
		}
		.card-fill {
			animation: none;
		}
	}
</style>
