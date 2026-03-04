<script lang="ts">
	import type { PageData } from './$types';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { DashboardState } from './state.svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import ResetButton from '$lib/components/ResetButton.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';
	import TopThreePodium from '$lib/components/TopThreePodium.svelte';
	import StageNav from '$lib/components/StageNav.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';
	import MetricStrip from '$lib/components/MetricStrip.svelte';
	import ConsensusView from '$lib/components/ConsensusView.svelte';

	let { data }: { data: PageData } = $props();
	const s = new DashboardState(() => data);

	// Restore page from URL on first load
	if (typeof window !== 'undefined') {
		const pageParam = new URL(window.location.href).searchParams.get('page');
		if (pageParam) {
			const parsed = parseInt(pageParam, 10);
			if (parsed >= 1 && parsed <= DashboardState.TOTAL_PAGES) {
				s.showResults = true;
				s.page = parsed;
			}
		}
	}

	// Sync page state → URL query param
	$effect(() => {
		const url = new URL(window.location.href);
		if (s.showResults) {
			url.searchParams.set('page', String(s.page));
		} else {
			url.searchParams.delete('page');
		}
		history.replaceState(history.state, '', url);
	});

	// Poll for live updates
	$effect(() => {
		s.polledResults = null;
		const interval = setInterval(() => s.poll(), 4000);
		return () => clearInterval(interval);
	});

	// Keyboard navigation for pages
	function handleKeydown(e: KeyboardEvent) {
		if (!s.showResults || s.results.voteCount === 0) return;
		const tag = document.activeElement?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (e.key === 'ArrowRight' || e.key === ' ') {
			e.preventDefault();
			s.nextPage();
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			s.prevPage();
		}
	}

	const PAGE_META = [
		{ title: 'Fuelling the Individual Brain', subtitle: 'Your top 3 personal priorities' },
		{ title: 'Fuelling the Collective Brain', subtitle: 'Your top 3 team priorities' },
		{ title: 'Consensus & Alignment', subtitle: 'Comparing focus areas and collective weight' }
	] as const;

	const flyX = $derived(s.direction === 'forward' ? 300 : -300);
	const currentMeta = $derived(PAGE_META[s.page - 1]);
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Results Dashboard — CoreNet</title>
</svelte:head>

