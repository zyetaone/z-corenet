<script lang="ts">
	import type { RadarDataset } from '$lib/types/dashboard';

	let {
		datasets,
		labels,
		size = 300
	}: {
		datasets: RadarDataset[];
		labels: string[];
		size?: number;
	} = $props();

	const uid = Math.random().toString(36).slice(2, 8);
	const center = $derived(size / 2);
	const radius = $derived(size * 0.34);
	const labelRadius = $derived(radius + 22);
	const levels = [25, 50, 75, 100];

	const angleStep = $derived((2 * Math.PI) / labels.length);

	function getPoint(index: number, value: number): { x: number; y: number } {
		const angle = index * angleStep - Math.PI / 2;
		const r = (value / 100) * radius;
		return {
			x: center + r * Math.cos(angle),
			y: center + r * Math.sin(angle)
		};
	}

	function getLabelPos(index: number): { x: number; y: number } {
		const angle = index * angleStep - Math.PI / 2;
		return {
			x: center + labelRadius * Math.cos(angle),
			y: center + labelRadius * Math.sin(angle)
		};
	}

	function gridPoints(level: number): string {
		return labels
			.map((_, i) => {
				const p = getPoint(i, level);
				return `${p.x},${p.y}`;
			})
			.join(' ');
	}

	function dataPoints(values: number[]): string {
		return values
			.map((v, i) => {
				const p = getPoint(i, v);
				return `${p.x},${p.y}`;
			})
			.join(' ');
	}

	function textAnchor(index: number): string {
		const angle = index * angleStep - Math.PI / 2;
		const cos = Math.cos(angle);
		if (Math.abs(cos) < 0.15) return 'middle';
		return cos > 0 ? 'start' : 'end';
	}

	function baselineShift(index: number): string {
		const angle = index * angleStep - Math.PI / 2;
		const sin = Math.sin(angle);
		if (Math.abs(sin) < 0.15) return 'middle';
		return sin > 0 ? 'hanging' : 'auto';
	}
</script>

<svg viewBox="0 0 {size} {size}" class="radar-svg overflow-visible">
	<defs>
		<filter id="radarGlow-{uid}" x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.10" />
		</filter>
	</defs>

	<!-- Grid polygons -->
	{#each levels as level}
		<polygon
			points={gridPoints(level)}
			fill="none"
			stroke="var(--color-navy)"
			stroke-opacity={level === 100 ? 0.12 : 0.06}
			stroke-width="1"
		/>
	{/each}

	<!-- Spokes -->
	{#each labels as _, i}
		{@const tip = getPoint(i, 100)}
		<line
			x1={center}
			y1={center}
			x2={tip.x}
			y2={tip.y}
			stroke="var(--color-navy)"
			stroke-opacity="0.06"
			stroke-width="1"
		/>
	{/each}

	<!-- Dataset polygons -->
	{#each datasets as ds}
		<polygon
			points={dataPoints(ds.values)}
			fill={ds.color}
			fill-opacity={ds.fillOpacity ?? 0.15}
			stroke={ds.color}
			stroke-width="2.5"
			stroke-linejoin="round"
			filter="url(#radarGlow-{uid})"
			class="radar-polygon"
		/>
		{#each ds.values as val, i}
			{@const p = getPoint(i, val)}
			<circle cx={p.x} cy={p.y} r="3.5" fill={ds.color} class="radar-dot" />
		{/each}
	{/each}

	<!-- Labels -->
	{#each labels as label, i}
		{@const pos = getLabelPos(i)}
		<text
			x={pos.x}
			y={pos.y}
			text-anchor={textAnchor(i)}
			dominant-baseline={baselineShift(i)}
			fill="var(--color-navy)"
			fill-opacity="0.55"
			font-size="11"
			font-weight="600"
		>
			{label}
		</text>
	{/each}
</svg>

<style>
	.radar-svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 4px 12px rgba(26, 43, 60, 0.04));
	}

	.radar-polygon {
		transition: all 0.8s ease-out;
	}

	.radar-dot {
		transition: all 0.6s ease-out;
	}

	@media (prefers-reduced-motion: reduce) {
		.radar-polygon,
		.radar-dot {
			transition: none;
		}
	}
</style>
