<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<circle cx="6" cy="6" r="2" fill="currentColor" opacity="0.7" />
	<circle cx="18" cy="6" r="2" fill="currentColor" opacity="0.7" />
	<circle cx="12" cy="12" r="2.5" fill="currentColor" />
	<circle cx="6" cy="18" r="2" fill="currentColor" opacity="0.7" />
	<circle cx="18" cy="18" r="2" fill="currentColor" opacity="0.7" />
	<line
		x1="8"
		y1="7"
		x2="10"
		y2="11"
		stroke="currentColor"
		stroke-width="1"
		class:pulse-line={animated}
		style="--line-delay: 0s"
	/>
	<line
		x1="16"
		y1="7"
		x2="14"
		y2="11"
		stroke="currentColor"
		stroke-width="1"
		class:pulse-line={animated}
		style="--line-delay: 0.2s"
	/>
	<line
		x1="8"
		y1="17"
		x2="10"
		y2="13"
		stroke="currentColor"
		stroke-width="1"
		class:pulse-line={animated}
		style="--line-delay: 0.4s"
	/>
	<line
		x1="16"
		y1="17"
		x2="14"
		y2="13"
		stroke="currentColor"
		stroke-width="1"
		class:pulse-line={animated}
		style="--line-delay: 0.6s"
	/>
</svg>

<style>
	.pulse-line {
		animation: line-pulse 2.5s ease-in-out infinite;
		animation-delay: var(--line-delay);
	}
	@keyframes line-pulse {
		0%,
		100% {
			opacity: 0.2;
		}
		50% {
			opacity: 0.8;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pulse-line {
			animation: none;
			opacity: 0.5;
		}
	}
</style>
