<script lang="ts">
	import type { PageData } from './$types';
	import ScoreStrip from '$lib/components/ScoreStrip.svelte';
	import RankPanel from '$lib/components/RankPanel.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import ResetButton from '$lib/components/ResetButton.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';

	let { data }: { data: PageData } = $props();

	let polledResults: PageData | null = $state(null);
	let justUpdated = $state(false);
	let showResults = $state(false);
	let animateIn = $state(false);

	const results = $derived(polledResults ?? data);

	// Derive the base URL for the QR code
	const baseUrl = $derived(typeof window !== 'undefined' ? window.location.origin : '');

	$effect(() => {
		polledResults = null;

		const interval = setInterval(async () => {
			try {
				const res = await fetch('/api/votes');
				if (res.ok) {
					polledResults = await res.json();
					justUpdated = true;
					setTimeout(() => (justUpdated = false), 600);
				}
			} catch {
				// silently ignore polling errors
			}
		}, 4000);
		return () => clearInterval(interval);
	});

	const allTop10Features = $derived([
		...results.individual.features,
		...results.communal.features
	]);

	function handleShowResults() {
		showResults = true;
		// Trigger staggered animation after a tick
		setTimeout(() => (animateIn = true), 50);
	}

	async function handleReset() {
		try {
			const res = await fetch('/api/reset', { method: 'POST' });
			if (res.ok) {
				showResults = false;
				animateIn = false;
				polledResults = null;
			}
		} catch {
			// silently ignore reset errors
		}
	}
</script>

<div
	class="min-h-screen px-4 py-10 md:px-8 relative z-10"
