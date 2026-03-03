<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<path d="M12 22V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
	<path
		d="M12 10C12 10 7 4 4 5C1 6 3 12 12 10Z"
		fill="currentColor"
		opacity="0.8"
		class:sway={animated}
	/>
	<path
		d="M12 14C12 14 17 8 20 9C23 10 21 16 12 14Z"
		fill="currentColor"
		opacity="0.6"
		class:sway-reverse={animated}
	/>
</svg>

<style>
	.sway {
		animation: leaf-sway 4s ease-in-out infinite;
		transform-origin: 12px 10px;
	}
	.sway-reverse {
		animation: leaf-sway-reverse 4.5s ease-in-out infinite;
		transform-origin: 12px 14px;
	}
	@keyframes leaf-sway {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(3deg);
		}
	}
	@keyframes leaf-sway-reverse {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(-2deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sway,
		.sway-reverse {
			animation: none;
		}
	}
</style>
