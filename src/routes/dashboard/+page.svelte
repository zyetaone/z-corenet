<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import Histogram from '$lib/components/Histogram.svelte';
	import StageNav from '$lib/components/StageNav.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import ResetButton from '$lib/components/ResetButton.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';

	let { data }: { data: PageData } = $props();

	let polledResults: PageData | null = $state(null);
	let justUpdated = $state(false);
	let showResults = $state(false);
	let stage = $state(0);

	const STAGE_TITLES = [
		'What You Chose',
		'What The Evidence Says',
		'Individual vs Collective',
		'What This Means'
	];
	const TOTAL_STAGES = STAGE_TITLES.length;

	const results = $derived(polledResults ?? data);
	const baseUrl = $derived(typeof window !== 'undefined' ? window.location.origin : '');

	// Merge both phases' features into one sorted list for stages 0-1
	const combinedFeatures = $derived(() => {
		const map = new Map<string, { name: string; category: string; group: string; hasEvidence: boolean; caption: string | null; voteCount: number }>();
		for (const f of [...results.individual.features, ...results.communal.features]) {
			const existing = map.get(f.name);
			if (existing) {
				existing.voteCount += f.voteCount;
			} else {
				map.set(f.name, { ...f });
			}
		}
		const merged = [...map.values()].sort((a, b) => b.voteCount - a.voteCount);
		const totalParticipants = results.participantCount;
		return merged.map((f) => ({
			...f,
			percentage: totalParticipants > 0 ? Math.round((f.voteCount / totalParticipants) * 100) : 0
		}));
	});

	// Evidence ratio stats
	const overallEvidenceRatio = $derived(
		Math.round((results.individual.score + results.communal.score) / 2)
	);

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

	function handleShowResults() {
		showResults = true;
		stage = 0;
	}

	async function handleReset() {
		try {
			const res = await fetch('/api/reset', { method: 'POST' });
			if (res.ok) {
				showResults = false;
				stage = 0;
				polledResults = null;
			}
		} catch {
			// silently ignore reset errors
		}
	}

	function prevStage() {
		if (stage > 0) stage--;
	}
	function nextStage() {
		if (stage < TOTAL_STAGES - 1) stage++;
	}

	// Keyboard navigation
	onMount(() => {
		function onKey(e: KeyboardEvent) {
			if (!showResults) return;
			if (e.key === 'ArrowRight') nextStage();
			else if (e.key === 'ArrowLeft') prevStage();
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	const allFeatures = $derived([
		...results.individual.features,
		...results.communal.features
	]);
</script>

<div class="min-h-screen px-4 py-10 md:px-8 relative z-10">
	{#if !showResults}
		<ParticleField participantCount={results.participantCount} phase="individual" />
	{/if}

	<div class="animated-grid-bg"></div>

	<div class="mx-auto max-w-6xl relative z-10">
		{#if !showResults}
			<!-- ===== LOBBY ===== -->
			<div class="flex min-h-[90vh] flex-col items-center justify-center text-center">
				<div class="mb-6 text-xs font-bold tracking-[0.25em] text-[var(--accent)] uppercase">
					AWA &middot; Cognitive Workplace Design
				</div>

				<h1
					class="font-display mb-4 text-5xl font-bold text-[#1a2b3c] md:text-6xl lg:text-7xl"
					style="line-height: 1.1"
				>
					{results.session.title}
				</h1>

				<p class="mb-10 max-w-lg text-lg text-[#1a2b3c]/60">
					Scan the code below to join from your phone
				</p>

				{#if baseUrl}
					<div class="lobby-qr mb-4 rounded-3xl border border-[#1a2b3c]/10 bg-white p-8 shadow-2xl">
						<QrCode url={baseUrl} size={260} />
					</div>
					<p class="mb-10 font-mono text-base font-semibold tracking-wider text-[#1a2b3c]/50">{baseUrl}</p>
				{/if}

				<div class="mb-12 flex items-center gap-8">
					<div class="flex flex-col items-center">
						<span class="text-5xl font-extrabold text-[#1a2b3c]" style="font-variant-numeric: tabular-nums">{results.participantCount}</span>
						<span class="text-sm font-medium text-[#1a2b3c]/40 uppercase tracking-widest mt-1">joined</span>
					</div>
					<div class="h-10 w-px bg-[#1a2b3c]/10"></div>
					<div class="flex flex-col items-center">
						<span class="text-5xl font-extrabold text-[var(--teal)] drop-shadow-md" style="font-variant-numeric: tabular-nums">{results.voteCount}</span>
						<span class="text-sm font-medium text-[#1a2b3c]/40 uppercase tracking-widest mt-1">voted</span>
					</div>
				</div>

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
			<!-- ===== ANALYTICS — 4 Stage Reveal ===== -->
			<div class="min-h-[90vh] flex flex-col">
				<!-- Header -->
				<header class="relative mb-8 text-center pt-4">
					<div class="absolute right-0 top-4">
						<ResetButton onreset={handleReset} />
					</div>

					<div class="mb-3 text-xs font-bold tracking-[0.25em] text-[var(--accent)] uppercase">
						AWA &middot; Cognitive Workplace Design
					</div>

					<h1
						class="font-display mb-2 text-3xl font-bold text-[#1a2b3c] md:text-4xl lg:text-5xl"
						style="line-height: 1.1"
					>
						{results.session.title}
					</h1>

					<!-- Live badge + stats -->
					<div class="flex items-center justify-center gap-5 mb-6">
						<div
							class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-300"
							style="border-color: rgba(0,191,165,0.3); color: var(--accent); background: rgba(0,191,165,{justUpdated ? 0.2 : 0.1})"
						>
							<span class="relative flex h-2.5 w-2.5">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style="background: var(--accent)"></span>
								<span class="relative inline-flex h-2.5 w-2.5 rounded-full" style="background: var(--accent)"></span>
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

					<!-- Stage title -->
					<h2 class="font-display text-2xl font-bold text-[#1a2b3c] md:text-3xl">
						{STAGE_TITLES[stage]}
					</h2>
				</header>

				<!-- Stage content -->
				<div class="flex-1">
					{#if results.voteCount === 0}
						<div class="py-20 text-center">
							<div class="mx-auto mb-6 text-6xl breathe-slow-anim">&#129504;</div>
							<h2 class="font-display mb-2 text-2xl font-bold text-[#1a2b3c]">
								Waiting for participants...
							</h2>
							<p class="text-[#1a2b3c]/60">Results will appear here as votes come in</p>
						</div>
					{:else if stage === 0}
						<!-- Stage 0: What You Chose — combined histogram, no evidence -->
						<div class="rounded-3xl border border-[#1a2b3c]/10 bg-white/60 shadow-sm backdrop-blur-sm p-6 md:p-8">
							<p class="mb-6 text-center text-sm text-[#1a2b3c]/60">
								All features ranked by total votes across both rounds
							</p>
							<Histogram
								features={combinedFeatures()}
								showEvidence={false}
								maxBars={15}
								animateIn={true}
							/>
						</div>

					{:else if stage === 1}
						<!-- Stage 1: What The Evidence Says — evidence markers appear -->
						<div class="rounded-3xl border border-[#1a2b3c]/10 bg-white/60 shadow-sm backdrop-blur-sm p-6 md:p-8">
							<!-- Evidence ratio stat -->
							<div class="mb-6 flex items-center justify-center gap-3">
								<span class="text-4xl font-extrabold text-[var(--green)]" style="font-variant-numeric: tabular-nums">{overallEvidenceRatio}%</span>
								<span class="text-sm text-[#1a2b3c]/60">of your picks were evidence-based</span>
							</div>
							<Histogram
								features={combinedFeatures()}
								showEvidence={true}
								maxBars={15}
								animateIn={false}
							/>
						</div>

					{:else if stage === 2}
						<!-- Stage 2: Individual vs Collective — side by side -->
						<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
							<div class="rounded-3xl border border-[var(--green)]/20 bg-white/60 shadow-sm backdrop-blur-sm p-6">
								<div class="mb-4 flex items-center gap-3">
									<span class="text-2xl">&#129504;</span>
									<div>
										<h3 class="font-display text-lg font-bold text-[var(--green)]">The Individual Brain</h3>
										<p class="text-xs text-[#1a2b3c]/50">{results.individual.score}% evidence-based</p>
									</div>
								</div>
								<Histogram
									features={results.individual.features}
									showEvidence={true}
									maxBars={10}
									animateIn={true}
								/>
							</div>
							<div class="rounded-3xl border border-[var(--indigo-text)]/20 bg-white/60 shadow-sm backdrop-blur-sm p-6">
								<div class="mb-4 flex items-center gap-3">
									<span class="text-2xl">&#129309;</span>
									<div>
										<h3 class="font-display text-lg font-bold text-[var(--indigo-text)]">The Collective Brain</h3>
										<p class="text-xs text-[#1a2b3c]/50">{results.communal.score}% evidence-based</p>
									</div>
								</div>
								<Histogram
									features={results.communal.features}
									showEvidence={true}
									maxBars={10}
									animateIn={true}
								/>
							</div>
						</div>

					{:else if stage === 3}
						<!-- Stage 3: What This Means -->
						<div class="space-y-6">
							<!-- Interpretation -->
							<div class="rounded-3xl border border-[#1a2b3c]/10 bg-white/60 shadow-sm backdrop-blur-sm p-6 md:p-8 text-center">
								<div class="mb-4 text-5xl font-extrabold text-[var(--green)]" style="font-variant-numeric: tabular-nums">{overallEvidenceRatio}%</div>
								<p class="text-lg font-semibold text-[#1a2b3c] mb-2">Evidence-Based Literacy Score</p>
								<p class="text-sm text-[#1a2b3c]/60 max-w-xl mx-auto">
									{#if overallEvidenceRatio >= 70}
										Your group has strong cognitive workplace literacy. Most selections align with AWA/CEBMa research on what actually drives cognitive performance.
									{:else if overallEvidenceRatio >= 40}
										Your group shows moderate awareness. There's a good foundation, but some popular choices lack evidence — opportunities for education and better decisions.
									{:else}
										There's a significant gap between what your group prioritised and what evidence shows drives cognitive performance. This is common and highlights the value of evidence-based workplace design.
									{/if}
								</p>
							</div>

							<!-- Action cards -->
							<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
								<div class="rounded-2xl border border-[var(--teal)]/20 bg-white/40 shadow-sm p-6">
									<div class="mb-3 text-2xl">&#9889;</div>
									<h4 class="mb-2 text-lg font-bold text-[var(--teal)]">Quick Wins</h4>
									<p class="text-sm leading-relaxed text-[#1a2b3c]/70">
										Identify the top evidence-based features that scored highly. These represent areas where staff intuition aligns with research — implement these first.
									</p>
								</div>
								<div class="rounded-2xl border border-[var(--green)]/20 bg-white/40 shadow-sm p-6">
									<div class="mb-3 text-2xl">&#128269;</div>
									<h4 class="mb-2 text-lg font-bold text-[var(--green)]">Awareness Gaps</h4>
									<p class="text-sm leading-relaxed text-[#1a2b3c]/70">
										Look for popular features that lack evidence. These are opportunities for staff education about what really drives cognitive performance.
									</p>
								</div>
								<div class="rounded-2xl border border-[var(--indigo-text)]/20 bg-white/40 shadow-sm p-6">
									<div class="mb-3 text-2xl">&#127970;</div>
									<h4 class="mb-2 text-lg font-bold text-[var(--indigo-text)]">AWA Deep Dive</h4>
									<p class="text-sm leading-relaxed text-[#1a2b3c]/70">
										Use these results to commission a detailed AWA x CEBMa cognitive workplace assessment tailored to your organisation.
									</p>
								</div>
							</div>

							<!-- Research footer -->
							<div class="rounded-2xl border border-[#1a2b3c]/10 bg-white/40 shadow-sm p-8 text-center">
								<div class="mb-3 text-3xl">&#128218;</div>
								<h3 class="font-display mb-3 text-xl font-bold text-[#1a2b3c]">Research Foundation</h3>
								<p class="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-[#1a2b3c]/70">
									This exercise is based on the AWA x CEBMa research partnership, combining Andrew Mawson's 40+ years of workplace strategy with the Centre for Evidence-Based Management's systematic review methodology.
								</p>
								<div class="flex flex-wrap items-center justify-center gap-3">
									<a href="https://www.advanced-workplace.com" target="_blank" rel="noopener noreferrer"
										class="rounded-full border border-[#1a2b3c]/20 bg-white/80 shadow-xs px-4 py-2 text-xs font-semibold text-[#1a2b3c]/80 transition-colors hover:bg-[var(--teal)]/10">
										AWA — Advanced Workplace Associates
									</a>
									<a href="https://www.cebma.org" target="_blank" rel="noopener noreferrer"
										class="rounded-full border border-[#1a2b3c]/20 bg-white/80 shadow-xs px-4 py-2 text-xs font-semibold text-[#1a2b3c]/80 transition-colors hover:bg-[var(--teal)]/10">
										CEBMa — Centre for Evidence-Based Management
									</a>
									<span class="rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2 text-xs font-semibold" style="color: var(--teal)">
										Cognitive Workplace Design Research
									</span>
								</div>
							</div>

							<!-- Hidden AI Prompt -->
							<AiPrompt features={allFeatures} hidden={true} />
						</div>
					{/if}
				</div>

				<!-- Stage Navigation -->
				{#if results.voteCount > 0}
					<StageNav
						currentStage={stage}
						totalStages={TOTAL_STAGES}
						onprev={prevStage}
						onnext={nextStage}
					/>
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
		0%, 100% { box-shadow: 0 0 0 0 rgba(0, 191, 165, 0); }
		50% { box-shadow: 0 0 20px 4px rgba(0, 191, 165, 0.2); }
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
	}
</style>
