<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon" class:subtle-shift={animated}>
	<rect x="3" y="10" width="18" height="2" rx="1" fill="currentColor" opacity="0.9" />
	<rect x="5" y="12" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.6" />
	<rect x="17" y="12" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.6" />
	<rect x="9" y="4" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1.5" fill="none" />
	<line x1="12" y1="9" x2="12" y2="10" stroke="currentColor" stroke-width="1.5" />
</svg>

<style>
	.subtle-shift {
		animation: desk-settle 5s ease-in-out infinite;
	}
	@keyframes desk-settle {
		0%, 100% { transform: perspective(200px) rotateY(0deg); }
		50% { transform: perspective(200px) rotateY(1.5deg); }
	}
	@media (prefers-reduced-motion: reduce) {
		.subtle-shift { animation: none; }
	}
</style>
