<script lang="ts">
	import type { PageData } from './$types';
	import { DashboardState, RADAR_LABELS } from './state.svelte';
	import Histogram from '$lib/components/Histogram.svelte';
	import CategoryBreakdown from '$lib/components/CategoryBreakdown.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import ResetButton from '$lib/components/ResetButton.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';
	import RadarChart from '$lib/components/RadarChart.svelte';
	import DonutChart from '$lib/components/DonutChart.svelte';
	import AnimatedCounter from '$lib/components/AnimatedCounter.svelte';

	let { data }: { data: PageData } = $props();

	const s = new DashboardState();

	// Keep data in sync with props (handles initial load + SvelteKit invalidation)
	$effect(() => {
		s.data = data;
	});

	// Poll for live updates
	$effect(() => {
		s.polledResults = null;
		const interval = setInterval(() => s.poll(), 4000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Results Dashboard — CoreNet</title>
</svelte:head>

<div class="relative z-10 min-h-screen px-4 py-10 md:px-8">
	{#if !s.showResults}
		<ParticleField participantCount={s.results.participantCount} phase="individual" />
	{/if}

	<div class="animated-grid-bg"></div>

	<div class="relative z-10 mx-auto max-w-6xl">
		{#if !s.showResults}
			<!-- ===== LOBBY ===== -->
			<div class="flex min-h-[90vh] flex-col items-center justify-center text-center">
				<div class="mb-6 text-xs font-bold tracking-[0.25em] text-[#1a2b3c]/40 uppercase">
					Powered by AWA &times; Zyeta
				</div>

				<h1
					class="font-display mb-4 text-5xl font-bold text-[#1a2b3c] md:text-6xl lg:text-7xl"
					style="line-height: 1.1"
				>
					{s.results.session.title}
				</h1>

				<p class="mb-10 max-w-lg text-lg text-[#1a2b3c]/60">
					Scan the code below to join from your phone
				</p>

				{#if s.baseUrl}
					<div class="lobby-qr mb-4 rounded-3xl border border-[#1a2b3c]/10 bg-white p-8 shadow-2xl">
						<QrCode url={s.baseUrl} size={260} />
					</div>
					<p class="mb-10 font-mono text-base font-semibold tracking-wider text-[#1a2b3c]/50">
						{s.baseUrl}
					</p>
				{/if}

				<div class="mb-12 flex items-center gap-8">
					<div class="flex flex-col items-center">
						<span
							class="text-5xl font-extrabold text-[#1a2b3c]"
							style="font-variant-numeric: tabular-nums">{s.results.participantCount}</span
						>
						<span class="mt-1 text-sm font-medium tracking-widest text-[#1a2b3c]/40 uppercase"
							>joined</span
						>
					</div>
					<div class="h-10 w-px bg-[#1a2b3c]/10"></div>
					<div class="flex flex-col items-center">
						<span
							class="text-5xl font-extrabold text-(--accent) drop-shadow-md"
							style="font-variant-numeric: tabular-nums">{s.results.voteCount}</span
						>
						<span class="mt-1 text-sm font-medium tracking-widest text-[#1a2b3c]/40 uppercase"
							>voted</span
						>
					</div>
				</div>

				<button
					type="button"
					class="show-results-btn cursor-pointer rounded-2xl border px-12 py-5 text-xl font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30"
					class:has-votes={s.results.voteCount > 0}
					disabled={s.results.voteCount === 0}
					onclick={() => s.handleShowResults()}
				>
					Reveal Results
				</button>
			</div>
		{:else}
			<!-- ===== ANALYTICS — Single Page ===== -->
			<div class="flex min-h-[90vh] flex-col gap-6">
				<!-- Compact header -->
				<header class="relative flex items-center justify-between pt-4">
					<div>
						<div class="text-xs font-bold tracking-[0.25em] text-[#1a2b3c]/40 uppercase">
							Powered by AWA &times; Zyeta
						</div>
						<h1
							class="font-display text-2xl font-bold text-[#1a2b3c] md:text-3xl lg:text-4xl"
							style="line-height: 1.1"
						>
							{s.results.session.title}
						</h1>
					</div>
					<div class="flex items-center gap-4">
						<!-- Live badge -->
						<div
							class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-300"
							style="border-color: rgba(0,191,165,0.3); color: var(--accent); background: rgba(0,191,165,{s.justUpdated
								? 0.2
								: 0.1})"
						>
							<span class="relative flex h-2.5 w-2.5">
								<span
									class="absolute inline-flex h-full w-full rounded-full motion-safe:animate-ping {s.polling
										? 'opacity-50'
										: 'opacity-75'}"
									style="background: var(--accent)"
								></span>
								<span
									class="relative inline-flex h-2.5 w-2.5 rounded-full {s.polling
										? 'opacity-50'
										: ''}"
									style="background: var(--accent)"
								></span>
							</span>
							Live
						</div>
						<ResetButton onreset={() => s.handleReset()} />
					</div>
				</header>

				<!-- Stat counters -->
				<div
					class="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-[#1a2b3c]/10 bg-white/60 px-8 py-5 shadow-sm backdrop-blur-sm md:gap-8"
				>
					<AnimatedCounter value={s.results.participantCount} label="Participants" />
					<div class="hidden h-10 w-px bg-[#1a2b3c]/10 md:block"></div>
					<AnimatedCounter value={s.results.voteCount} label="Votes" color="var(--teal)" />
					<div class="hidden h-10 w-px bg-[#1a2b3c]/10 md:block"></div>
					<AnimatedCounter
						value={s.overallEvidenceRatio}
						label="Evidence"
						suffix="%"
						color="var(--green)"
					/>
				</div>

				<!-- Waiting state if no votes -->
				{#if s.results.voteCount === 0}
					<div class="py-20 text-center">
						<div class="breathe-slow-anim mx-auto mb-6 text-6xl">&#129504;</div>
						<h2 class="font-display mb-2 text-2xl font-bold text-[#1a2b3c]">
							Waiting for participants...
						</h2>
						<p class="text-[#1a2b3c]/60">Results will appear here as votes come in</p>
					</div>
				{:else}
					<!-- 2x2 Chart Grid -->
					<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<!-- TOP: Key Insights -->
						<div
							class="col-span-1 rounded-2xl border border-[#1a2b3c]/10 bg-white/40 p-6 md:p-8 lg:col-span-2"
						>
							<h3
								class="font-display mb-4 text-sm font-bold tracking-widest text-[#1a2b3c]/50 uppercase"
							>
								AWA &times; Zyeta Insights
							</h3>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
								{#if s.topOverallFeature}
									<div class="rounded-2xl bg-white/60 p-5 shadow-sm">
										<div class="mb-1 text-xs font-bold tracking-wide text-(--accent) uppercase">
											Top Priority
										</div>
										<div class="mb-2 text-lg leading-tight font-bold text-[#1a2b3c]">
											{s.topOverallFeature.name}
										</div>
										<p class="text-xs text-[#1a2b3c]/60">
											Captured the most votes across both phases.
										</p>
									</div>
								{/if}
								{#if s.topCategory}
									<div class="rounded-2xl bg-white/60 p-5 shadow-sm">
										<div class="mb-1 text-xs font-bold tracking-wide text-(--teal) uppercase">
											Dominant Theme
										</div>
										<div class="mb-2 text-lg leading-tight font-bold text-[#1a2b3c]">
											{s.topCategory.label}
										</div>
										<p class="text-xs text-[#1a2b3c]/60">
											Accounted for {s.topCategory.percentage}% of all selections.
										</p>
									</div>
								{/if}
								<div class="rounded-2xl bg-white/60 p-5 shadow-sm">
									<div class="mb-1 text-xs font-bold tracking-wide text-(--indigo-text) uppercase">
										Alignment Score
									</div>
									<div class="mb-2 text-2xl leading-tight font-black text-[#1a2b3c] tabular-nums">
										{s.consensusAlignment}%
									</div>
									<p class="text-xs text-[#1a2b3c]/60">
										Overlap between individual and collective top 5 priorities.
									</p>
								</div>
							</div>
						</div>

						<!-- TOP-LEFT: Radar Chart -->
						<div
							class="rounded-2xl border border-[#1a2b3c]/10 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
						>
							<h3 class="mb-3 text-center text-sm font-semibold text-[#1a2b3c]/50">
								Category Radar
							</h3>
							<div class="mx-auto max-w-[320px]">
								<RadarChart datasets={s.radarDatasets} labels={RADAR_LABELS} size={300} />
							</div>
							<!-- Legend -->
							<div class="mt-3 flex items-center justify-center gap-6 text-xs font-semibold">
								<span class="flex items-center gap-1.5">
									<span class="h-2.5 w-2.5 rounded-full" style="background: var(--green)"></span>
									Individual
								</span>
								<span class="flex items-center gap-1.5">
									<span class="h-2.5 w-2.5 rounded-full" style="background: var(--indigo-text)"
									></span>
									Communal
								</span>
							</div>
						</div>

						<!-- TOP-RIGHT: Histogram -->
						<div
							class="rounded-2xl border border-[#1a2b3c]/10 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
						>
							<h3 class="mb-3 text-center text-sm font-semibold text-[#1a2b3c]/50">Top Features</h3>
							<Histogram
								features={s.combinedFeatures}
								showEvidence={true}
								maxBars={10}
								animateIn={true}
							/>
						</div>

						<!-- BOTTOM-LEFT: Donut Chart -->
						<div
							class="rounded-2xl border border-[#1a2b3c]/10 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
						>
							<h3 class="mb-3 text-center text-sm font-semibold text-[#1a2b3c]/50">
								Evidence Alignment
							</h3>
							<div class="mx-auto max-w-[220px]">
								<DonutChart
									segments={s.evidenceSegments}
									centerText="{s.overallEvidenceRatio}%"
									centerSubtext="evidence-backed"
									size={220}
								/>
							</div>
						</div>

						<!-- BOTTOM-RIGHT: Category Breakdown -->
						<div
							class="rounded-2xl border border-[#1a2b3c]/10 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
						>
							<h3 class="mb-3 text-center text-sm font-semibold text-[#1a2b3c]/50">By Category</h3>
							<CategoryBreakdown
								categories={s.categoryStats}
								maxVotes={s.categoryStats.length > 0 ? s.categoryStats[0].totalVotes : 1}
							/>
						</div>
					</div>

					<!-- Comments (compact, if any) -->
					{#if s.results.comments.length > 0}
						<div class="rounded-2xl border border-[#1a2b3c]/10 bg-white/40 p-5 shadow-sm">
							<h3 class="font-display mb-3 text-sm font-bold text-[#1a2b3c]/60">
								&#128172; Comments
							</h3>
							<div class="flex flex-wrap gap-2">
								{#each s.results.comments as comment (comment.id)}
									<div
										class="rounded-xl bg-[#1a2b3c]/3 px-3 py-2 text-xs leading-relaxed text-[#1a2b3c]/70 italic"
									>
										&ldquo;{comment.text}&rdquo;
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Research footer (very compact) -->
					<div class="flex items-center justify-center gap-4 py-4 text-xs text-[#1a2b3c]/30">
						<span>Based on AWA &times; CEBMa research</span>
						<span>&middot;</span>
						<a
							href="https://www.advanced-workplace.com"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-[#1a2b3c]/50"
						>
							AWA
						</a>
						<span>&middot;</span>
						<a
							href="https://www.cebma.org"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-[#1a2b3c]/50"
						>
							CEBMa
						</a>
						<span>&middot;</span>
						<a
							href="https://www.zyeta.com"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-[#1a2b3c]/50"
						>
							Zyeta
						</a>
					</div>
				{/if}

				<!-- Hidden AI Prompt (keep) -->
				<AiPrompt features={s.allFeatures} hidden={true} />
			</div>
		{/if}
	</div>
</div>

