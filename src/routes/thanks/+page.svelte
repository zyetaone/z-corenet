<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let { data } = $props();
	let mounted = $state(false);
	let reduceMotion = $state(false);

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
	});
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
>
	<!-- Ambient glow background -->
	<div
		class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30 mix-blend-screen transition-opacity duration-1000"
	>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,191,165,0.15),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,139,139,0.15),transparent_50%)]"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-md text-center">
		{#if mounted}
			<!-- Checkmark icon -->
			<div
				in:fly={{ y: reduceMotion ? 0 : -20, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 100 }}
				class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-2xl"
				style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 10px 40px rgba(0,139,139,0.3)"
			>
				&#x2713;
			</div>

			<h1
				in:fly={{ y: reduceMotion ? 0 : 20, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 200 }}
				class="font-display mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl"
			>
				Thanks for voting!
			</h1>

			<!-- Individual picks -->
			{#if data.individual.length > 0}
				<div in:fly={{ y: reduceMotion ? 0 : 20, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 400 }} class="mb-8 text-left">
					<h2
						class="font-display mb-3 flex items-center gap-2 text-lg font-semibold text-white/90"
					>
						<span class="text-xl">&#x1F9E0;</span>
						Your Individual picks:
					</h2>
					<ul class="space-y-1.5 pl-8">
						{#each data.individual as feature, i (feature)}
							<li
								in:fly={{ x: reduceMotion ? 0 : -10, duration: reduceMotion ? 0 : 500, delay: reduceMotion ? 0 : 500 + i * 80 }}
								class="list-disc text-white/70"
							>
								{feature}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Communal picks -->
			{#if data.communal.length > 0}
				<div in:fly={{ y: reduceMotion ? 0 : 20, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 700 }} class="mb-10 text-left">
					<h2
						class="font-display mb-3 flex items-center gap-2 text-lg font-semibold text-white/90"
					>
						<span class="text-xl">&#x1F91D;</span>
						Your Connected picks:
					</h2>
					<ul class="space-y-1.5 pl-8">
						{#each data.communal as feature, i (feature)}
							<li
								in:fly={{ x: reduceMotion ? 0 : -10, duration: reduceMotion ? 0 : 500, delay: reduceMotion ? 0 : 800 + i * 80 }}
								class="list-disc text-white/70"
							>
								{feature}
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<!-- Footer prompt -->
			<p
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 1200 }}
				class="text-sm font-medium tracking-wide text-white/45"
			>
				Look up at the screen for the group results!
			</p>
		{/if}
	</div>
</div>
