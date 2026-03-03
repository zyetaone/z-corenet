<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<circle cx="12" cy="5" r="2.5" fill="currentColor" opacity="0.9" />
	<path d="M12 8v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	<path
		d="M8 10l4 2 4-2"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class:stretch={animated}
	/>
	<path d="M12 13l-3 6M12 13l3 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
</svg>

<style>
	.stretch {
		animation: arm-stretch 3.5s ease-in-out infinite;
		transform-origin: 12px 10px;
	}
	@keyframes arm-stretch {
		0%,
		100% {
			transform: scaleY(1);
		}
		50% {
			transform: scaleY(1.1) translateY(-1px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.stretch {
			animation: none;
		}
	}
</style>
