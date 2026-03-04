<script lang="ts">
	import CategoryIcon from './CategoryIcon.svelte';
	import EvidenceTag from './EvidenceTag.svelte';
	import type { RankedFeature } from '$lib/server/tally';
	import { useAnimateOnce } from '$lib/utils/use-animate-once.svelte';
	import { Trophy } from '@lucide/svelte';

	let {
		features,
		totalCount
	}: {
		features: RankedFeature[];
		totalCount: number;
	} = $props();

	const top3 = $derived(features.slice(0, 3));
	const remaining = $derived(totalCount - top3.length);

	const medalColors = [
		'from-amber-400 to-yellow-500', // Gold — #1
		'from-slate-300 to-slate-400', // Silver — #2
		'from-amber-600 to-amber-700' // Bronze — #3
	];

	const medalLabels = ['1st', '2nd', '3rd'];

	// Desktop reveal order: #2 (400ms), #3 (600ms), #1 (900ms) — crescendo
	const revealDelays = [900, 400, 600];

	const anim = useAnimateOnce();
</script>

<div class="podium-grid">
	{#each top3 as feature, i (feature.name)}
		{@const isFirst = i === 0}
		<div
			class="podium-card rounded-3xl border bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.1)] md:p-6
				{isFirst ? 'podium-first border-accent/40' : 'border-black/5'}"
			style="{!anim.done
				? `animation: podium-reveal 0.6s ease-out both; animation-delay: ${revealDelays[i]}ms;`
				: ''} {isFirst ? 'order: 2' : i === 1 ? 'order: 1' : 'order: 3'}"
		>
			<!-- Medal badge -->
			<div class="mb-3 flex items-center gap-2">
				<span
					class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br text-sm font-extrabold text-white {medalColors[
						i
					]}"
				>
					{i + 1}
				</span>
				<span class="text-xs font-bold tracking-widest text-slate-500 uppercase">
					{medalLabels[i]}
				</span>
			</div>

			<!-- Icon -->
			<div
				class="mb-3 flex flex-col items-center gap-2 {isFirst ? 'text-accent' : 'text-slate-500'}"
			>
				<CategoryIcon group={feature.group} size={isFirst ? 40 : 32} animated={true} />
				{#if i === 0}
					<Trophy class="h-6 w-6 text-yellow-500" />
				{/if}
			</div>

			<!-- Feature name -->
			<h3
				class="mb-3 font-display leading-tight font-bold text-slate-900
					{isFirst ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}"
			>
				{feature.name}
			</h3>

			<!-- Percentage bar -->
			<div class="mb-3">
				<div class="mb-1 flex items-baseline justify-between">
					<span
						class="text-3xl font-extrabold tabular-nums {isFirst
							? 'text-accent'
							: 'text-slate-700'}"
					>
						{feature.percentage}%
					</span>
				</div>
				<div class="h-2.5 overflow-hidden rounded-full bg-black/10">
					<div
						class="h-full rounded-full transition-all duration-1000 ease-out {isFirst
							? 'bg-accent'
							: 'bg-teal'}"
						style="width: {feature.percentage}%; transition-delay: {revealDelays[i] + 300}ms"
					></div>
				</div>
			</div>

			<!-- Evidence tag + caption -->
			<EvidenceTag hasEvidence={feature.hasEvidence} />
			{#if feature.caption}
				<p class="mt-2 text-xs leading-relaxed text-slate-500 italic">
					{feature.caption}
				</p>
			{/if}
		</div>
	{/each}
</div>

{#if remaining > 0}
	<p
		class="mt-6 text-center text-sm font-medium text-white/40"
		style={!anim.done ? 'animation: podium-reveal 0.4s ease-out both; animation-delay: 1200ms' : ''}
	>
		{remaining} more features ranked below &rarr;
	</p>
{/if}

<style>
	.podium-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		align-items: center;
	}

	@media (min-width: 1024px) {
		.podium-grid {
			grid-template-columns: 1fr 1.3fr 1fr;
			align-items: end;
			gap: 1.5rem;
		}

		/* First place (order: 2, center column) gets extra height */
		.podium-first {
			box-shadow: 0 10px 40px rgba(0, 191, 165, 0.2);
			transform: translateY(-1rem);
			min-height: 360px;
		}
	}

	/* On mobile, show in natural order */
	@media (max-width: 1023px) {
		.podium-card {
			order: unset !important;
		}

		.podium-first {
			box-shadow: 0 8px 30px rgba(0, 191, 165, 0.15);
		}
	}

	@keyframes podium-reveal {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global([style*='podium-reveal']) {
			animation: none !important;
			opacity: 1;
			transform: none;
		}
	}
</style>
