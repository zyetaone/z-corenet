<script lang="ts">
	import { Brain, UsersRound, Check, Sparkles } from '@lucide/svelte';
	import type { PageData } from './$types';
	import AppBackground from '$lib/components/AppBackground.svelte';
	import BrandFooter from '$lib/components/BrandFooter.svelte';
	import AiLoader from '$lib/components/AiLoader.svelte';
	import WorkspaceImage from '$lib/components/WorkspaceImage.svelte';
	import { streamImageGeneration } from '$lib/sse-image-stream';

	let { data }: { data: PageData } = $props();

	let vizState = $state<'form' | 'generating' | 'done' | 'error'>('form');
	let errorMsg = $state('');
	let userName = $state('');
	let userEmail = $state('');
	let progress = $state(0);
	let progressMsg = $state('Creating your workspace...');
	let currentImage = $state('');
	let currentPrompt = $state('');
	let generationsRemaining = $state(3);
	let imageHistory = $state<Array<{ imageData: string; prompt: string }>>([]);
	let canUndo = $derived(imageHistory.length > 0);

	// Pre-fill form from cookies on mount
	$effect(() => {
		const cookies = document.cookie.split('; ').reduce<Record<string, string>>((acc, c) => {
			const [k, v] = c.split('=');
			if (k && v) acc[k] = decodeURIComponent(v);
			return acc;
		}, {});
		if (cookies['user_name'] && !userName) userName = cookies['user_name'];
		if (cookies['user_email'] && !userEmail) userEmail = cookies['user_email'];
	});

	// Sync with incoming data (needed because data can update during client-side navigation)
	$effect(() => {
		if (data.existingImage) {
			vizState = 'done';
			currentImage = data.existingImage.imageData;
			currentPrompt = data.existingImage.prompt;
			generationsRemaining = data.existingImage.generationsRemaining;
		} else {
			vizState = 'form';
		}
	});

	function undoImage() {
		const prev = imageHistory[imageHistory.length - 1];
		if (prev) {
			imageHistory = imageHistory.slice(0, -1);
			currentImage = prev.imageData;
			currentPrompt = prev.prompt;
		}
	}

	function setCookie(name: string, value: string, days = 30) {
		const expires = new Date(Date.now() + days * 864e5).toUTCString();
		document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
	}

	async function generateImage(opts?: { additionalPrompt?: string; editInPlace?: boolean }) {
		const { additionalPrompt, editInPlace } = opts ?? {};

		if (userName) setCookie('user_name', userName.trim());
		if (userEmail) setCookie('user_email', userEmail.trim());

		vizState = 'generating';
		errorMsg = '';
		progress = 0;
		progressMsg = editInPlace
			? 'Editing workspace...'
			: additionalPrompt
				? 'Regenerating workspace...'
				: 'Preparing generation...';

		try {
			await streamImageGeneration(
				{
					type: 'individual',
					name: userName || undefined,
					email: userEmail || undefined,
					additionalPrompt,
					previousImageData: editInPlace && currentImage ? currentImage : undefined
				},
				{
					onProgress(p, msg) {
						progress = p;
						if (msg) progressMsg = msg;
					},
					onResult(result) {
						progress = 100;
						progressMsg = 'Finishing up...';
						if (currentImage) {
							imageHistory = [...imageHistory, { imageData: currentImage, prompt: currentPrompt }];
						}
						currentImage = result.imageData;
						currentPrompt = result.prompt;
						generationsRemaining = result.generationsRemaining;
						vizState = 'done';
					},
					onError() {
						// streamImageGeneration throws after calling onError
					}
				}
			);
		} catch (e) {
			progress = 100;
			if (e instanceof Error && e.name !== 'AbortError') {
				errorMsg = e.message || 'Image generation failed. Please try again.';
				vizState = currentImage ? 'done' : 'error';
			}
		}
	}

	async function retakeQuiz() {
		await fetch('/api/retake', { method: 'POST' });
		window.location.href = '/';
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
					{#if vizState === 'error'}
						<div class="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-8 text-center">
							<div
								class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
										x1="12"
										y1="16"
										x2="12.01"
										y2="16"
									/></svg
								>
							</div>
							<h3 class="font-display text-xl font-bold text-slate-900">Something went wrong</h3>
							<p class="text-sm text-slate-500">{errorMsg}</p>
							<button
								type="button"
								class="mt-2 rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
								onclick={() => generateImage()}
							>
								Try Again
							</button>
						</div>
					{:else if vizState === 'form'}
						<div
							class="mx-auto flex max-w-xl flex-col items-center gap-6 px-2 py-4 text-center sm:px-4 sm:py-6"
						>
							<div
								class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-teal/20 to-teal/5 text-teal shadow-inner"
							>
								<Sparkles size={32} />
							</div>

							<div>
								<h3
									class="font-display text-2xl font-black tracking-tight text-slate-900 md:text-3xl"
								>
									Visualise Your Workspace
								</h3>
								<p class="mt-2 text-[15px] leading-relaxed text-slate-500">
									Provide your details to see your choices instantly come to life as a unique,
									AI-generated workspace design.
								</p>
							</div>

							<div class="mt-2 flex w-full flex-col gap-3 sm:flex-row">
								<input
									type="text"
									placeholder="First Name"
									bind:value={userName}
									class="w-full flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10 focus:outline-none"
								/>
								<input
									type="email"
									placeholder="Email Address"
									bind:value={userEmail}
									class="w-full flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-800 transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-teal focus:bg-white focus:ring-4 focus:ring-teal/10 focus:outline-none"
								/>
							</div>

							<button
								type="button"
								class="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-slate-900 px-8 py-4.5 text-sm font-black tracking-wide text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-2xl disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none sm:w-auto"
								disabled={!userName.trim() || !userEmail.trim()}
								onclick={() => generateImage()}
							>
								<span>GENERATE DESIGN</span>
								<Sparkles size={16} class="transition-transform group-hover:scale-110" />
							</button>

							<p class="text-[11px] font-medium text-slate-400">
								By generating, you agree to our Terms. Returning emails will load their previous
								generation.
							</p>
						</div>
					{:else if vizState === 'generating' && !currentImage}
						<AiLoader {progress} message={progressMsg} />
					{:else}
						<div class="relative">
							<div
								class={vizState === 'generating'
									? 'pointer-events-none opacity-50 blur-sm transition-all duration-500'
									: 'transition-all duration-500'}
							>
								<WorkspaceImage
									imageData={currentImage}
									prompt={currentPrompt}
									{generationsRemaining}
									onregenerate={() => generateImage()}
									onedit={(editPrompt) =>
										generateImage({ additionalPrompt: editPrompt, editInPlace: true })}
									onundo={undoImage}
									{canUndo}
								/>
							</div>
							{#if vizState === 'generating'}
								<div
									class="absolute inset-x-0 -top-6 bottom-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-black/50 backdrop-blur-sm"
								>
									<AiLoader {progress} message={progressMsg} dark={true} showCredit={false} />
								</div>
							{/if}
							{#if errorMsg && vizState === 'done'}
								<div
									class="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600"
								>
									{errorMsg}
								</div>
							{/if}
						</div>

						<div class="mt-8 flex justify-center border-t border-slate-100 pt-6">
							<button
								onclick={retakeQuiz}
								class="rounded-full bg-slate-100 px-6 py-2.5 text-xs font-bold tracking-wider text-slate-500 uppercase transition-colors hover:bg-slate-200 hover:text-slate-700"
							>
								Retake Quiz
							</button>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</AppBackground>
