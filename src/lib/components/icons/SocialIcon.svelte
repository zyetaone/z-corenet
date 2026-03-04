<script lang="ts">
	let { size = 24, animated = true }: { size?: number; animated?: boolean } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" class="category-icon">
	<g class:social-breathe={animated}>
		<!-- Left person -->
		<circle cx="9" cy="7" r="3" fill="currentColor" opacity="0.8" />
		<path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="currentColor" opacity="0.35" />
	</g>
	<g class:social-breathe-delay={animated}>
		<!-- Right person -->
		<circle cx="17" cy="7" r="3" fill="currentColor" opacity="0.8" />
		<path d="M11 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="currentColor" opacity="0.35" />
	</g>
</svg>

<style>
	.social-breathe {
		animation: social-breathe 3s ease-in-out infinite;
	}
	.social-breathe-delay {
		animation: social-breathe 3s ease-in-out infinite;
		animation-delay: 0.5s;
	}
	@keyframes social-breathe {
		0%,
		100% {
			opacity: 0.7;
		}
		50% {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.social-breathe,
		.social-breathe-delay {
			animation: none;
			opacity: 0.85;
		}
	}
</style>
