<script lang="ts">
	import type { PageData } from './$types';
	import { Dashboard2State, RADAR_LABELS } from './state.svelte';
	import BucketDistribution from '$lib/components/BucketDistribution.svelte';
	import CategoryBreakdown from '$lib/components/CategoryBreakdown.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import ResetButton from '$lib/components/ResetButton.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';
	import RadarChart from '$lib/components/RadarChart.svelte';
	import DonutChart from '$lib/components/DonutChart.svelte';
	import AnimatedCounter from '$lib/components/AnimatedCounter.svelte';

	let { data }: { data: PageData } = $props();

	const s = new Dashboard2State();

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
	<title>Bucket Analysis — CoreNet</title>
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
				<div class="mb-6 text-xs font-bold tracking-[0.25em] text-[#1a2b3c]/50 uppercase">
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
							class="text-5xl font-extrabold text-(--teal) drop-shadow-md"
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
			<!-- ===== ANALYTICS — Single-Page Graphical View ===== -->
			<div class="flex min-h-[90vh] flex-col gap-6">
				<!-- Compact header -->
				<header class="relative flex items-center justify-between pt-4">
					<div>
						<div class="text-xs font-bold tracking-[0.25em] text-[#1a2b3c]/50 uppercase">
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

				<!-- Stat counters row -->
				<div
					class="flex items-center justify-center gap-8 rounded-2xl border border-[#1a2b3c]/10 bg-white/60 px-8 py-5 shadow-sm backdrop-blur-sm"
				>
					<AnimatedCounter value={s.results.participantCount} label="Participants" />
					<div class="h-10 w-px bg-[#1a2b3c]/10"></div>
					<AnimatedCounter value={s.totalAll} label="Sorted" color="var(--teal)" />
					<div class="h-10 w-px bg-[#1a2b3c]/10"></div>
					<AnimatedCounter
						value={s.individualPct}
						label="Individual"
						suffix="%"
						color="var(--green)"
					/>
				</div>

				{#if s.results.voteCount === 0}
					<div class="py-20 text-center">
						<div class="breathe-slow-anim mx-auto mb-6 text-6xl">&#x1F0CF;</div>
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
							class="col-span-1 border-b border-[#1a2b3c]/10 bg-white/40 p-6 md:p-8 lg:col-span-2"
						>
							<h3
								class="font-display mb-4 text-sm font-bold tracking-widest text-[#1a2b3c]/50 uppercase"
							>
								AWA &times; Zyeta Insights
							</h3>
							<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
								{#if s.topCategory}
									<div class="rounded-2xl bg-white/60 p-5 shadow-sm">
										<div class="mb-1 text-xs font-bold tracking-wide text-(--accent) uppercase">
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
								{#if s.mostDivisive}
									<div class="rounded-2xl bg-white/60 p-5 shadow-sm">
										<div class="mb-1 text-xs font-bold tracking-wide text-(--teal) uppercase">
											Most Divisive
										</div>
										<div class="mb-2 text-lg leading-tight font-bold text-[#1a2b3c]">
											{s.mostDivisive.name}
										</div>
										<p class="text-xs text-[#1a2b3c]/60">
											Highest split between Individual vs Communal priority.
										</p>
									</div>
								{/if}
								{#if s.topCommunalShift}
									<div class="rounded-2xl bg-white/60 p-5 shadow-sm">
										<div
											class="mb-1 text-xs font-bold tracking-wide text-(--indigo-text) uppercase"
										>
											Biggest Consensus Shift
										</div>
										<div class="mb-2 text-lg leading-tight font-bold text-[#1a2b3c]">
											{s.topCommunalShift.name}
										</div>
										<p class="text-xs text-[#1a2b3c]/60">
											+{s.topCommunalShift.shift}% increase in support during the Collective
											phase.
										</p>
									</div>
								{:else}
									<div class="rounded-2xl bg-white/60 p-5 shadow-sm">
										<div
											class="mb-1 text-xs font-bold tracking-wide text-(--indigo-text) uppercase"
										>
											Consensus Alignment
										</div>
										<div
											class="mb-2 text-2xl leading-tight font-black text-[#1a2b3c] tabular-nums"
										>
											High
										</div>
										<p class="text-xs text-[#1a2b3c]/60">
											No extreme consensus shifts detected between phases.
										</p>
									</div>
								{/if}
							</div>
						</div>

						<!-- Radar Chart -->
						<div
							class="rounded-2xl border border-[#1a2b3c]/10 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
						>
							<h3 class="mb-3 text-center text-sm font-semibold text-[#1a2b3c]/50">
								Sorting Profile
							</h3>
							<div class="mx-auto max-w-[320px]">
								<RadarChart datasets={s.radarDatasets} labels={RADAR_LABELS} size={300} />
							</div>
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

						<!-- Bucket Distribution -->
						<div
							class="rounded-2xl border border-[#1a2b3c]/10 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
						>
							<h3 class="mb-3 text-center text-sm font-semibold text-[#1a2b3c]/50">
								How You Sorted
							</h3>
							<BucketDistribution features={s.bucketFeatures.slice(0, 10)} />
						</div>

						<!-- Individual vs Communal Donut -->
						<div
							class="rounded-2xl border border-[#1a2b3c]/10 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
						>
							<h3 class="mb-3 text-center text-sm font-semibold text-[#1a2b3c]/50">
								Individual vs Communal
							</h3>
							<div class="mx-auto max-w-[220px]">
								<DonutChart
									segments={s.bucketSegments}
									centerText="{s.individualPct}%"
									centerSubtext="individual focus"
									size={220}
								/>
							</div>
						</div>

						<!-- Category Breakdown -->
						<div
							class="rounded-2xl border border-[#1a2b3c]/10 bg-white/60 p-5 shadow-sm backdrop-blur-sm"
						>
							<h3 class="mb-3 text-center text-sm font-semibold text-[#1a2b3c]/50">
								Category Split
							</h3>
							<CategoryBreakdown
								categories={s.categorySplitStats}
								maxVotes={s.categorySplitStats.length > 0
									? s.categorySplitStats[0].totalVotes
									: 1}
							/>
						</div>
					</div>

					<!-- Comments compact -->
					{#if s.results.comments.length > 0}
						<div class="rounded-2xl border border-[#1a2b3c]/10 bg-white/40 p-5 shadow-sm">
							<h3 class="font-display mb-3 text-sm font-bold text-[#1a2b3c]/60">
								&#x1F4AC; Comments
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

					<!-- Research footer compact -->
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

				<AiPrompt features={s.allFeatures} hidden={true} />
			</div>
		{/if}
	</div>
</div>

<style>
	.show-results-btn {
		border-color: rgba(26, 43, 60, 0.15);
		background: rgba(26, 43, 60, 0.03);
		color: rgba(26, 43, 60, 0.25);
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

	.show-results-btn:disabled {
		cursor: not-allowed;
		opacity: 0.3;
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

	.breathe-slow-anim {
		animation: breathe-slow 4s ease-in-out infinite;
	}
	@keyframes breathe-slow {
		0%,
		100% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.breathe-slow-anim {
			animation: none;
			opacity: 0.8;
		}
	}
</style>
