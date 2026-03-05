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
	import MasonryTicker from '$lib/components/MasonryTicker.svelte';
	import ImageModal from '$lib/components/ImageModal.svelte';
	import WorkspaceImage from '$lib/components/WorkspaceImage.svelte';
	import AiLoader from '$lib/components/AiLoader.svelte';
	import { ChevronLeft, Sparkles } from '@lucide/svelte';

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

	// Poll workspace images when results are shown
	$effect(() => {
		if (!s.showResults) return;
		const interval = setInterval(() => s.pollWorkspaceImages(), 5000);
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
		{ title: 'Fuelling the Individual Brain', subtitle: "The session's results for the individual" },
		{ title: 'Fuelling the Collective Brain', subtitle: "The session's results for the collective" },
		{ title: 'Consensus & Alignment', subtitle: 'Comparing focus areas and collective weight' },
		{ title: 'Workspace Gallery', subtitle: 'Individual and collective workspace visualisations' }
	] as const;

	const flyX = $derived(s.direction === 'forward' ? 300 : -300);
	const currentMeta = $derived(PAGE_META[s.page - 1]);

	// Page 4 state
	let selectedImage = $state<{
		participantName: string;
		imageData: string;
		featureNames: string[];
		prompt?: string;
	} | null>(null);

	let collectiveGenerating = $state(false);
	let collectiveProgress = $state(0);
	let collectiveProgressInterval: ReturnType<typeof setInterval> | null = null;

	function startCollectiveProgress() {
		collectiveProgress = 0;
		collectiveProgressInterval = setInterval(() => {
			if (collectiveProgress < 90) {
				collectiveProgress = Math.min(90, collectiveProgress + Math.random() * 20);
			}
		}, 400);
	}

	function stopCollectiveProgress() {
		if (collectiveProgressInterval) clearInterval(collectiveProgressInterval);
		collectiveProgress = 100;
	}

	async function generateCollective(additionalPrompt?: string) {
		collectiveGenerating = true;
		startCollectiveProgress();

		try {
			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type: 'collective', additionalPrompt })
			});

			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const result = await res.json();
			stopCollectiveProgress();

			s.collectiveImage = result.imageData;
			s.collectivePrompt = result.prompt;
			s.collectiveGenerationsRemaining = result.generationsRemaining;
		} catch (e) {
			console.error('Collective generation failed:', e);
		} finally {
			collectiveGenerating = false;
			stopCollectiveProgress();
		}
	}
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
						class="mb-2 font-display text-6xl font-bold text-white md:text-7xl lg:text-8xl"
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
							<h2 class="font-display text-4xl font-black tracking-tight text-white md:text-5xl">
								{currentMeta.title}
							</h2>
							<p class="mt-2 text-base font-medium tracking-wide text-white/70">
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
						<div class="stage-slide-container flex-1 {s.page <= 2 ? 'mt-8 flex items-center justify-center' : 'mt-2'}">
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
										{:else if s.page === 4}
											<!-- PAGE 4 — Workspace Gallery -->
											<div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
												<!-- Left: Individual gallery (60%) -->
												<div class="lg:col-span-3">
													<h3 class="mb-2 text-sm font-bold tracking-wider text-white/50 uppercase">
														Individual Workspaces
													</h3>
													{#if s.workspaceImages.individual.length === 0}
														<div class="flex h-64 items-center justify-center rounded-2xl border border-white/8 bg-white/5">
															<p class="text-sm text-white/30">No workspace images yet — participants can generate from the results page</p>
														</div>
													{:else}
														<div class="h-[60vh]">
															<MasonryTicker
																images={s.workspaceImages.individual}
																onselect={(img) => (selectedImage = img)}
															/>
														</div>
													{/if}
												</div>

												<!-- Right: Collective workspace (40%) -->
												<div class="lg:col-span-2">
													<h3 class="mb-2 text-sm font-bold tracking-wider text-white/50 uppercase">
														Collective Workspace
													</h3>
													<div class="rounded-2xl border border-white/8 bg-white/5 p-4">
														{#if collectiveGenerating}
															<AiLoader progress={collectiveProgress} message="Creating collective workspace..." dark={true} />
														{:else if s.collectiveImage}
															<WorkspaceImage
																imageData={s.collectiveImage}
																prompt={s.collectivePrompt}
																generationsRemaining={s.collectiveGenerationsRemaining}
																onregenerate={(additionalPrompt) => generateCollective(additionalPrompt)}
																dark={true}
															/>
														{:else}
															<div class="flex flex-col items-center gap-4 py-12">
																<Sparkles size={32} class="text-accent" />
																<p class="text-center text-sm text-white/50">
																	Generate a workspace from the group's top-voted features
																</p>
																<button
																	type="button"
																	class="rounded-xl bg-gradient-to-r from-teal to-accent px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
																	onclick={() => generateCollective()}
																>
																	Create Workspace from Collective Votes
																</button>
															</div>
														{/if}
													</div>
												</div>
											</div>
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

	{#if selectedImage}
		<ImageModal image={selectedImage} onclose={() => (selectedImage = null)} />
	{/if}
</AppBackground>
