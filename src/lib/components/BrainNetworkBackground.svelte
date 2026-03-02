<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let mounted = $state(false);

	// Define nodes matching the image abstractly
	const nodes = [
		{ id: 1, x: 10, y: 20, color: 'var(--green)' },
		{ id: 2, x: 25, y: 15, color: 'var(--red)' },
		{ id: 3, x: 15, y: 45, color: 'var(--orange)' },
		{ id: 4, x: 5, y: 70, color: 'var(--green)' },
		{ id: 5, x: 20, y: 85, color: 'var(--green)' },
		{ id: 6, x: 30, y: 60, color: 'var(--red)' },
		{ id: 7, x: 40, y: 30, color: 'var(--green)' },
		{ id: 8, x: 45, y: 10, color: 'var(--orange)' },
		{ id: 9, x: 55, y: 50, color: 'var(--orange)' },
		{ id: 10, x: 45, y: 75, color: 'var(--green)' },
		{ id: 11, x: 65, y: 25, color: 'var(--green)' },
		{ id: 12, x: 75, y: 15, color: 'var(--orange)' },
		{ id: 13, x: 60, y: 70, color: 'var(--green)' },
		{ id: 14, x: 70, y: 55, color: 'var(--red)' },
		{ id: 15, x: 80, y: 80, color: 'var(--orange)' },
		{ id: 16, x: 90, y: 65, color: 'var(--green)' },
		{ id: 17, x: 85, y: 40, color: 'var(--green)' },
		{ id: 18, x: 95, y: 20, color: 'var(--red)' }
	];

	const edges = [
		[1, 2],
		[1, 3],
		[2, 7],
		[3, 4],
		[3, 6],
		[4, 5],
		[5, 6],
		[6, 10],
		[7, 8],
		[7, 9],
		[8, 11],
		[9, 10],
		[9, 13],
		[9, 14],
		[10, 13],
		[11, 12],
		[11, 17],
		[13, 15],
		[14, 15],
		[14, 18],
		[15, 16],
		[16, 17],
		[17, 18]
	];

	// Head path data (approximate side profile)
	const headPath =
		'M -5 -20 C -15 -20, -20 -10, -20 0 C -20 10, -15 15, -15 20 L -10 25 L -5 30 L 5 30 L 10 25 C 15 20, 18 10, 15 0 C 12 -10, 5 -20, -5 -20 Z';

	onMount(() => {
		mounted = true;
	});
</script>

<div
	class="pointer-events-none absolute inset-0 z-0 overflow-hidden mix-blend-screen"
	aria-hidden="true"
	style="animation: breathe 6s ease-in-out infinite"
>
	{#if mounted}
		<svg class="h-full w-full" in:fade={{ duration: 1500 }}>
			<!-- Define filters -->
			<defs>
				<filter id="glow">
					<feGaussianBlur stdDeviation="4" result="coloredBlur" />
					<feMerge>
						<feMergeNode in="coloredBlur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<!-- Draw Edges -->
			{#each edges as [startId, endId]}
				{@const start = nodes.find((n) => n.id === startId)}
				{@const end = nodes.find((n) => n.id === endId)}
				{#if start && end}
					<line
						x1="{start.x}%"
						y1="{start.y}%"
						x2="{end.x}%"
						y2="{end.y}%"
						stroke="var(--teal)"
						stroke-opacity="0.3"
						stroke-width="1.5"
					/>
				{/if}
			{/each}

			<!-- Draw Nodes as Heads/Brains -->
			{#each nodes as node (node.id)}
				<svg
					x="{node.x}%"
					y="{node.y}%"
					overflow="visible"
				>
					<g transform="translate(0, -5)">
						<!-- Head silhouette -->
						<path
							d={headPath}
							fill="rgba(255,255,255,0.02)"
							stroke="rgba(255,255,255,0.2)"
							stroke-width="1.5"
						/>
						<!-- Glowing Brain inside -->
						<circle cx="-2" cy="0" r="10" fill={node.color} opacity="0.3" filter="url(#glow)" />
						<!-- Brain icon -->
						<text x="-2" y="4" font-size="12" text-anchor="middle" fill="#ffffff" opacity="0.9"
							>🧠</text
						>
					</g>
				</svg>
			{/each}
		</svg>
	{/if}
</div>

<style>
	@keyframes breathe {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 0.45; }
	}
</style>
