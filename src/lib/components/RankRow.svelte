<script lang="ts">
	import EvidenceTag from './EvidenceTag.svelte';
	import { CATEGORY_ICONS } from '$lib/data/icons';

	let {
		rank,
		name,
		category,
		hasEvidence,
		caption,
		percentage,
		type
	}: {
		rank: number;
		name: string;
		category: string;
		hasEvidence: boolean;
		caption: string | null;
		percentage: number;
		type: 'individual' | 'communal';
	} = $props();

	let barEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (barEl) {
			requestAnimationFrame(() => {
				barEl!.style.width = `${percentage}%`;
			});
		}
	});

	const icon = $derived(CATEGORY_ICONS[category] ?? '📌');

	const isIndividual = $derived(type === 'individual');

	const rankGradient = $derived(
		isIndividual
			? 'background: linear-gradient(135deg, var(--green-dim), var(--green))'
			: 'background: linear-gradient(135deg, #283593, var(--indigo))'
	);

	const barGradient = $derived(
		isIndividual
			? 'background: linear-gradient(90deg, var(--green-dim), var(--green))'
			: 'background: linear-gradient(90deg, #283593, var(--indigo-text))'
	);
</script>

<div class="flex items-center gap-4 border-b border-white/4 py-3 last:border-b-0">
	<!-- Rank badge -->
	<div
		class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold text-white md:h-[38px] md:w-[38px] md:text-lg"
		style={rankGradient}
	>
		{rank}
	</div>

	<!-- Body -->
	<div class="flex-1">
		<div
			class="mb-1.5 font-display text-base leading-tight font-semibold text-white md:text-xl"
		>
			{icon}
			{name}
		</div>
		<EvidenceTag {hasEvidence} />
		{#if caption}
			<div class="mt-1 text-sm leading-relaxed text-white/45 italic">{caption}</div>
		{/if}
		<!-- Bar -->
		<div class="mt-2 h-2.5 overflow-hidden rounded-[5px] bg-white/6">
			<div
				bind:this={barEl}
				class="h-full w-0 rounded-[5px] transition-[width] duration-[1200ms] ease-out motion-reduce:transition-none"
				style={barGradient}
			></div>
		</div>
	</div>

	<!-- Percentage -->
	<div
		class="min-w-[60px] text-right text-2xl font-extrabold tabular-nums"
		class:text-[var(--green)]={isIndividual}
		class:text-[var(--indigo-text)]={!isIndividual}
	>
		{percentage}%
	</div>
</div>