<div class="bg-teal-gradient theme-dark-blue relative min-h-dvh">
	<div class="animated-grid-bg"></div>
	<ParticleField participantCount={s.results.participantCount} phase="individual" />

	<div class="relative z-10 h-full px-4 py-4 md:px-8">
		<div class="mx-auto max-w-6xl">
			{#if !s.showResults}
				<!-- ===== LOBBY ===== -->
				<div class="flex h-dvh flex-col items-center justify-center text-center">
					<div class="mb-3 text-xs font-bold tracking-[0.25em] text-white/40 uppercase">
						Powered by AWA &times; Zyeta
					</div>

					<h1
						class="mb-2 font-display text-4xl font-bold text-white md:text-5xl lg:text-6xl"
						style="line-height: 1.1"
					>
						{s.results.session.title}
					</h1>

					<p class="mb-6 max-w-lg text-lg text-white/60">
						Scan the code below to join from your phone
					</p>

					{#if s.baseUrl}
						<div class="lobby-qr mb-3 rounded-3xl border border-white/15 bg-white p-6 shadow-2xl">
							<QrCode url={s.baseUrl} size={220} />
						</div>
						<p class="mb-6 font-mono text-sm font-semibold tracking-wider text-white/50">
							{s.baseUrl}
						</p>
					{/if}

					<div class="mb-6 flex items-baseline gap-3">
						<span class="text-2xl font-bold text-white/70 tabular-nums"
							>{s.results.voteCount}</span
						>
						<span class="text-xs font-medium tracking-widest text-white/40 uppercase"
							>voted</span
						>
					</div>

					<button
						type="button"
						class="show-results-btn cursor-pointer rounded-2xl border px-10 py-4 text-lg font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30"
						class:has-votes={s.results.voteCount > 0}
						disabled={s.results.voteCount === 0}
						onclick={() => s.handleShowResults()}
					>
						Reveal Results
					</button>

					<div class="fixed right-4 bottom-4 z-20 opacity-40 transition-opacity hover:opacity-100">
						<ResetButton onreset={() => s.handleReset()} />
					</div>
				</div>
			{:else}
				<!-- ===== PAGED ANALYTICS (2 pages) ===== -->
				<div class="flex h-dvh flex-col gap-6">
					<!-- Header -->
					<header class="relative flex items-center justify-between pt-4">
						<div>
							<div class="text-xs font-bold tracking-[0.25em] text-white/40 uppercase">
								Powered by AWA &times; Zyeta
							</div>
							<h1
								class="font-display text-2xl font-bold text-white md:text-3xl lg:text-4xl"
								style="line-height: 1.1"
							>
								{s.results.session.title}
							</h1>
						</div>
						<div class="flex items-center gap-4">
							<!-- Live badge -->
							<div
								class="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-white transition-colors duration-300"
								style="background: rgba(255,255,255,{s.justUpdated ? 0.15 : 0.08})"
							>
								<span class="relative flex h-2.5 w-2.5">
									<span
										class="absolute inline-flex h-full w-full rounded-full bg-white motion-safe:animate-ping {s.polling
											? 'opacity-50'
											: 'opacity-75'}"
									></span>
									<span
										class="relative inline-flex h-2.5 w-2.5 rounded-full bg-white {s.polling
											? 'opacity-50'
											: ''}"
									></span>
								</span>
								Live
							</div>
							<ResetButton onreset={() => s.handleReset()} />
						</div>
					</header>

					<!-- Waiting state if no votes -->
					{#if s.results.voteCount === 0}
						<div class="py-20 text-center">
							<div class="breathe-slow-anim mx-auto mb-6 text-6xl">&#129504;</div>
							<h2 class="mb-2 font-display text-2xl font-bold text-white">
								Waiting for participants...
							</h2>
							<p class="text-white/60">Results will appear here as votes come in</p>
						</div>
					{:else}
						<!-- Page title with badge -->
						<div class="mb-2 text-center">
							<div class="mb-3 flex justify-center">
								<div class="rounded-2xl bg-white/5 p-4 text-4xl shadow-inner backdrop-blur-md">
									{#if s.page === 3}
										🎯
									{:else}
										🧠
									{/if}
								</div>
							</div>
							<h2 class="font-display text-2xl font-black tracking-tight text-white md:text-3xl">
								{currentMeta.title}
							</h2>
							<p class="mt-1 text-sm font-medium tracking-wide text-white/40 italic">
								{currentMeta.subtitle}
							</p>
						</div>

						{#if s.page === 3}
							<MetricStrip
								totalVotes={s.results.voteCount}
								evidenceScore={s.overallEvidenceRatio}
								consensusScore={s.consensusAlignment}
							/>
						{/if}

						<!-- Page content with slide transitions -->
						<div class="stage-slide-container flex-1">
							<svelte:boundary>
								{#key s.page}
									<div
										in:fly={{
											x: flyX,
											duration: 400,
											delay: 80,
											easing: cubicOut
										}}
										out:fly={{
											x: -flyX,
											duration: 300,
											easing: cubicOut
										}}
									>
										{#if s.page === 1}
											<!-- PAGE 1 — Individual Top 3 -->
											<TopThreePodium features={s.results.individual.features} totalCount={0} />
										{:else if s.page === 2}
											<!-- PAGE 2 — Collective Top 3 -->
											<TopThreePodium features={s.results.communal.features} totalCount={0} />
										{:else if s.page === 3}
											<!-- PAGE 3 — Consensus & Alignment -->
											<ConsensusView
												radarDatasets={s.radarDatasets}
												categoryStats={s.categoryStats}
											/>
										{/if}
									</div>
								{/key}

								{#snippet failed(error, reset)}
									<div class="glass-panel rounded-2xl p-8 text-center">
										<p class="mb-2 text-lg font-semibold text-white/70">
											Something went wrong rendering this page.
										</p>
										<p class="mb-4 text-sm text-white/40">
											{error instanceof Error ? error.message : 'Unknown error'}
										</p>
										<button
											type="button"
											class="rounded-xl border border-white/15 bg-white/10 px-6 py-2 text-sm font-semibold text-white/60 transition-colors hover:bg-white/15"
											onclick={reset}
										>
											Try again
										</button>
									</div>
								{/snippet}
							</svelte:boundary>
						</div>

						<!-- Page Navigation -->
						<StageNav
							currentPage={s.page - 1}
							totalPages={DashboardState.TOTAL_PAGES}
							onprev={() => s.prevPage()}
							onnext={() => s.nextPage()}
						/>

						<!-- Keyboard hint -->
						<p class="text-center text-xs text-white/25">Use arrow keys or spacebar to navigate</p>
					{/if}

					<!-- Research footer -->
					<div class="flex items-center justify-center gap-4 py-4 text-xs text-white/30">
						<span>Based on AWA &times; CEBMa research</span>
						<span>&middot;</span>
						<a
							href="https://www.advanced-workplace.com"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-white/60"
						>
							AWA
						</a>
						<span>&middot;</span>
						<a
							href="https://www.cebma.org"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-white/60"
						>
							CEBMa
						</a>
						<span>&middot;</span>
						<a
							href="https://www.zyeta.com"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-white/60"
						>
							Zyeta
						</a>
					</div>
				</div>
			{/if}

			<!-- Hidden AI Prompt (keep) -->
			<AiPrompt features={s.allFeatures} hidden={true} />
		</div>
	</div>
</div>
