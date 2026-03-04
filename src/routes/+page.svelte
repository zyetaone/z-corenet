<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import { fade, fly } from 'svelte/transition';
	import { useMount } from '$lib/utils/use-mount.svelte';

	let isSubmitting = $state(false);
	const { mounted, reduceMotion } = useMount();
</script>

<svelte:head>
	<title>Join — CoreNet</title>
</svelte:head>

<div
	class="bg-teal-gradient relative flex min-h-screen items-center justify-center overflow-hidden px-6"
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
				class="mb-6 text-base text-white/80 italic md:whitespace-nowrap"
			>
				Vote on workplace features that matter to you and your brain.
			</p>

			<hr
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 350 }}
				class="mx-auto mb-8 w-16 border-t border-white/20"
			/>

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
				<Button
					type="submit"
					loading={isSubmitting}
					fullWidth={true}
					style="color: var(--color-teal); background: #fff; border-color: rgba(255,255,255,0.3); border-radius: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.15)"
				>
					Begin →
				</Button>
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
