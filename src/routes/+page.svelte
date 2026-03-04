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

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
	style="background: linear-gradient(160deg, var(--color-teal) 0%, var(--color-accent) 100%)"
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

	<div class="relative z-10 w-full max-w-md text-center">
		{#if mounted}
			<div
				in:fly={{
					y: reduceMotion ? 0 : -20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 100
				}}
				class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl"
				style="background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); box-shadow: 0 10px 40px rgba(0,0,0,0.15)"
			>
				🧠
			</div>

			<h1
				in:fly={{
					y: reduceMotion ? 0 : 20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 200
				}}
				class="mb-3 font-display text-4xl font-bold tracking-tight text-white md:text-5xl"
				style="line-height: 1.15; text-shadow: 0 2px 20px rgba(0,0,0,0.1)"
			>
				Designing Workplaces<br />That Think
			</h1>

			<p
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 300 }}
				class="mb-8 text-base text-white/80"
			>
				Vote on workplace features that matter to you and your brain.
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
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full cursor-pointer rounded-2xl border-2 border-white/30 bg-white px-8 py-4 text-lg font-bold tracking-wide shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
					style="color: var(--color-teal)"
				>
					{isSubmitting ? 'Joining...' : 'Begin →'}
				</button>
			</form>

			<p
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 600 }}
				class="mt-6 text-center text-xs font-semibold tracking-widest text-white/50 uppercase"
			>
				Powered by AWA &times; Zyeta
			</p>
		{/if}
	</div>
</div>
