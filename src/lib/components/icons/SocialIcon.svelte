<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<circle cx="8" cy="7" r="2.5" fill="currentColor" opacity="0.8" />
	<path d="M4 17c0-2.2 1.8-4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	<circle cx="16" cy="7" r="2.5" fill="currentColor" opacity="0.8" />
	<path d="M20 17c0-2.2-1.8-4-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	<path
		d="M8 13c1.5-1 6.5-1 8 0"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		class:reach={animated}
	/>
</svg>

<style>
	.reach {
		animation: reach-connect 3s ease-in-out infinite;
		transform-origin: center;
	}
	@keyframes reach-connect {
		0%,
		100% {
			opacity: 0.3;
			transform: scaleX(0.9);
		}
		50% {
			opacity: 0.9;
			transform: scaleX(1);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.reach {
			animation: none;
			opacity: 0.6;
		}
	}
</style>
