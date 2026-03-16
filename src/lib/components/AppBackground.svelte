<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		theme = 'teal'
	}: {
		children: Snippet;
		theme?: 'teal' | 'dark-blue';
	} = $props();

	const themeClass = $derived(theme === 'dark-blue' ? 'theme-dark-blue' : 'bg-teal-gradient');
</script>

<div
	class="{themeClass} relative flex min-h-dvh flex-col overflow-hidden transition-colors duration-700"
>
	<!-- Subtle grid overlay for texture -->
	<div
		class="animated-grid-bg"
		style="
			background-image:
				linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
				linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px);
		"
	></div>

	<!-- Ambient glow -->
	<div
		class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30 mix-blend-soft-light transition-opacity duration-1000"
	>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.1),transparent_50%)]"
		></div>
	</div>

	<!-- Bottom vignette for readability on teal gradient -->
	{#if theme === 'teal'}
		<div
			class="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[40%] bg-gradient-to-t from-black/30 via-black/10 to-transparent"
		></div>
	{/if}

	<div class="relative z-10 w-full max-w-full flex-1">
		{@render children()}
	</div>
</div>
