<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let mounted = $state(false);
	let reduceMotion = $state(false);
	let name = $state('');
	let email = $state('');
	let showDownload = $state(false);
	let emailSent = $state(false);

	const topIndividual = $derived(data.individual);
	const topCommunal = $derived(data.communal);

	// Evidence scoring
	const indEvidenceCount = $derived(topIndividual.filter((f) => f.hasEvidence).length);
	const comEvidenceCount = $derived(topCommunal.filter((f) => f.hasEvidence).length);
	const totalCorrect = $derived(indEvidenceCount + comEvidenceCount);
	const totalPicks = $derived(topIndividual.length + topCommunal.length);
	const literacyPct = $derived(totalPicks > 0 ? Math.round((totalCorrect / totalPicks) * 100) : 0);

	// Three-tier scoring message from original HTML
	const scoreMessage = $derived.by(() => {
		if (totalPicks === 0) return { title: '', text: '', tone: '' as const };
		const ratio = totalPicks > 0 ? totalCorrect / totalPicks : 0;
		if (ratio >= 0.8) {
			return {
				title: 'Outstanding!',
				text: 'Your picks are strongly aligned with workplace research. You have excellent instincts for what actually works.',
				tone: 'excellent' as const
			};
		}
		if (ratio >= 0.5) {
			return {
				title: 'Good instincts!',
				text: 'Most of your picks are backed by research. A few choices might surprise you when you see the evidence.',
				tone: 'good' as const
			};
		}
		return {
			title: 'A common result',
			text: "Workplace design assumptions often don't match the research. That's exactly why this exercise matters.",
			tone: 'common' as const
		};
	});

	// Features that appear in BOTH phases (compare by name)
	const shared = $derived.by(() => {
		const indSet = new Set(topIndividual.map((f) => f.name));
		return topCommunal.filter((f) => indSet.has(f.name));
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

			<!-- Evidence Literacy Score -->
			{#if totalPicks > 0}
				{@const borderColor =
					scoreMessage.tone === 'excellent'
						? 'border-color: rgba(0,200,83,0.3)'
						: scoreMessage.tone === 'good'
							? 'border-color: rgba(245,158,11,0.3)'
							: 'border-color: rgba(26,43,60,0.15)'}
				{@const textColor =
					scoreMessage.tone === 'excellent'
						? 'color: var(--green)'
						: scoreMessage.tone === 'good'
							? 'color: rgb(217,119,6)'
							: 'color: rgba(26,43,60,0.7)'}
				{@const barColor =
					scoreMessage.tone === 'excellent'
						? 'var(--green)'
						: scoreMessage.tone === 'good'
							? 'rgb(217,119,6)'
							: 'rgba(26,43,60,0.3)'}
				<div
					in:scale={{
						start: 0.9,
						duration: reduceMotion ? 0 : 700,
						delay: reduceMotion ? 0 : 300
					}}
					class="literacy-card mb-6 rounded-2xl border p-5"
					style={borderColor}
				>
					<div class="mb-2 text-xs font-bold tracking-widest uppercase" style={textColor}>
						Workplace Literacy
					</div>
					<div class="mb-1 text-4xl font-black tabular-nums" style={textColor}>
						{literacyPct}%
					</div>
					<!-- Progress bar -->
					<div
						class="literacy-bar mx-auto mb-3 h-2.5 w-full max-w-[200px] overflow-hidden rounded-full"
					>
						<div
							class="h-full rounded-full transition-all duration-1000 ease-out"
							style="width: {literacyPct}%; background: {barColor}"
						></div>
					</div>
					<div class="mb-2 text-lg font-bold text-[#1a2b3c]">{scoreMessage.title}</div>
					<p class="text-xs leading-relaxed text-[#1a2b3c]/60">{scoreMessage.text}</p>
					<div class="mt-3 flex items-center justify-center gap-6">
						<div class="flex flex-col items-center">
							<span class="text-lg font-black text-(--green) tabular-nums"
								>{indEvidenceCount}<span class="text-sm font-bold text-[#1a2b3c]/30"
									>/{topIndividual.length}</span
								></span
							>
							<span class="text-[10px] font-bold tracking-wider text-[#1a2b3c]/40 uppercase"
								>individual</span
							>
						</div>
						<div class="h-8 w-px bg-[#1a2b3c]/10"></div>
						<div class="flex flex-col items-center">
							<span class="text-lg font-black text-(--indigo-text) tabular-nums"
								>{comEvidenceCount}<span class="text-sm font-bold text-[#1a2b3c]/30"
									>/{topCommunal.length}</span
								></span
							>
							<span class="text-[10px] font-bold tracking-wider text-[#1a2b3c]/40 uppercase"
								>collective</span
							>
						</div>
					</div>
				</div>
			{/if}

			<!-- Top Individual + Top Collective side by side -->
			<div
				in:fly={{
					y: reduceMotion ? 0 : 20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 450
				}}
				class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2"
			>
				<!-- Individual column -->
				<div class="rounded-2xl border border-(--green)/20 bg-(--green)/5 p-5">
					<div class="mb-3 text-2xl">&#x1F9E0;</div>
					<h3 class="font-display mb-1 text-sm font-bold text-(--green)">Individual Brain</h3>
					<p class="mb-3 text-[10px] font-medium tracking-wider text-[#1a2b3c]/40 uppercase">
						{indEvidenceCount}/{topIndividual.length} evidence-based
					</p>
					<ol class="space-y-3 text-left">
						{#each topIndividual as feature, i (feature.name)}
							<li
								in:fly={{
									x: reduceMotion ? 0 : -12,
									duration: reduceMotion ? 0 : 400,
									delay: reduceMotion ? 0 : 550 + i * 80
								}}
								class="flex items-start gap-2"
							>
								<span
									class="evidence-badge mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
									class:evidence-yes={feature.hasEvidence}
									class:evidence-no={!feature.hasEvidence}
									class:evidence-green={feature.hasEvidence}
								>
									{#if feature.hasEvidence}&#10003;{:else}{i + 1}{/if}
								</span>
								<div class="min-w-0">
									<span
										class="text-xs leading-relaxed font-medium {feature.hasEvidence
											? 'text-[#1a2b3c]'
											: 'text-[#1a2b3c]/50'}">{feature.name}</span
									>
									{#if feature.caption}
										<p class="mt-0.5 text-[10px] leading-snug text-(--green-text)/70 italic">
											{feature.caption}
										</p>
									{/if}
								</div>
							</li>
						{/each}
					</ol>
				</div>

				<!-- Collective column -->
				<div class="rounded-2xl border border-(--indigo-text)/20 bg-(--indigo-text)/5 p-5">
					<div class="mb-3 text-2xl">&#x1F91D;</div>
					<h3 class="font-display mb-1 text-sm font-bold text-(--indigo-text)">Collective Brain</h3>
					<p class="mb-3 text-[10px] font-medium tracking-wider text-[#1a2b3c]/40 uppercase">
						{comEvidenceCount}/{topCommunal.length} evidence-based
					</p>
					<ol class="space-y-3 text-left">
						{#each topCommunal as feature, i (feature.name)}
							<li
								in:fly={{
									x: reduceMotion ? 0 : 12,
									duration: reduceMotion ? 0 : 400,
									delay: reduceMotion ? 0 : 550 + i * 80
								}}
								class="flex items-start gap-2"
							>
								<span
									class="evidence-badge mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
									class:evidence-yes={feature.hasEvidence}
									class:evidence-no={!feature.hasEvidence}
									class:evidence-indigo={feature.hasEvidence}
								>
									{#if feature.hasEvidence}&#10003;{:else}{i + 1}{/if}
								</span>
								<div class="min-w-0">
									<span
										class="text-xs leading-relaxed font-medium {feature.hasEvidence
											? 'text-[#1a2b3c]'
											: 'text-[#1a2b3c]/50'}">{feature.name}</span
									>
									{#if feature.caption}
										<p class="mt-0.5 text-[10px] leading-snug text-(--indigo-text)/70 italic">
											{feature.caption}
										</p>
									{/if}
								</div>
							</li>
						{/each}
					</ol>
				</div>
			</div>

			<!-- Intersection / Overlap -->
			{#if shared.length > 0}
				<div
					in:scale={{ start: 0.9, duration: reduceMotion ? 0 : 600, delay: reduceMotion ? 0 : 800 }}
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
						{#each shared as feature, i (feature.name)}
							<span
								in:scale={{
									start: 0.8,
									duration: reduceMotion ? 0 : 300,
									delay: reduceMotion ? 0 : 900 + i * 60
								}}
								class="shared-pill inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
								class:shared-evidence={feature.hasEvidence}
								class:shared-no-evidence={!feature.hasEvidence}
							>
								{#if feature.hasEvidence}
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
								{/if}
								{feature.name}
							</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Download prompt -->
			{#if !showDownload}
				<button
					in:fade={{ duration: reduceMotion ? 0 : 600, delay: reduceMotion ? 0 : 1200 }}
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
				in:fade={{ duration: reduceMotion ? 0 : 800, delay: reduceMotion ? 0 : 1400 }}
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

	.literacy-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%);
		backdrop-filter: blur(8px);
	}

	.literacy-bar {
		background: rgba(26, 43, 60, 0.08);
	}

	/* Evidence badge colors */
	.evidence-yes.evidence-green {
		background: rgba(0, 200, 83, 0.15);
		color: var(--green);
	}
	.evidence-yes.evidence-indigo {
		background: rgba(92, 107, 192, 0.15);
		color: var(--indigo-text);
	}
	.evidence-no {
		background: rgba(239, 68, 68, 0.1);
		color: var(--red-text);
	}

	/* Shared pills */
	.shared-evidence {
		border-color: rgba(0, 191, 165, 0.2);
		background: rgba(0, 191, 165, 0.08);
		color: var(--teal);
	}
	.shared-no-evidence {
		border-color: rgba(239, 68, 68, 0.2);
		background: rgba(239, 68, 68, 0.05);
		color: rgba(26, 43, 60, 0.6);
	}

</style>
