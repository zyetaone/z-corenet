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
	import PillLabel from '$lib/components/PillLabel.svelte';
	import { ChevronLeft, Sparkles, Trash2 } from '@lucide/svelte';

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
	let collectiveProgressMsg = $state('Creating collective workspace...');

	let collectiveImageHistory = $state<Array<{ imageData: string; prompt: string }>>([]);
	let canUndoCollective = $derived(collectiveImageHistory.length > 0);

	function clearCollectiveImage() {
		s.collectiveImage = null;
		s.collectivePrompt = '';
		collectiveImageHistory = [];
	}

	function undoCollectiveImage() {
		const prev = collectiveImageHistory[collectiveImageHistory.length - 1];
		if (prev) {
			collectiveImageHistory = collectiveImageHistory.slice(0, -1);
			s.collectiveImage = prev.imageData;
			s.collectivePrompt = prev.prompt;
		}
	}

	async function generateCollective(opts?: { additionalPrompt?: string; editInPlace?: boolean }) {
		const { additionalPrompt, editInPlace } = opts ?? {};
		collectiveGenerating = true;
		collectiveProgress = 0;
		collectiveProgressMsg = editInPlace ? 'Editing collective workspace...' : additionalPrompt ? 'Regenerating collective workspace...' : 'Preparing generation...';

		const trackingId = crypto.randomUUID();
		let eventSource: EventSource | null = null;

		try {
			eventSource = new EventSource(`/api/generate-image/progress?id=${trackingId}`);
			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.progress !== undefined) collectiveProgress = data.progress;
					if (data.message) collectiveProgressMsg = data.message;
				} catch (e) {
					// parsing error ignored
				}
			};

			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'collective',
					additionalPrompt,
					trackingId,
					previousImageData: editInPlace && s.collectiveImage ? s.collectiveImage : undefined
				})
			});

			if (!res.ok) throw new Error(`HTTP ${res.status}`);

			const result = await res.json();
			collectiveProgress = 100;

			// Push current to history for undo
			if (s.collectiveImage) {
				collectiveImageHistory = [...collectiveImageHistory, { imageData: s.collectiveImage, prompt: s.collectivePrompt }];
			}
			s.collectiveImage = result.imageData;
			s.collectivePrompt = result.prompt;
			s.collectiveGenerationsRemaining = result.generationsRemaining;
		} catch (e) {
			collectiveProgress = 100;
			console.error('Collective generation failed:', e);
		} finally {
			collectiveGenerating = false;
			eventSource?.close();
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
						class="mb-2 font-display text-5xl font-bold text-white md:text-6xl lg:text-[4.5rem] xl:text-[5.5rem]"
						style="line-height: 1.05"
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
						<ResetButton onreset={(pin) => s.handleReset(pin)} />
					</div>
				</div>
			{:else}
				<!-- ===== PAGED ANALYTICS (3 pages) ===== -->
				<div class="flex min-h-dvh flex-col gap-2 pb-2">
					<!-- Compact top bar -->
					<header class="flex items-center justify-between pt-2 pb-2">
						<button
							type="button"
							class="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
							onclick={() => { s.showResults = false; s.page = 1; }}
						>
							<ChevronLeft size={16} /> Lobby
						</button>
						<span class="text-lg font-bold tracking-wide text-white/80 md:text-xl">
							{s.results.session.title}
						</span>
						<span class="text-sm font-bold tracking-wider text-white/60 tabular-nums">
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
							<h2 class="font-display text-5xl font-black tracking-tight text-white md:text-[4.5rem]" style="line-height: 1.1">
								{currentMeta.title}
							</h2>
							<p class="mt-2 text-lg font-medium tracking-wide text-white/70">
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
											<div class="flex h-full min-h-[75vh] flex-col gap-6 lg:flex-row">
												<!-- Left: Individual gallery (60%) -->
												<div class="flex-1 lg:w-3/5">
													<div class="mb-4">
														<PillLabel>Individual Workspaces</PillLabel>
													</div>
													{#if s.workspaceImages.individual.length === 0}
														<div class="flex h-[60vh] items-center justify-center rounded-2xl border border-white/8 bg-white/5">
															<p class="text-sm text-white/30">No workspace images yet — participants can generate from the results page</p>
														</div>
													{:else}
														<div class="h-[75vh]">
															<MasonryTicker
																images={s.workspaceImages.individual}
																onselect={(img) => (selectedImage = img)}
															/>
														</div>
													{/if}
												</div>

												<!-- Right: Collective workspace (40%) -->
												<div class="flex flex-col lg:w-2/5">
													<div class="mb-4 flex items-center justify-between">
														<PillLabel>Collective Workspace</PillLabel>
														{#if s.collectiveImage}
															<button
																type="button"
																class="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-white/30 transition-colors hover:bg-white/10 hover:text-white/60"
																onclick={clearCollectiveImage}
															>
																<Trash2 size={12} /> Clear
															</button>
														{/if}
													</div>
													<div class="flex-1 rounded-2xl border border-white/8 bg-white/5 p-4 flex flex-col justify-center">
														{#if collectiveGenerating && !s.collectiveImage}
															<AiLoader progress={collectiveProgress} message={collectiveProgressMsg} dark={true} />
														{:else if s.collectiveImage}
															<div class="relative h-full w-full">
																<div class={collectiveGenerating ? 'pointer-events-none opacity-50 blur-sm transition-all duration-500 h-full w-full' : 'transition-all duration-500 h-full w-full'}>
																	<WorkspaceImage
																		imageData={s.collectiveImage}
																		prompt={s.collectivePrompt || ''}
																		generationsRemaining={s.collectiveGenerationsRemaining}
																		onregenerate={() => generateCollective()}
																		onedit={(editPrompt) => generateCollective({ additionalPrompt: editPrompt, editInPlace: true })}
																		onundo={undoCollectiveImage}
																		canUndo={canUndoCollective}
																		dark={true}
																	/>
																</div>
																{#if collectiveGenerating}
																	<div class="absolute inset-x-0 -top-6 bottom-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm">
																		<AiLoader progress={collectiveProgress} message={collectiveProgressMsg} dark={true} showCredit={false} />
																	</div>
																{/if}
															</div>
														{:else}
															<div class="flex flex-col items-center gap-5 px-6 py-14 text-center">
																<div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-white/80 shadow-inner ring-1 ring-white/10">
																	<Sparkles size={32} />
																</div>
																<div>
																	<h3 class="mb-2 font-display text-xl font-bold tracking-tight text-white">
																		Visualise the Session's Priorities
																	</h3>
																	<p class="text-sm font-medium leading-relaxed text-white/50">
																		Transform the session's top-voted features into an evidence-driven workspace visualisation — individual choices meet data-backed design.
																	</p>
																</div>
																<button
																	type="button"
																	class="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white px-8 py-4 text-[13px] font-black tracking-wide text-teal shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] hover:bg-slate-50 hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] active:scale-95 lg:w-auto"
																	onclick={() => generateCollective()}
																>
																	<span>GENERATE WORKSPACE</span>
																	<Sparkles size={16} class="transition-transform group-hover:scale-110" />
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
