<script lang="ts">
	import RadarChart from './RadarChart.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import { RADAR_LABELS } from '$lib/data/default-features';
	import type { RadarDataset, CategoryStat } from '$lib/types/dashboard';

	let {
		radarDatasets,
		categoryStats
	}: {
		radarDatasets: RadarDataset[];
		categoryStats: CategoryStat[];
	} = $props();

	const topAreas = $derived(categoryStats.slice(0, 4));
</script>

<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
	<!-- Left: Radar Analysis -->
	<div class="glass-panel flex flex-col items-center rounded-3xl p-8">
		<h3 class="mb-2 self-start font-display text-lg font-bold text-white">Focus Comparison</h3>
		<p class="mb-8 self-start text-xs text-white/40">
			Individual priorities vs. Collective team vision
		</p>

		<RadarChart datasets={radarDatasets} labels={RADAR_LABELS} size={360} />
	</div>

	<!-- Right: Category Breakdown -->
	<div class="flex flex-col gap-4">
		<h3 class="px-2 font-display text-lg font-bold text-white">Weighting per Area</h3>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each topAreas as cat}
				<div class="glass-panel flex items-center gap-4 rounded-2xl p-5">
					<div class="rounded-xl bg-white/5 p-3 text-lime-400">
						<CategoryIcon group={cat.key} size={24} />
					</div>
					<div class="flex-1">
						<div class="mb-1 flex items-baseline justify-between">
							<span class="text-sm font-bold tracking-wide text-white">{cat.label}</span>
							<span class="text-xl font-black text-lime-400 tabular-nums">{cat.percentage}%</span>
						</div>
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
							<div
								class="h-full bg-lime-400 transition-all duration-1000"
								style="width: {cat.percentage}%"
							></div>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Summary list for remaining categories -->
		<div class="glass-panel mt-2 rounded-2xl p-6">
			<h4 class="mb-4 text-xs font-bold tracking-[0.2em] text-white/40 uppercase">
				Secondary Focus Areas
			</h4>
			<div class="flex flex-wrap gap-2">
				{#each categoryStats.slice(4) as cat}
					<div
						class="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-wider text-white/60 uppercase"
					>
						<CategoryIcon group={cat.key} size={12} />
						{cat.label}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
