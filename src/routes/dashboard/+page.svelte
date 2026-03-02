<script lang="ts">
	import type { PageData } from './$types';
	import ScoreStrip from '$lib/components/ScoreStrip.svelte';
	import RankPanel from '$lib/components/RankPanel.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';

	let { data }: { data: PageData } = $props();

	let polledResults: PageData | null = $state(null);
	let justUpdated = $state(false);
	const results = $derived(polledResults ?? data);

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
</script>

<div
	class="min-h-screen px-4 py-10 md:px-8"
	style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
>
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
				class="mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors duration-300"
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
				Live Results
			</div>

			<!-- Stats -->
			<div class="flex items-center justify-center gap-6 text-white/45">
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

		{#if results.voteCount === 0}
			<div class="py-20 text-center">
				<div class="mx-auto mb-6 text-6xl animate-pulse">🧠</div>
				<h2 class="font-display mb-2 text-2xl font-bold text-white">
					Waiting for participants...
				</h2>
				<p class="text-white/45">Results will appear here as votes come in</p>
			</div>
		{:else}
			<!-- Score Strip -->
			<ScoreStrip
				individualScore={results.individual.score}
				communalScore={results.communal.score}
				totalCorrect={results.individual.score + results.communal.score}
			/>

			<!-- Rank Panels -->
			<div class="grid grid-cols-1 gap-6 pb-10 md:px-8 lg:grid-cols-2">
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
			<div class="pb-10 md:px-8">
				<h3 class="font-display mb-5 text-center text-2xl font-bold text-white">
					Practical Next Steps
				</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="rounded-2xl border border-white/6 bg-white/3 p-6">
						<div class="mb-3 text-2xl">⚡</div>
						<h4 class="mb-2 text-lg font-bold text-white">Quick Wins</h4>
						<p class="text-sm leading-relaxed text-white/45">
							Identify the top evidence-based features that scored highly. These represent areas
							where staff intuition aligns with research — implement these first.
						</p>
					</div>
					<div class="rounded-2xl border border-white/6 bg-white/3 p-6">
						<div class="mb-3 text-2xl">🔍</div>
						<h4 class="mb-2 text-lg font-bold text-white">Awareness Gaps</h4>
						<p class="text-sm leading-relaxed text-white/45">
							Look for popular features that lack evidence. These are opportunities for staff
							education about what really drives cognitive performance.
						</p>
					</div>
					<div class="rounded-2xl border border-white/6 bg-white/3 p-6">
						<div class="mb-3 text-2xl">🏢</div>
						<h4 class="mb-2 text-lg font-bold text-white">AWA Deep Dive</h4>
						<p class="text-sm leading-relaxed text-white/45">
							Use these results to commission a detailed AWA x CEBMa cognitive workplace assessment
							tailored to your organisation.
						</p>
					</div>
				</div>
			</div>

			<!-- AI Prompt (hidden) -->
			<AiPrompt features={allTop10Features} hidden={true} />

			<!-- Research Footer -->
			<div class="pb-10 md:px-8">
				<div class="rounded-2xl border border-white/6 bg-white/3 p-8 text-center">
					<div class="mb-3 text-3xl">📚</div>
					<h3 class="font-display mb-3 text-xl font-bold text-white">Research Foundation</h3>
					<p class="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-white/45">
						This exercise is based on the AWA x CEBMa research partnership, combining Andrew
						Mawson's 40+ years of workplace strategy with the Centre for Evidence-Based
						Management's systematic review methodology.
					</p>
					<div class="flex flex-wrap items-center justify-center gap-3">
						<a
							href="https://www.advanced-workplace.com"
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10"
						>
							AWA — Advanced Workplace Associates
						</a>
						<a
							href="https://www.cebma.org"
							target="_blank"
							rel="noopener noreferrer"
							class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10"
						>
							CEBMa — Centre for Evidence-Based Management
						</a>
						<span
							class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-[var(--accent)]"
						>
							Cognitive Workplace Design Research
						</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
