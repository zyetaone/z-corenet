<script lang="ts">
	import { enhance } from '$app/forms';
	import BrainNetworkBackground from '$lib/components/BrainNetworkBackground.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let name = $state('');
	let isSubmitting = $state(false);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
	style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
>
	<BrainNetworkBackground />

	<div
		class="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,25,35,0.4)_100%)]"
	></div>

	<div class="relative z-10 w-full max-w-xl text-center">
		{#if mounted}
			<div
				in:fly={{ y: -20, duration: 800, delay: 100 }}
				class="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl text-6xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:rotate-3"
				style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 20px 50px rgba(0,139,139,0.3)"
			>
				🧠
			</div>

			<h1 
				in:fly={{ y: 20, duration: 800, delay: 200 }}
				class="font-display mb-3 text-5xl tracking-tight font-extrabold text-transparent bg-clip-text" 
				style="background-image: linear-gradient(to right, #ffffff, #d1d5db); line-height: 1.15"
			>
				Designing Workplaces<br />That Think
			</h1>

			<p 
				in:fade={{ duration: 800, delay: 400 }}
				class="mb-12 text-xs font-bold tracking-[0.25em] text-[var(--accent)] uppercase"
			>
				Cognitive Performance Exercise
			</p>

			<!-- Two-phase explainer -->
			<div 
				in:fly={{ y: 30, duration: 800, delay: 600 }}
				class="mx-auto mb-12 grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2"
			>
				<!-- Phase A Card -->
				<div class="group relative overflow-hidden rounded-2xl border border-(--green)/20 bg-(--green)/5 p-6 text-left shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-(--green)/10 hover:shadow-(--green)/10 hover:shadow-xl">
					<div class="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-(--green)/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"></div>
					<span
						class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-(--green)/20 bg-(--green)/10 px-3 py-1 text-[10px] font-bold tracking-[0.15em] text-[var(--green)] uppercase shadow-inner"
					>
						Phase A
					</span>
					<h3 class="font-display mb-2 text-base font-bold text-white">The Individual Brain</h3>
					<p class="text-xs leading-relaxed text-white/60">
						Choose the <strong class="font-bold text-white">5 features</strong> with the greatest impact on an individual's cognitive performance.
					</p>
				</div>

				<!-- Phase B Card -->
				<div class="group relative overflow-hidden rounded-2xl border border-(--indigo)/20 bg-(--indigo)/5 p-6 text-left shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-(--indigo)/10 hover:shadow-(--indigo)/10 hover:shadow-xl">
					<div class="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-(--indigo)/20 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"></div>
					<span
						class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-(--indigo)/20 bg-(--indigo)/10 px-3 py-1 text-[10px] font-bold tracking-[0.15em] text-[var(--indigo)] uppercase shadow-inner"
					>
						Phase B
					</span>
					<h3 class="font-display mb-2 text-base font-bold text-white">The Connected Brain</h3>
					<p class="text-xs leading-relaxed text-white/60">
						From the remaining, choose <strong class="font-bold text-white">5 features</strong> for team cognitive performance.
					</p>
				</div>
			</div>

			<form
				in:fly={{ y: 30, duration: 800, delay: 800 }}
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
				class="mx-auto max-w-sm space-y-5"
			>
				<div class="relative">
					<input
						name="name"
						type="text"
						bind:value={name}
						placeholder="Your name (optional)"
						class="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-lg font-medium text-white placeholder-white/20 shadow-inner backdrop-blur-md outline-none transition-all duration-300 focus:border-[var(--accent)] focus:bg-white/10 focus:ring-4 focus:ring-(--accent)/20"
					/>
				</div>

				<div class="pt-2">
					<Button type="submit" disabled={isSubmitting} fullWidth>
						{isSubmitting ? 'Starting Session...' : 'Begin Exercise →'}
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>
