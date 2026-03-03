<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<circle cx="12" cy="12" r="2" fill="currentColor" />
	<circle
		cx="12"
		cy="12"
		r="5"
		stroke="currentColor"
		stroke-width="1.5"
		fill="none"
		class:ring={animated}
		style="--ring-delay: 0s"
	/>
	<circle
		cx="12"
		cy="12"
		r="8"
		stroke="currentColor"
		stroke-width="1.5"
		fill="none"
		class:ring={animated}
		style="--ring-delay: 0.4s"
	/>
	<circle
		cx="12"
		cy="12"
		r="11"
		stroke="currentColor"
		stroke-width="1"
		fill="none"
		class:ring={animated}
		style="--ring-delay: 0.8s"
	/>
</svg>

<style>
	.ring {
		animation: ring-expand 3s ease-out infinite;
		animation-delay: var(--ring-delay);
	}
	@keyframes ring-expand {
		0% {
			opacity: 0.8;
			transform-origin: center;
			transform: scale(0.95);
		}
		100% {
			opacity: 0;
			transform-origin: center;
			transform: scale(1.15);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ring {
			animation: none;
			opacity: 0.4;
		}
	}
</style>
