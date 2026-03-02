<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { ActionData, PageData } from './$types';
	import ScoreStrip from '$lib/components/ScoreStrip.svelte';
	import RankPanel from '$lib/components/RankPanel.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isCreating = $state(false);
	let copied = $state(false);

	// After form action returns session code, redirect to dashboard mode
	$effect(() => {
		if (form?.code) {
			goto(`/?code=${form.code}`, { replaceState: true });
		}
	});

	// Dashboard polling
	let polledResults: typeof data | null = $state(null);
	const results = $derived(data.mode === 'dashboard' ? (polledResults ?? data) : null);

	$effect(() => {
		if (data.mode !== 'dashboard') return;
		const code = data.session.code;
		polledResults = null;

		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/session/${code}/votes`);
				if (res.ok) {
					const json = await res.json();
					polledResults = { mode: 'dashboard' as const, ...json };
				}
			} catch {
				// silently ignore polling errors
			}
		}, 4000);
		return () => clearInterval(interval);
	});

	const allTop10Features = $derived(
		results ? [...results.individual.features, ...results.communal.features] : []
	);

	const shareUrl = $derived(
		results && typeof window !== 'undefined'
			? `${window.location.origin}/session/${results.session.code}`
			: results
				? `/session/${results.session.code}`
				: ''
	);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// fallback
		}
	}
	import BrainNetworkBackground from '$lib/components/BrainNetworkBackground.svelte';
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
	style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
>
	<!-- Real-time SVG Brain Network custom background -->
	<BrainNetworkBackground />

	<!-- Add a subtle vignette overlay for depth -->
	<div
		class="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,25,35,0.4)_100%)]"
	></div>

	<div class="relative z-10 w-full">
		{#if data.mode === 'dashboard' && results}
			<!-- ═══ PRESENTER DASHBOARD MODE ═══ -->
			<div class="w-full px-4 py-10 md:px-8">
				<div class="mx-auto max-w-6xl">
					<!-- Header -->
					<header class="mb-10 text-center">
						<div
							class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
							style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 8px 40px rgba(0,139,139,0.4)"
						>
							🧠
						</div>

						<h1
							class="font-display mb-3 text-4xl font-bold text-white md:text-5xl"
							style="line-height: 1.12"
						>
							{results.session.title}
						</h1>

						<!-- Live badge -->
						<div
							class="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--accent)]"
						>
							<span class="relative flex h-2.5 w-2.5">
								<span
									class="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--accent) opacity-75"
								></span>
								<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--accent)"></span>
							</span>
							Live Results
						</div>

						<!-- Stats -->
						<div class="flex items-center justify-center gap-6 text-white/50">
							<div class="flex items-center gap-2">
								<span class="text-lg">👥</span>
								<span class="text-lg font-bold text-white">{results.participantCount}</span>
								<span>joined</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-lg">✅</span>
								<span class="text-lg font-bold text-white">{results.voteCount}</span>
								<span>voted</span>
							</div>
						</div>
					</header>

					<!-- QR Code + Join -->
					<div
						class="mx-auto mb-10 max-w-sm rounded-2xl border border-white/6 bg-white/3 p-6 text-center"
					>
						<h4 class="mb-3 text-sm font-bold tracking-widest text-white/40 uppercase">
							Scan to Join
						</h4>
						<div
							class="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-xl bg-white p-3"
						>
							<img
								src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={encodeURIComponent(
									shareUrl
								)}"
								alt="QR Code to join session"
								class="h-full w-full"
							/>
						</div>
						<div class="mb-2 font-mono text-2xl font-bold tracking-[0.3em] text-[var(--accent)]">
							{results.session.code}
						</div>
						<div class="flex items-center gap-2">
							<input
								type="text"
								readonly
								value={shareUrl}
								class="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-xs text-white/50 outline-none"
							/>
							<button
								onclick={copyLink}
								class="shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:-translate-y-0.5"
								style="background: linear-gradient(135deg, var(--teal), var(--accent))"
							>
								{copied ? 'Copied!' : 'Copy'}
							</button>
						</div>
					</div>

					<!-- Score Strip -->
					<ScoreStrip
						individualScore={results.individual.score}
						communalScore={results.communal.score}
						totalCorrect={results.individual.score + results.communal.score}
					/>

					<!-- Rank Panels -->
					<div class="grid grid-cols-1 gap-6 px-4 pb-10 md:px-12 lg:grid-cols-2">
						<RankPanel
							title="The Individual Brain"
							subtitle="Top 5 features for personal cognitive performance"
							icon="🧠"
							type="individual"
							features={results.individual.features}
							totalVotes={results.participantCount}
						/>
						<RankPanel
							title="The Connected Brain"
							subtitle="Top 5 features for team cognitive performance"
							icon="🤝"
							type="communal"
							features={results.communal.features}
							totalVotes={results.participantCount}
						/>
					</div>

					<!-- Practical Next Steps -->
					<div class="px-4 pb-10 md:px-12">
						<h3 class="font-display mb-5 text-center text-2xl font-bold text-white">
							Practical Next Steps
						</h3>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
							<div class="rounded-2xl border border-white/6 bg-white/3 p-6">
								<div class="mb-3 text-2xl">⚡</div>
								<h4 class="mb-2 text-lg font-bold text-white">Quick Wins</h4>
								<p class="text-sm leading-relaxed text-white/55">
									Identify the top evidence-based features that scored highly. These represent areas
									where staff intuition aligns with research — implement these first.
								</p>
							</div>
							<div class="rounded-2xl border border-white/6 bg-white/3 p-6">
								<div class="mb-3 text-2xl">🔍</div>
								<h4 class="mb-2 text-lg font-bold text-white">Awareness Gaps</h4>
								<p class="text-sm leading-relaxed text-white/55">
									Look for popular features that lack evidence. These are opportunities for staff
									education about what really drives cognitive performance.
								</p>
							</div>
							<div class="rounded-2xl border border-white/6 bg-white/3 p-6">
								<div class="mb-3 text-2xl">🏢</div>
								<h4 class="mb-2 text-lg font-bold text-white">AWA Deep Dive</h4>
								<p class="text-sm leading-relaxed text-white/55">
									Use these results to commission a detailed AWA x CEBMa cognitive workplace
									assessment tailored to your organisation.
								</p>
							</div>
						</div>
					</div>

					<!-- AI Prompt (hidden) -->
					<AiPrompt features={allTop10Features} hidden={true} />

					<!-- Research Footer -->
					<div class="px-4 pb-10 md:px-12">
						<div class="rounded-2xl border border-white/6 bg-white/3 p-8 text-center">
							<div class="mb-3 text-3xl">📚</div>
							<h3 class="font-display mb-3 text-xl font-bold text-white">Research Foundation</h3>
							<p class="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-white/55">
								This exercise is based on the AWA x CEBMa research partnership, combining Andrew
								Mawson's 40+ years of workplace strategy with the Centre for Evidence-Based
								Management's systematic review methodology.
							</p>
							<div class="flex flex-wrap items-center justify-center gap-3">
								<span
									class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70"
								>
									AWA — Advanced Workplace Associates
								</span>
								<span
									class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70"
								>
									CEBMa — Centre for Evidence-Based Management
								</span>
								<span
									class="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2 text-xs font-semibold text-[var(--accent)]"
								>
									Cognitive Workplace Design Research
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- ═══ CREATE SESSION MODE ═══ -->
			<div class="mx-auto w-full max-w-md text-center">
				<div
					class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full text-5xl"
					style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 8px 40px rgba(0,139,139,0.4)"
				>
					🧠
				</div>

				<h1 class="font-display mb-3 text-4xl font-bold text-white" style="line-height: 1.12">
					Designing Workplaces<br />That Think
				</h1>
				<p class="mb-1 text-xs font-bold tracking-[0.25em] text-[var(--accent)] uppercase">
					Cognitive Performance Exercise
				</p>
				<p class="mx-auto mb-10 max-w-sm text-sm leading-relaxed text-white/40">
					Powered by AWA x CEBMa evidence-based research
				</p>

				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						isCreating = true;
						return async ({ update }) => {
							await update();
							isCreating = false;
						};
					}}
					class="space-y-5"
				>
					<input
						name="title"
						type="text"
						placeholder="Session title (optional)"
						value="Designing Workplaces That Think"
						class="w-full rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-center text-base text-white placeholder-white/30 transition-colors outline-none focus:border-[var(--accent)]"
					/>

					<button
						type="submit"
						disabled={isCreating}
						class="w-full rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
						style="background: {isCreating
							? '#444'
							: 'linear-gradient(135deg, var(--teal), var(--accent))'}; box-shadow: {isCreating
							? 'none'
							: '0 4px 28px rgba(0,139,139,0.45)'}"
					>
						{isCreating ? 'Creating...' : 'Start Session →'}
					</button>
				</form>

				<p class="mt-6 text-xs text-white/25">
					28 evidence-based features will be loaded automatically
				</p>
			</div>
		{/if}
	</div>
</div>
