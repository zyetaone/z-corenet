<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<path d="M3 8h12a3 3 0 100-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" class:flow={animated} style="--flow-delay: 0s" />
	<path d="M3 12h16a3 3 0 110 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" class:flow={animated} style="--flow-delay: 0.3s" />
	<path d="M3 16h10a3 3 0 100 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" class:flow={animated} style="--flow-delay: 0.6s" />
</svg>

<style>
	.flow {
		animation: wind-flow 4s ease-in-out infinite;
		animation-delay: var(--flow-delay);
	}
	@keyframes wind-flow {
		0%, 100% { opacity: 0.4; transform: translateX(0); }
		50% { opacity: 1; transform: translateX(2px); }
	}
	@media (prefers-reduced-motion: reduce) {
		.flow { animation: none; opacity: 0.7; }
	}
</style>
