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

	function evidenceColor(ratio: number): string {
		if (ratio >= 80) return 'bg-green-400';
		if (ratio >= 50) return 'bg-lime-400';
		if (ratio >= 25) return 'bg-amber-400';
		return 'bg-red-400';
	}

	function evidenceBarBg(ratio: number): string {
		if (ratio >= 80) return 'bg-green-400/20';
		if (ratio >= 50) return 'bg-lime-400/15';
		if (ratio >= 25) return 'bg-amber-400/15';
		return 'bg-red-400/15';
	}
</script>

<div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
	<!-- Left: Radar -->
	<div class="summary-card flex flex-col items-center justify-center rounded-2xl px-4 py-4">
		<h3 class="mb-0.5 self-start font-display text-sm font-bold text-slate-800">
			Focus Comparison
		</h3>
		<p class="mb-1 self-start text-[10px] text-slate-400">Individual vs. Collective priorities</p>
		<RadarChart datasets={radarDatasets} labels={RADAR_LABELS} size={280} />
	</div>

	<!-- Right: Evidence Heatmap -->
	<div class="summary-card flex flex-col rounded-2xl px-4 py-4">
		<h3 class="mb-0.5 font-display text-sm font-bold text-slate-800">Evidence Heatmap</h3>
		<p class="mb-2 text-[10px] text-slate-400">How evidence-backed are votes per area?</p>

		<div class="flex flex-1 flex-col justify-between gap-1">
			{#each categoryStats as cat}
				<div class="flex items-center gap-2">
					<div class="w-4 shrink-0 text-slate-400">
						<CategoryIcon group={cat.key} size={14} />
					</div>
					<span class="w-16 shrink-0 truncate text-[11px] font-semibold text-slate-600"
						>{cat.label}</span
					>
					<div
						class="heatmap-bar relative h-5 flex-1 overflow-hidden rounded-full {evidenceBarBg(
							cat.evidenceRatio
						)}"
					>
						<div
							class="absolute inset-y-0 left-0 rounded-full {evidenceColor(cat.evidenceRatio)}"
							style="width: {cat.evidenceRatio}%"
						></div>
					</div>
					<span class="w-9 shrink-0 text-right text-[11px] font-bold text-slate-700 tabular-nums">
						{cat.evidenceRatio}%
					</span>
				</div>
			{/each}
		</div>

		<!-- Legend -->
		<div
			class="mt-auto flex items-center gap-3 pt-2 text-[9px] font-semibold tracking-wider text-slate-400 uppercase"
		>
			<span class="flex items-center gap-1"
				><span class="inline-block h-2 w-2 rounded-full bg-green-400"></span> 80%+</span
			>
			<span class="flex items-center gap-1"
				><span class="inline-block h-2 w-2 rounded-full bg-lime-400"></span> 50–79%</span
			>
			<span class="flex items-center gap-1"
				><span class="inline-block h-2 w-2 rounded-full bg-amber-400"></span> 25–49%</span
			>
			<span class="flex items-center gap-1"
				><span class="inline-block h-2 w-2 rounded-full bg-red-400"></span> &lt;25%</span
			>
		</div>
	</div>
</div>

<style>
	.summary-card {
		background: rgba(255, 255, 255, 0.85);
		border: 1px solid rgba(0, 0, 0, 0.05);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
		backdrop-filter: blur(8px);
	}

	.heatmap-bar > div {
		animation: heatmap-fill 1s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes heatmap-fill {
		from {
			width: 0%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.heatmap-bar > div {
			animation: none;
		}
	}
</style>
