<script lang="ts">
	import RankRow from './RankRow.svelte';

	let {
		title,
		subtitle,
		icon,
		type,
		features,
		totalVotes
	}: {
		title: string;
		subtitle: string;
		icon: string;
		type: 'individual' | 'communal';
		features: Array<{
			name: string;
			category: string;
			hasEvidence: boolean;
			caption: string | null;
			percentage: number;
		}>;
		totalVotes: number;
	} = $props();

	const isIndividual = $derived(type === 'individual');

	const top5 = $derived(features.slice(0, 5));

	const iconBg = $derived(
		isIndividual ? 'background: rgba(0,200,83,0.12)' : 'background: rgba(92,107,192,0.12)'
	);
</script>

<div class="rounded-2xl border border-white/6 bg-white/3 p-8">
	<!-- Header -->
	<div class="mb-6 flex items-center gap-3.5">
		<div class="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={iconBg}>
			{icon}
		</div>
		<div>
			<div
				class="font-display text-2xl font-bold"
				class:text-[var(--green)]={isIndividual}
				class:text-[#8C9EFF]={!isIndividual}
			>
				{title}
			</div>
			<div class="text-[13px] text-white/45 italic">{subtitle}</div>
		</div>
	</div>

	<!-- Rows -->
	{#each top5 as feature, i (feature.name)}
		<RankRow
			rank={i + 1}
			name={feature.name}
			category={feature.category}
			hasEvidence={feature.hasEvidence}
			caption={feature.caption}
			percentage={feature.percentage}
			{type}
		/>
	{/each}
</div>
