<script lang="ts">
	import type { RadarDataset } from '$lib/types/dashboard';

	let {
		datasets,
		labels,
		size = 400
	}: {
		datasets: RadarDataset[];
		labels: string[];
		size?: number;
	} = $props();

	const padding = 50;
	const center = $derived(size / 2);
	const radius = $derived((size - padding * 2) / 2);
	const angleStep = $derived((Math.PI * 2) / labels.length);

	// Helper to get coordinates
	function getPoint(index: number, value: number, max = 100) {
		const r = (value / max) * radius;
		const x = center + r * Math.sin(index * angleStep);
		const y = center - r * Math.cos(index * angleStep);
		return `${x},${y}`;
	}

	// Grid paths
	const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
	const gridCircles = $derived(
		gridLevels.map((level) => {
			return labels.map((_, i) => getPoint(i, level * 100)).join(' ');
		})
	);

	// Axis paths
	const axes = $derived(
		labels.map((_, i) => {
			const x2 = center + radius * Math.sin(i * angleStep);
			const y2 = center - radius * Math.cos(i * angleStep);
			return { x1: center, y1: center, x2, y2 };
		})
	);

	// Data paths
	const polyPaths = $derived(
		datasets.map((ds) => {
			return ds.values.map((v, i) => getPoint(i, v)).join(' ');
		})
	);

	// Label positions
	const labelOffsets = $derived(
		labels.map((label, i) => {
			const textRadius = radius + 25;
			const x = center + textRadius * Math.sin(i * angleStep);
			const y = center - textRadius * Math.cos(i * angleStep);
			return { x, y, label };
		})
	);
</script>

<div class="radar-container" style="--size: {size}px">
	<svg viewBox="0 0 {size} {size}" class="h-full w-full">
		<!-- Grid -->
		{#each gridCircles as points}
			<polygon {points} class="grid-line" fill="none" stroke="rgba(0,0,0,0.08)" />
		{/each}

		<!-- Axes -->
		{#each axes as axis}
			<line
				x1={axis.x1}
				y1={axis.y1}
				x2={axis.x2}
				y2={axis.y2}
				stroke="rgba(0,0,0,0.08)"
				stroke-dasharray="2 4"
			/>
		{/each}

		<!-- Data -->
		{#each polyPaths as points, i}
			<polygon
				{points}
				fill={datasets[i].color}
				stroke={datasets[i].color}
				stroke-width="2"
				fill-opacity={datasets[i].fillOpacity || 0.2}
				class="data-poly"
			/>
			<!-- Dots -->
			{#each points.split(' ') as point}
				{@const [px, py] = point.split(',')}
				<circle cx={px} cy={py} r="3" fill={datasets[i].color} />
			{/each}
		{/each}

		<!-- Labels -->
		{#each labelOffsets as lo}
			<text
				x={lo.x}
				y={lo.y}
				text-anchor="middle"
				dominant-baseline="middle"
				class="radar-label"
				fill="rgba(0,0,0,0.4)"
			>
				{lo.label}
			</text>
		{/each}
	</svg>

	<!-- Legend -->
	<div class="mt-1 flex justify-center gap-4">
		{#each datasets as ds}
			<div class="flex items-center gap-1.5">
				<div class="h-2 w-2 rounded-full" style="background: {ds.color}"></div>
				<span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">{ds.label}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.radar-container {
		width: 100%;
		max-width: var(--size);
		margin: 0 auto;
	}

	.radar-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.grid-line {
		transition: all 0.3s ease;
	}

	.data-poly {
		transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}
</style>
