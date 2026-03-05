<script lang="ts">
	import { Brain, UsersRound, Check, Sparkles } from '@lucide/svelte';
	import type { PageData } from './$types';
	import AppBackground from '$lib/components/AppBackground.svelte';
	import BrandFooter from '$lib/components/BrandFooter.svelte';
	import AiLoader from '$lib/components/AiLoader.svelte';
	import WorkspaceImage from '$lib/components/WorkspaceImage.svelte';

	let { data }: { data: PageData } = $props();

	let vizState = $state<'form' | 'generating' | 'done'>(data.existingImage ? 'done' : 'form');
	let userName = $state('');
	let userEmail = $state('');
	let progress = $state(0);
	let progressMsg = $state('Creating your workspace...');
	let currentImage = $state(data.existingImage?.imageData ?? '');
	let currentPrompt = $state(data.existingImage?.prompt ?? '');
	let generationsRemaining = $state(data.existingImage?.generationsRemaining ?? 3);

	let progressInterval: ReturnType<typeof setInterval> | null = null;

	function startProgress() {
		progress = 0;
		progressInterval = setInterval(() => {
			if (progress < 90) {
				progress = Math.min(90, progress + Math.random() * 20);
			}
		}, 400);
	}

	function stopProgress() {
		if (progressInterval) clearInterval(progressInterval);
		progress = 100;
	}

	async function generateImage(additionalPrompt?: string) {
		vizState = 'generating';
		startProgress();
		progressMsg = additionalPrompt ? 'Regenerating workspace...' : 'Creating your workspace...';

		try {
			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'individual',
					name: userName || undefined,
					email: userEmail || undefined,
					additionalPrompt
				})
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Generation failed' }));
				throw new Error(err.message ?? `HTTP ${res.status}`);
			}

			const result = await res.json();
			stopProgress();

			currentImage = result.imageData;
			currentPrompt = result.prompt;
			generationsRemaining = result.generationsRemaining;
			vizState = 'done';
		} catch (e) {
			stopProgress();
			vizState = currentImage ? 'done' : 'form';
			console.error('Image generation failed:', e);
		}
	}
</script>

<svelte:head>
	<title>Your Results — CoreNet</title>
</svelte:head>

<AppBackground theme="teal">
	<div class="flex min-h-dvh items-start justify-center px-6 py-6">
		<div class="relative z-10 w-full max-w-5xl text-center">
			<BrandFooter class="mb-3" />

		<h1 class="mb-1 font-display text-2xl font-black tracking-tight text-white md:text-3xl">
			Your Final Choices
		</h1>
		<p class="mb-4 text-xs font-medium tracking-wide text-white/50">
			Your selected priorities from both phases
		</p>

		<!-- Individual + Collective side by side -->
		<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
			<div
				class="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-transform duration-500 hover:-translate-y-1 md:p-8"
			>
				<div class="mb-6 flex items-center gap-5">
					<div
						class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-green/20 bg-linear-to-br from-green/40 to-green/10 text-green shadow-inner"
					>
						<Brain size={32} />
					</div>
					<div>
						<h3 class="font-display text-2xl font-bold text-slate-900">Individual Brain</h3>
						<p class="mt-1 text-xs font-semibold tracking-wider text-slate-600 uppercase">
							Your {data.individual.length} Personal Priorities
						</p>
					</div>
				</div>
				<ol class="space-y-3">
					{#each data.individual as feature, i (feature.name)}
						<li
							class="flex items-start gap-4 rounded-2xl border border-black/5 bg-black/5 p-4 transition-colors hover:bg-black/10"
						>
							<span
								class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm {feature.hasEvidence
									? 'bg-green text-white'
									: 'bg-black/10 text-slate-500'}"
							>
								{#if feature.hasEvidence}<Check size={14} strokeWidth={4} />{:else}{i + 1}{/if}
							</span>
							<div class="min-w-0 flex-1">
								<div
									class="text-[15px] leading-snug font-bold {feature.hasEvidence
										? 'text-slate-900'
										: 'text-slate-600'}"
								>
									{feature.name}
								</div>
								{#if feature.caption}
									<p class="mt-1.5 text-[13px] leading-relaxed text-slate-500 italic">
										{feature.caption}
									</p>
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			</div>

			<div
				class="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-transform duration-500 hover:-translate-y-1 md:p-8"
			>
				<div class="mb-6 flex items-center gap-5">
					<div
						class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-text/20 bg-linear-to-br from-indigo-text/40 to-indigo-text/10 text-indigo-text shadow-inner"
					>
						<UsersRound size={32} />
					</div>
					<div>
						<h3 class="font-display text-2xl font-bold text-slate-900">Collective Brain</h3>
						<p class="mt-1 text-xs font-semibold tracking-wider text-slate-600 uppercase">
							Your {data.communal.length} Team Priorities
						</p>
					</div>
				</div>
				<ol class="space-y-3">
					{#each data.communal as feature, i (feature.name)}
						<li
							class="flex items-start gap-4 rounded-2xl border border-black/5 bg-black/5 p-4 transition-colors hover:bg-black/10"
						>
							<span
								class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm {feature.hasEvidence
									? 'bg-indigo-text text-white'
									: 'bg-black/10 text-slate-500'}"
							>
								{#if feature.hasEvidence}<Check size={14} strokeWidth={4} />{:else}{i + 1}{/if}
							</span>
							<div class="min-w-0 flex-1">
								<div
									class="text-[15px] leading-snug font-bold {feature.hasEvidence
										? 'text-slate-900'
										: 'text-slate-600'}"
								>
									{feature.name}
								</div>
								{#if feature.caption}
									<p class="mt-1.5 text-[13px] leading-relaxed text-slate-500">
										{feature.caption}
									</p>
								{/if}
							</div>
						</li>
					{/each}
				</ol>
			</div>
		</div>

		{#if data.hasFalKey}
			<div
				class="mt-4 rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.15)] md:p-8"
			>
				{#if vizState === 'form'}
					<div class="flex flex-col items-center gap-4 text-center">
						<div class="flex items-center gap-2 text-accent">
							<Sparkles size={20} />
							<h3 class="font-display text-xl font-bold text-slate-900">
								Visualise Your Workspace
							</h3>
						</div>
						<p class="text-sm text-slate-500">
							See your choices come to life as an AI-generated workspace design
						</p>
						<div class="flex w-full max-w-md gap-3">
							<input
								type="text"
								placeholder="Your Name"
								bind:value={userName}
								class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal focus:outline-none"
							/>
							<input
								type="email"
								placeholder="Email"
								bind:value={userEmail}
								class="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-teal focus:outline-none"
							/>
						</div>
						<button
							type="button"
							class="rounded-xl bg-gradient-to-r from-teal to-accent px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
							disabled={!userName.trim() || !userEmail.trim()}
							onclick={() => generateImage()}
						>
							Generate My Workspace
						</button>
					</div>
				{:else if vizState === 'generating'}
					<AiLoader {progress} message={progressMsg} />
				{:else}
					<WorkspaceImage
						imageData={currentImage}
						prompt={currentPrompt}
						{generationsRemaining}
						onregenerate={(additionalPrompt) => generateImage(additionalPrompt)}
					/>
				{/if}
			</div>
		{/if}
	</div>
	</div>
</AppBackground>
