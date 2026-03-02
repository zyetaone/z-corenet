<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let name = $state('');
	let isSubmitting = $state(false);
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
	<!-- Subtle ambient glow instead of heavy SVG -->
	<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30 mix-blend-screen transition-opacity duration-1000">
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,191,165,0.15),transparent_50%)]"></div>
		<div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,139,139,0.15),transparent_50%)]"></div>
	</div>

	<div class="relative z-10 w-full max-w-md text-center">
		{#if mounted}
			<div
				in:fly={{ y: reduceMotion ? 0 : -20, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 100 }}
				class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl"
				style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 10px 40px rgba(0,139,139,0.2)"
			>
				🧠
			</div>

			<h1 
				in:fly={{ y: reduceMotion ? 0 : 20, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 200 }}
				class="font-display mb-3 text-4xl tracking-tight font-bold text-transparent bg-clip-text md:text-5xl" 
				style="background-image: linear-gradient(to right, #ffffff, #d1d5db); line-height: 1.15"
			>
				Designing Workplaces<br />That Think
			</h1>

			<p 
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 400 }}
				class="mb-8 text-xs font-bold tracking-[0.15em] text-[var(--accent)] uppercase"
			>
				Cognitive Performance Exercise
			</p>

			<form
				in:fly={{ y: reduceMotion ? 0 : 30, duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 600 }}
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
				class="mx-auto max-w-sm space-y-6"
			>
				<div class="group relative">
					<div class="absolute -inset-0.5 rounded-2xl bg-linear-to-r from-(--teal) to-(--accent) opacity-20 blur transition duration-500 group-focus-within:opacity-60"></div>
					<input
						name="name"
						type="text"
						bind:value={name}
						aria-label="Your name"
						placeholder="What's your name? (optional)"
						class="relative w-full rounded-2xl border border-white/10 bg-[#0f1923]/80 px-6 py-4.5 text-center text-lg font-medium tracking-wide text-white placeholder-white/30 shadow-inner backdrop-blur-xl outline-none transition-all duration-300 focus:border-white/20 focus:bg-white/5"
					/>
				</div>

				<div class="pt-2">
					<Button type="submit" disabled={isSubmitting} fullWidth>
						{isSubmitting ? 'Joining...' : 'Join Session →'}
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>
