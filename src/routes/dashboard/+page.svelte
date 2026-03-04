<script lang="ts">
	import type { PageData } from './$types';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { DashboardState } from './state.svelte';
	import AppBackground from '$lib/components/AppBackground.svelte';
	import BrandFooter from '$lib/components/BrandFooter.svelte';
	import QrCode from '$lib/components/QrCode.svelte';
	import ResetButton from '$lib/components/ResetButton.svelte';
	import ParticleField from '$lib/components/ParticleField.svelte';
	import TopThreePodium from '$lib/components/TopThreePodium.svelte';
	import StageNav from '$lib/components/StageNav.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';
	import MetricStrip from '$lib/components/MetricStrip.svelte';
	import ConsensusView from '$lib/components/ConsensusView.svelte';
	import { ChevronLeft } from '@lucide/svelte';

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

<AppBackground theme="teal">
	<ParticleField participantCount={s.results.participantCount} phase="individual" />

	<div class="h-full px-4 py-2 md:px-8">
		<div class="mx-auto max-w-6xl">
			{#if !s.showResults}
				<!-- ===== LOBBY ===== -->
				<div class="flex h-dvh flex-col items-center justify-center text-center">
					<BrandFooter class="mb-3" />

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
				<!-- ===== PAGED ANALYTICS (3 pages) ===== -->
				<div class="flex min-h-dvh flex-col gap-2 pb-2">
					<!-- Compact top bar -->
					<header class="flex items-center justify-between pt-2 pb-2">
						<button
							type="button"
							class="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
							onclick={() => { s.showResults = false; s.page = 1; }}
						>
							<ChevronLeft size={14} /> Lobby
						</button>
						<span class="text-xs font-medium tracking-wide text-white/40">
							{s.results.session.title}
						</span>
						<span class="text-xs font-bold tracking-wider text-white/40 tabular-nums">
							{s.page}/{DashboardState.TOTAL_PAGES}
						</span>
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
						<!-- Hero page title -->
						<div class="text-center">
							<h2 class="font-display text-2xl font-black tracking-tight text-white md:text-3xl">
								{currentMeta.title}
							</h2>
							<p class="text-xs font-medium tracking-wide text-white/50 italic">
								{currentMeta.subtitle}
							</p>
						</div>

						{#if s.page === 3}
							<MetricStrip
								totalVotes={s.results.voteCount}
								evidenceScore={s.overallEvidenceRatio}
							/>
						{/if}

						<!-- Page content with slide transitions -->
						<div class="stage-slide-container flex-1 {s.page < 3 ? 'mt-8 flex items-center justify-center' : 'mt-2'}">
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
											<TopThreePodium features={s.results.individual.features} />
										{:else if s.page === 2}
											<!-- PAGE 2 — Collective Top 3 -->
											<TopThreePodium features={s.results.communal.features} />
										{:else if s.page === 3}
											<!-- PAGE 3 — Consensus & Alignment -->
											<ConsensusView
												radarDatasets={s.radarDatasets}
												categoryStats={s.categoryStats}
											/>
										{/if}
									</div>
								{/key}
						</div>

						<!-- Page Navigation -->
						<StageNav
							currentPage={s.page - 1}
							totalPages={DashboardState.TOTAL_PAGES}
							onprev={() => s.prevPage()}
							onnext={() => s.nextPage()}
						/>

						<!-- Keyboard hint -->
						<p class="text-center text-[10px] text-white/20">Use arrow keys or spacebar to navigate</p>
					{/if}

					<!-- Research footer -->
					<div class="flex items-center justify-center gap-4 py-1 text-[10px] text-white/25">
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

			<AiPrompt features={s.allFeatures} hidden={true} />
		</div>
	</div>
</AppBackground>