>
	{#if !showResults}
		<ParticleField participantCount={results.participantCount} phase="individual" />
	{/if}

	<div class="animated-grid-bg"></div>

	<div class="mx-auto max-w-6xl relative z-10">
		{#if !showResults}
			<!-- ===== STATE 1: LOBBY ===== -->
			<div class="flex min-h-[90vh] flex-col items-center justify-center text-center">
				<!-- AWA brand mark -->
				<div class="mb-6 text-xs font-bold tracking-[0.25em] text-[var(--accent)] uppercase">
					AWA &middot; Cognitive Workplace Design
				</div>

				<!-- Hero title -->
				<h1
					class="font-display mb-4 text-5xl font-bold text-[#1a2b3c] md:text-6xl lg:text-7xl"
					style="line-height: 1.1"
				>
					{results.session.title}
				</h1>

				<p class="mb-10 max-w-lg text-lg text-[#1a2b3c]/60">
					Scan the code below to join from your phone
				</p>

				<!-- QR Code block -->
				{#if baseUrl}
					<div class="lobby-qr mb-4 rounded-3xl border border-[#1a2b3c]/10 bg-white p-8 shadow-2xl">
						<QrCode url={baseUrl} size={260} />
					</div>
					<p class="mb-10 font-mono text-base font-semibold tracking-wider text-[#1a2b3c]/50">{baseUrl}</p>
				{/if}

				<!-- Live counters -->
				<div class="mb-12 flex items-center gap-8">
					<div class="flex flex-col items-center">
						<span class="text-5xl font-extrabold text-[#1a2b3c]" style="font-variant-numeric: tabular-nums">{results.participantCount}</span>
						<span class="text-sm font-medium text-[#1a2b3c]/40 uppercase tracking-widest mt-1">joined</span>
					</div>
					<div class="h-10 w-px bg-[#1a2b3c]/10"></div>
					<div class="flex flex-col items-center">
						<span class="text-5xl font-extrabold text-(--teal) drop-shadow-md" style="font-variant-numeric: tabular-nums">{results.voteCount}</span>
						<span class="text-sm font-medium text-[#1a2b3c]/40 uppercase tracking-widest mt-1">voted</span>
					</div>
				</div>

				<!-- Show Results button -->
				<button
					type="button"
					class="show-results-btn cursor-pointer rounded-2xl border px-12 py-5 text-xl font-bold transition-all duration-300"
					class:has-votes={results.voteCount > 0}
					disabled={results.voteCount === 0}
					onclick={handleShowResults}
				>
					Reveal Results
				</button>
			</div>
		{:else}
			<!-- ===== STATE 2: ANALYTICS ===== -->
			<div class="analytics-container" class:animate-in={animateIn}>
				<!-- Header with Reset button -->
				<header class="relative mb-12 text-center">
					<!-- Reset button (top-right) -->
					<div class="absolute right-0 top-0">
						<ResetButton onreset={handleReset} />
					</div>

					<!-- AWA brand mark -->
					<div class="mb-5 text-xs font-bold tracking-[0.25em] text-(--accent) uppercase">
						AWA &middot; Cognitive Workplace Design
					</div>

					<h1
						class="font-display mb-4 text-4xl font-bold text-[#1a2b3c] md:text-5xl lg:text-6xl"
						style="line-height: 1.1"
					>
						{results.session.title}
					</h1>

					<!-- Live badge + stats row -->
					<div class="flex items-center justify-center gap-5">
						<div
							class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-300"
							style="border-color: rgba(0,191,165,0.3); color: var(--accent); background: rgba(0,191,165,{justUpdated ? 0.2 : 0.1})"
						>
							<span class="relative flex h-2.5 w-2.5">
								<span
									class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
									style="background: var(--accent)"
								></span>
								<span
									class="relative inline-flex h-2.5 w-2.5 rounded-full"
									style="background: var(--accent)"
								></span>
							</span>
							Live
						</div>
						<span class="text-[#1a2b3c]/20">&middot;</span>
						<span class="text-sm font-medium text-[#1a2b3c]/50">
							<span class="font-bold text-[#1a2b3c]" style="font-variant-numeric: tabular-nums">{results.participantCount}</span> participants
						</span>
						<span class="text-[#1a2b3c]/20">&middot;</span>
						<span class="text-sm font-medium text-[#1a2b3c]/50">
							<span class="font-bold text-[#1a2b3c]" style="font-variant-numeric: tabular-nums">{results.voteCount}</span> voted
						</span>
					</div>
				</header>

				{#if results.voteCount === 0}
					<div class="py-20 text-center">
						<div class="mx-auto mb-6 text-6xl breathe-slow-anim">&#129504;</div>
						<h2 class="font-display mb-2 text-2xl font-bold text-[#1a2b3c]">
							Waiting for participants...
						</h2>
						<p class="text-[#1a2b3c]/60">Results will appear here as votes come in</p>
					</div>
				{:else}
					<!-- Score Strip -->
					<div class="analytics-card mb-6" style="animation-delay: 0ms">
						<ScoreStrip
							individualScore={results.individual.score}
							communalScore={results.communal.score}
							overallScore={Math.round((results.individual.score + results.communal.score) / 2)}
						/>
					</div>

					<!-- Rank Panels -->
					<div
						class="analytics-card grid grid-cols-1 gap-6 mb-6 pb-6 md:px-8 lg:grid-cols-2"
						style="animation-delay: 100ms"
					>
						<RankPanel
							title="The Individual Brain"
							subtitle="Top 5 features for personal cognitive performance"
							icon="&#129504;"
							type="individual"
							features={results.individual.features}
							totalVotes={results.participantCount}
						/>
						<RankPanel
							title="The Collective Brain"
							subtitle="Top 5 features for team cognitive performance"
							icon="&#129309;"
							type="communal"
							features={results.communal.features}
							totalVotes={results.participantCount}
						/>
					</div>

					<!-- Practical Next Steps -->
					<div class="analytics-card mb-6 pb-6 md:px-8" style="animation-delay: 200ms">
						<h3 class="font-display mb-5 text-center text-2xl font-bold text-[#1a2b3c]">
							Practical Next Steps
						</h3>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div class="rounded-2xl border border-(--teal)/20 bg-white/40 shadow-sm p-6">
								<div class="mb-3 text-2xl">&#9889;</div>
								<h4 class="mb-2 text-lg font-bold text-(--teal)">Quick Wins</h4>
								<p class="text-sm leading-relaxed text-[#1a2b3c]/70">
									Identify the top evidence-based features that scored highly. These represent areas
									where staff intuition aligns with research — implement these first.
								</p>
							</div>
							<div class="rounded-2xl border border-(--green)/20 bg-white/40 shadow-sm p-6">
								<div class="mb-3 text-2xl">&#128269;</div>
								<h4 class="mb-2 text-lg font-bold text-(--green-dim)">Awareness Gaps</h4>
								<p class="text-sm leading-relaxed text-[#1a2b3c]/70">
									Look for popular features that lack evidence. These are opportunities for staff
									education about what really drives cognitive performance.
								</p>
							</div>
							<div class="rounded-2xl border border-(--indigo-text)/20 bg-white/40 shadow-sm p-6">
								<div class="mb-3 text-2xl">&#127970;</div>
								<h4 class="mb-2 text-lg font-bold text-(--indigo)">AWA Deep Dive</h4>
								<p class="text-sm leading-relaxed text-[#1a2b3c]/70">
									Use these results to commission a detailed AWA x CEBMa cognitive workplace
									assessment tailored to your organisation.
								</p>
							</div>
						</div>
					</div>

					<!-- AI Prompt (hidden) -->
					<AiPrompt features={allTop10Features} hidden={true} />

					<!-- Research Footer -->
					<div class="analytics-card pb-6 md:px-8" style="animation-delay: 300ms">
						<div class="rounded-2xl border border-(--dark2)/10 bg-white/40 shadow-sm p-8 text-center">
							<div class="mb-3 text-3xl">&#128218;</div>
							<h3 class="font-display mb-3 text-xl font-bold text-[#1a2b3c]">Research Foundation</h3>
							<p class="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-[#1a2b3c]/70">
								This exercise is based on the AWA x CEBMa research partnership, combining Andrew
								Mawson's 40+ years of workplace strategy with the Centre for Evidence-Based
								Management's systematic review methodology.
							</p>
							<div class="flex flex-wrap items-center justify-center gap-3">
								<a
									href="https://www.advanced-workplace.com"
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-full border border-[#1a2b3c]/20 bg-white/80 shadow-xs px-4 py-2 text-xs font-semibold text-[#1a2b3c]/80 transition-colors hover:bg-(--teal)/10"
								>
									AWA — Advanced Workplace Associates
								</a>
								<a
									href="https://www.cebma.org"
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-full border border-[#1a2b3c]/20 bg-white/80 shadow-xs px-4 py-2 text-xs font-semibold text-[#1a2b3c]/80 transition-colors hover:bg-(--teal)/10"
								>
									CEBMa — Centre for Evidence-Based Management
								</a>
								<span
									class="rounded-full border border-(--accent)/30 bg-(--accent)/10 px-4 py-2 text-xs font-semibold"
									style="color: var(--teal)"
								>
									Cognitive Workplace Design Research
								</span>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.show-results-btn {
		border-color: rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.03);
		color: rgba(255, 255, 255, 0.25);
	}

	.show-results-btn.has-votes {
		border-color: var(--accent);
		background: rgba(0, 191, 165, 0.15);
		color: var(--accent);
		animation: gentle-pulse 2.5s ease-in-out infinite;
	}

	.show-results-btn.has-votes:hover {
		background: rgba(0, 191, 165, 0.25);
		transform: translateY(-1px);
	}

	.show-results-btn.has-votes:active {
		transform: translateY(0);
	}

	.show-results-btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}

	.lobby-qr {
		box-shadow: 0 0 60px rgba(0, 191, 165, 0.08);
	}

	@keyframes gentle-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(0, 191, 165, 0);
		}
		50% {
			box-shadow: 0 0 20px 4px rgba(0, 191, 165, 0.2);
		}
	}

	/* Analytics cards fly/fade in */
	.analytics-card {
		opacity: 0;
		transform: translateY(30px);
	}

	.analytics-container.animate-in .analytics-card {
		animation: fly-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes fly-in {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.analytics-container.animate-in .analytics-card {
			animation: none;
			opacity: 1;
			transform: none;
		}
	}

	.breathe-slow-anim {
		animation: breathe-slow 4s ease-in-out infinite;
	}
	@keyframes breathe-slow {
		0%, 100% { opacity: 0.6; }
		50% { opacity: 1; }
	}
	
	@media (prefers-reduced-motion: reduce) {
		.breathe-slow-anim { animation: none; opacity: 0.8; }
		.analytics-container.animate-in .analytics-card {
			animation: none;
			opacity: 1;
			transform: none;
		}
	}
</style>
