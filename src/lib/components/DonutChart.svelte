<script lang="ts">
	export interface DonutSegment {
		value: number;
		color: string;
		label?: string;
	}

	let {
		segments,
		centerText,
		centerSubtext = '',
		size = 200
	}: {
		segments: DonutSegment[];
		centerText: string;
		centerSubtext?: string;
		size?: number;
	} = $props();

	const center = $derived(size / 2);
	const strokeWidth = $derived(size * 0.14);
	const chartRadius = $derived(size * 0.38);
	const circumference = $derived(2 * Math.PI * chartRadius);

	const uid = Math.random().toString(36).slice(2, 8);
	const total = $derived(segments.reduce((s, seg) => s + seg.value, 0));

	const segmentArcs = $derived(() => {
		let offset = 0;
		return segments.map((seg) => {
			const pct = total > 0 ? seg.value / total : 0;
			const arcLen = circumference * pct;
			const gap = segments.length > 1 ? 3 : 0;
			const visibleLen = Math.max(arcLen - gap, 0);
			const arc = {
				...seg,
				dasharray: `${visibleLen} ${circumference - visibleLen}`,
				dashoffset: -(offset + gap / 2),
				pct: Math.round(pct * 100)
			};
			offset += arcLen;
			return arc;
		});
	});
</script>

<svg viewBox="0 0 {size} {size}" class="donut-svg overflow-visible">
	<defs>
		<filter id="glow-{uid}" x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#1a2b3c" flood-opacity="0.15" />
		</filter>
		<filter id="innerGlow-{uid}" x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.1" />
		</filter>
	</defs>

	<!-- Background ring -->
	<circle
		cx={center}
		cy={center}
		r={chartRadius}
		fill="none"
		stroke="#1a2b3c"
		stroke-opacity="0.04"
		stroke-width={strokeWidth}
		filter="url(#innerGlow-{uid})"
	/>

	<!-- Segments -->
	{#each segmentArcs() as arc}
		<!-- We wrap the visible circle in a group to apply the drop shadow cleanly -->
		<g filter="url(#glow-{uid})">
			<circle
				cx={center}
				cy={center}
				r={chartRadius}
				fill="none"
				stroke={arc.color}
				stroke-width={strokeWidth}
				stroke-dasharray={arc.dasharray}
				stroke-dashoffset={arc.dashoffset}
				stroke-linecap="round"
				transform="rotate(-90 {center} {center})"
				class="donut-segment"
			/>
		</g>
	{/each}

	<!-- Center text -->
	<text
		x={center}
		y={centerSubtext ? center - size * 0.06 : center}
		text-anchor="middle"
		dominant-baseline="middle"
		fill="#1a2b3c"
		font-size={size * 0.2}
		font-weight="800"
		style="font-variant-numeric: tabular-nums"
	>
		{centerText}
	</text>
	{#if centerSubtext}
		<text
			x={center}
			y={center + size * 0.1}
			text-anchor="middle"
			dominant-baseline="middle"
			fill="#1a2b3c"
			fill-opacity="0.4"
			font-size={size * 0.065}
			font-weight="600"
		>
			{centerSubtext}
		</text>
	{/if}
</svg>

<style>
	.donut-svg {
		width: 100%;
		height: 100%;
	}

	.donut-segment {
		transition:
			stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1),
			stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.donut-svg {
		filter: drop-shadow(0 4px 12px rgba(26, 43, 60, 0.08));
	}

	@media (prefers-reduced-motion: reduce) {
		.donut-segment {
			transition: none;
		}
	}
</style>
