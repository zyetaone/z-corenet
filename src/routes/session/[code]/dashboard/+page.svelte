<script lang="ts">
	import type { PageData } from './$types';
	import ScoreStrip from '$lib/components/ScoreStrip.svelte';
	import RankPanel from '$lib/components/RankPanel.svelte';
	import AiPrompt from '$lib/components/AiPrompt.svelte';

	let { data }: { data: PageData } = $props();

	let polledResults: PageData | null = $state(null);
	let copied = $state(false);

	const results = $derived(polledResults ?? data);

	$effect(() => {
		const code = data.session.code;
		polledResults = null;

		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/session/${code}/votes`);
				if (res.ok) {
					polledResults = await res.json();
				}
			} catch {
				// silently ignore polling errors
			}
		}, 4000);
		return () => clearInterval(interval);
	});

	const allTop10Features = $derived([...results.individual.features, ...results.communal.features]);

	const shareUrl = $derived(
		typeof window !== 'undefined'
			? `${window.location.origin}/session/${data.session.code}`
			: `/session/${data.session.code}`
	);

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// fallback: select the input
		}
	}
</script>

<div
	class="min-h-screen px-4 py-10 md:px-8"
	style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
>
	<div class="mx-auto max-w-6xl">
		<!-- Dashboard Header -->
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

			<div
				class="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5 text-sm font-semibold text-[var(--accent)]"
			>
				<span class="relative flex h-2.5 w-2.5">
					<span
						class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75"
					></span>
					<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]"></span>
				</span>
				Live Results
			</div>

			<div class="flex items-center justify-center gap-6 text-white/50">
				<div class="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
						/>
					</svg>
					<span class="text-lg font-bold text-white">{results.participantCount}</span>
					<span>participants</span>
				</div>
				<div class="flex items-center gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
						<path
							fill-rule="evenodd"
							d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<span class="text-lg font-bold text-white">{results.voteCount}</span>
					<span>voted</span>
				</div>
			</div>
		</header>

		<!-- Score Strip -->
		<ScoreStrip
			individualScore={results.individual.score}
			communalScore={results.communal.score}
			totalCorrect={results.individual.score + results.communal.score}
		/>

		<!-- Rank Panels -->
		<div class="grid grid-cols-1 gap-6 px-12 pb-10 lg:grid-cols-2">
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
		<div class="px-12 pb-10">
			<h3 class="font-display mb-5 text-center text-2xl font-bold text-white">
				Practical Next Steps
			</h3>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="rounded-2xl border border-white/6 bg-white/3 p-6">
					<div class="mb-3 text-2xl">⚡</div>
					<h4 class="mb-2 text-lg font-bold text-white">Quick Wins</h4>
					<p class="text-sm leading-relaxed text-white/55">
						Identify the top evidence-based features that scored highly. These represent areas where
						staff intuition aligns with research — implement these first.
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
						Use these results to commission a detailed AWA x CEBMa cognitive workplace assessment
						tailored to your organisation.
					</p>
				</div>
			</div>
		</div>

		<!-- AI Prompt (hidden) -->
		<AiPrompt features={allTop10Features} hidden={true} />

		<!-- Research Footer -->
		<div class="px-12 pb-10">
			<div class="rounded-2xl border border-white/6 bg-white/3 p-8 text-center">
				<div class="mb-3 text-3xl">📚</div>
				<h3 class="font-display mb-3 text-xl font-bold text-white">Research Foundation</h3>
				<p class="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-white/55">
					This exercise is based on the AWA x CEBMa research partnership, combining Andrew Mawson's
					40+ years of workplace strategy with the Centre for Evidence-Based Management's systematic
					review methodology.
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
						class="rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2 text-xs font-semibold text-[var(--accent)]"
					>
						Cognitive Workplace Design Research
					</span>
				</div>
			</div>
		</div>

		<!-- Share Link -->
		<div class="px-12 pb-12">
			<div class="rounded-2xl border border-white/6 bg-white/3 p-6 text-center">
				<h4 class="mb-3 text-sm font-bold tracking-widest text-white/40 uppercase">
					Share Session Link
				</h4>
				<div class="mx-auto flex max-w-lg items-center gap-3">
					<input
						type="text"
						readonly
						value={shareUrl}
						class="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center text-sm text-white/70 outline-none"
					/>
					<button
						onclick={copyLink}
						class="shrink-0 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
						style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 4px 20px rgba(0,139,139,0.3)"
					>
						{copied ? 'Copied!' : 'Copy'}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
