<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	let mounted = $state(false);
	let reduceMotion = $state(false);

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
	});
</script>

<svelte:head>
	<title>Visualise — CoreNet</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
	<!-- Ambient glow -->
	<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-20">
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(0,200,83,0.15),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_60%_70%,rgba(92,107,192,0.15),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,191,165,0.1),transparent_40%)]"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-lg text-center">
		{#if mounted}
			<div
				in:fly={{
					y: reduceMotion ? 0 : -20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 100
				}}
				class="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-2xl text-[44px] shadow-2xl"
				style="background: linear-gradient(135deg, var(--green), var(--indigo-text)); box-shadow: 0 10px 40px rgba(0,191,165,0.15)"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-10 w-10 text-white"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
					<path
						fill-rule="evenodd"
						d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>

			<div
				in:fly={{
					y: reduceMotion ? 0 : 20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 200
				}}
			>
				<h1 class="font-display mb-2 text-3xl font-bold tracking-tight text-[#1a2b3c] md:text-4xl">
					Visualise Your Workspace
				</h1>
				<p class="mb-2 text-sm font-semibold tracking-[0.2em] text-[#1a2b3c]/40 uppercase">
					Powered by AWA &times; Zyeta
				</p>
			</div>

			<div
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 400 }}
				class="mx-auto mt-8 max-w-md rounded-3xl border border-[#1a2b3c]/10 bg-white/60 p-8 shadow-sm backdrop-blur-sm"
			>
				<div class="mb-4 text-5xl">&#127970;</div>
				<h2 class="font-display mb-3 text-xl font-bold text-[#1a2b3c]">Coming Soon</h2>
				<p class="text-sm leading-relaxed text-[#1a2b3c]/60">
					An interactive visualisation of your ideal workspace is being crafted based on your
					selections. We'll combine your individual preferences with the collective intelligence of
					your group to create a personalised workspace blueprint.
				</p>
			</div>

			<div
				in:fade={{ duration: reduceMotion ? 0 : 600, delay: reduceMotion ? 0 : 600 }}
				class="mt-8"
			>
				<a
					href="/thanks"
					class="inline-flex items-center gap-2 rounded-full border border-[#1a2b3c]/10 bg-white/50 px-6 py-2.5 text-sm font-semibold text-[#1a2b3c]/70 shadow-sm transition-colors hover:bg-white hover:text-(--teal)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
							clip-rule="evenodd"
						/>
					</svg>
					Back to results
				</a>
			</div>
		{/if}
	</div>
</div>
