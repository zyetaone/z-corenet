<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let isSubmitting = $state(false);
	let mounted = $state(false);
	let reduceMotion = $state(false);

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
	});
</script>

<svelte:head>
	<title>Join — CoreNet</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
	<div class="animated-grid-bg"></div>

	<!-- Subtle ambient glow instead of heavy SVG -->
	<div
		class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30 mix-blend-multiply transition-opacity duration-1000"
	>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,191,165,0.08),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,139,139,0.08),transparent_50%)]"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-md text-center">
		{#if mounted}
			<div
				in:fly={{
					y: reduceMotion ? 0 : -20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 100
				}}
				class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl"
				style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 10px 40px rgba(0,139,139,0.2)"
			>
				🧠
			</div>

			<h1
				in:fly={{
					y: reduceMotion ? 0 : 20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 200
				}}
				class="font-display mb-3 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl"
				style="background-image: linear-gradient(to right, #1a2b3c, #334155); line-height: 1.15"
			>
				Designing Workplaces<br />That Think
			</h1>

			<p
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 300 }}
				class="mb-8 text-base text-[#1a2b3c]/60"
			>
				Vote on workplace features that matter to you. Takes 2 minutes.
			</p>

			<form
				in:fly={{
					y: reduceMotion ? 0 : 30,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 400
				}}
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
				class="mx-auto max-w-sm"
			>
				<Button type="submit" disabled={isSubmitting} fullWidth>
					{isSubmitting ? 'Joining...' : 'Begin →'}
				</Button>
			</form>

			<p
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 600 }}
				class="mt-6 text-center text-xs font-semibold tracking-widest text-[#1a2b3c]/40 uppercase"
			>
				Powered by AWA &times; Zyeta
			</p>
		{/if}
	</div>
</div>
