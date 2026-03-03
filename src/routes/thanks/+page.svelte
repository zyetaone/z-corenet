<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
	let mounted = $state(false);
	let reduceMotion = $state(false);
	let name = $state('');
	let email = $state('');
	let showDownload = $state(false);
	let emailSent = $state(false);

	const topIndividual = $derived(data.individual);
	const topCommunal = $derived(data.communal);

	// Features that appear in BOTH phases
	const shared = $derived.by(() => {
		const indSet = new Set(data.individual);
		return data.communal.filter((f) => indSet.has(f));
	});

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
	});
</script>

<svelte:head>
	<title>Your Results — CoreNet</title>
</svelte:head>

<div class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
	<!-- Ambient glow background -->
	<div
		class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30 mix-blend-screen transition-opacity duration-1000"
	>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(0,200,83,0.12),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(92,107,192,0.12),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,191,165,0.1),transparent_50%)]"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-xl text-center">
		{#if mounted}
			<!-- Checkmark icon -->
			<div
				in:fly={{
					y: reduceMotion ? 0 : -20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 100
				}}
				class="mx-auto mb-6 flex h-[88px] w-[88px] items-center justify-center rounded-2xl text-[44px] shadow-2xl"
				style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 10px 40px rgba(0,191,165,0.2)"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-10 w-10 text-white"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
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
				<h1 class="font-display mb-1 text-3xl font-bold tracking-tight text-[#1a2b3c] md:text-4xl">
					Your Workspace DNA
				</h1>
				<p class="mb-8 text-sm font-semibold tracking-[0.2em] text-[#1a2b3c]/40 uppercase">
					Powered by AWA &times; Zyeta
				</p>
			</div>

			<!-- Top 3 Individual + Top 3 Collective side by side -->
			<div
				in:fly={{
					y: reduceMotion ? 0 : 20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 350
				}}
				class="mb-6 grid grid-cols-2 gap-4"
			>
				<!-- Individual column -->
				<div class="rounded-2xl border border-(--green)/20 bg-(--green)/5 p-5">
					<div class="mb-3 text-2xl">&#x1F9E0;</div>
					<h3 class="font-display mb-1 text-sm font-bold text-(--green)">Individual Brain</h3>
					<p class="mb-3 text-[10px] font-medium tracking-wider text-[#1a2b3c]/40 uppercase">
						Your picks
					</p>
					<ol class="space-y-2 text-left">
						{#each topIndividual as feature, i (feature)}
							<li
								in:fly={{
									x: reduceMotion ? 0 : -12,
									duration: reduceMotion ? 0 : 400,
									delay: reduceMotion ? 0 : 450 + i * 80
								}}
								class="flex items-start gap-2"
							>
								<span
									class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--green)/15 text-[10px] font-bold text-(--green)"
									>{i + 1}</span
								>
								<span class="text-xs leading-relaxed font-medium text-[#1a2b3c]/80">{feature}</span>
							</li>
						{/each}
					</ol>
				</div>

				<!-- Collective column -->
				<div class="rounded-2xl border border-(--indigo-text)/20 bg-(--indigo-text)/5 p-5">
					<div class="mb-3 text-2xl">&#x1F91D;</div>
					<h3 class="font-display mb-1 text-sm font-bold text-(--indigo-text)">Collective Brain</h3>
					<p class="mb-3 text-[10px] font-medium tracking-wider text-[#1a2b3c]/40 uppercase">
						Your picks
					</p>
					<ol class="space-y-2 text-left">
						{#each topCommunal as feature, i (feature)}
							<li
								in:fly={{
									x: reduceMotion ? 0 : 12,
									duration: reduceMotion ? 0 : 400,
									delay: reduceMotion ? 0 : 450 + i * 80
								}}
								class="flex items-start gap-2"
							>
								<span
									class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--indigo-text)/15 text-[10px] font-bold text-(--indigo-text)"
									>{i + 1}</span
								>
								<span class="text-xs leading-relaxed font-medium text-[#1a2b3c]/80">{feature}</span>
							</li>
						{/each}
					</ol>
				</div>
			</div>

			<!-- Intersection / Overlap -->
			{#if shared.length > 0}
				<div
					in:scale={{ start: 0.9, duration: reduceMotion ? 0 : 600, delay: reduceMotion ? 0 : 700 }}
					class="venn-card mb-6 rounded-2xl border border-(--teal)/25 p-5"
				>
					<div class="mb-2 flex items-center justify-center gap-2">
						<span class="inline-block h-3 w-3 rounded-full bg-(--green)"></span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-(--teal)"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
							/>
						</svg>
						<span class="inline-block h-3 w-3 rounded-full bg-(--indigo-text)"></span>
					</div>
					<h3 class="font-display mb-1 text-sm font-bold text-(--teal)">Where Your Brains Agree</h3>
					<p class="mb-3 text-[10px] font-medium tracking-wider text-[#1a2b3c]/40 uppercase">
						{shared.length} feature{shared.length !== 1 ? 's' : ''} in both rounds
					</p>
					<div class="flex flex-wrap items-center justify-center gap-2">
						{#each shared as feature, i (feature)}
							<span
								in:scale={{
									start: 0.8,
									duration: reduceMotion ? 0 : 300,
									delay: reduceMotion ? 0 : 800 + i * 60
								}}
								class="inline-flex items-center gap-1.5 rounded-full border border-(--teal)/20 bg-(--teal)/8 px-3 py-1 text-xs font-semibold text-(--teal)"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
								{feature}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Visualise your workspace CTA -->
			<div
				in:fly={{
					y: reduceMotion ? 0 : 15,
					duration: reduceMotion ? 0 : 600,
					delay: reduceMotion ? 0 : 1000
				}}
				class="mb-6"
			>
				<a
					href="/visualise"
					class="visualise-btn group inline-flex items-center gap-3 rounded-2xl border border-(--teal)/30 bg-linear-to-r from-(--teal)/10 to-(--accent)/10 px-8 py-4 text-base font-bold text-(--teal) shadow-sm transition-all hover:-translate-y-0.5 hover:from-(--teal)/15 hover:to-(--accent)/15 hover:shadow-lg"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5 transition-transform group-hover:scale-110"
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
					Visualise Your Workspace
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 transition-transform group-hover:translate-x-1"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</a>
			</div>

			<!-- Download prompt -->
			{#if !showDownload}
				<button
					in:fade={{ duration: reduceMotion ? 0 : 600, delay: reduceMotion ? 0 : 1100 }}
					onclick={() => (showDownload = true)}
					class="mb-6 min-h-[44px] rounded-full border border-[#1a2b3c]/10 bg-white/50 px-6 py-2.5 text-sm font-semibold text-[#1a2b3c]/70 shadow-sm transition-colors hover:bg-white hover:text-(--teal)"
				>
					Want a copy of your results?
				</button>
			{:else}
				<div
					in:fly={{ y: reduceMotion ? 0 : 10, duration: reduceMotion ? 0 : 400 }}
					class="mx-auto mb-6 flex max-w-xs flex-col gap-3"
				>
					{#if emailSent}
						<div class="flex items-center justify-center gap-2 text-sm text-(--green)">
							<span>&#x2713;</span> We'll send your results to {email}
						</div>
					{:else}
						<input
							type="text"
							bind:value={name}
							placeholder="Your name (optional)"
							aria-label="Your name"
							class="w-full rounded-2xl border border-[#1a2b3c]/10 bg-white/60 px-5 py-3.5 text-sm text-[#1a2b3c] placeholder-[#1a2b3c]/40 transition-all outline-none focus:border-(--teal) focus:bg-white focus:shadow-sm"
						/>
						<input
							type="email"
							bind:value={email}
							placeholder="Email address"
							aria-label="Email address"
							class="w-full rounded-2xl border border-[#1a2b3c]/10 bg-white/60 px-5 py-3.5 text-sm text-[#1a2b3c] placeholder-[#1a2b3c]/40 transition-all outline-none focus:border-(--teal) focus:bg-white focus:shadow-sm"
						/>
						<Button
							disabled={!email.includes('@')}
							onclick={() => {
								emailSent = true;
							}}
						>
							Send me my results
						</Button>
					{/if}
				</div>
			{/if}

			<!-- Footer prompt -->
			<p
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 1300 }}
				class="text-sm font-medium tracking-wide text-[#1a2b3c]/60"
			>
				Look up at the screen for the group results!
			</p>
		{/if}
	</div>
</div>

<style>
	.venn-card {
		background: linear-gradient(
			135deg,
			rgba(0, 200, 83, 0.04) 0%,
			rgba(0, 191, 165, 0.08) 50%,
			rgba(92, 107, 192, 0.04) 100%
		);
	}

	.visualise-btn {
		box-shadow: 0 4px 20px rgba(0, 191, 165, 0.1);
	}
	.visualise-btn:hover {
		box-shadow: 0 8px 30px rgba(0, 191, 165, 0.2);
	}
</style>
