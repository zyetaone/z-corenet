<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9" />
	{#each [0, 45, 90, 135, 180, 225, 270, 315] as angle (angle)}
		<line
			x1={12 + 6.5 * Math.cos((angle * Math.PI) / 180)}
			y1={12 + 6.5 * Math.sin((angle * Math.PI) / 180)}
			x2={12 + 9 * Math.cos((angle * Math.PI) / 180)}
			y2={12 + 9 * Math.sin((angle * Math.PI) / 180)}
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			class:ray-animated={animated}
			style="--ray-delay: {angle / 360}s"
		/>
	{/each}
</svg>

<style>
	.ray-animated {
		animation: ray-pulse 3s ease-in-out infinite;
		animation-delay: var(--ray-delay);
	}
	@keyframes ray-pulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ray-animated {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
