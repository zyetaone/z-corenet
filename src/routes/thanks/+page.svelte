<script lang="ts">
	import { Brain, UsersRound, Check, Sparkles } from '@lucide/svelte';
	import type { PageData } from './$types';
	import AppBackground from '$lib/components/AppBackground.svelte';
	import BrandFooter from '$lib/components/BrandFooter.svelte';
	import AiLoader from '$lib/components/AiLoader.svelte';
	import WorkspaceImage from '$lib/components/WorkspaceImage.svelte';

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
		progressMsg = editInPlace ? 'Editing workspace...' : additionalPrompt ? 'Regenerating workspace...' : 'Preparing generation...';

		const trackingId = crypto.randomUUID();
		let eventSource: EventSource | null = null;

		try {
			eventSource = new EventSource(`/api/generate-image/progress?id=${trackingId}`);
			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.progress !== undefined) progress = data.progress;
					if (data.message) progressMsg = data.message;
				} catch {
					// parse error ignored
				}
			};

			const res = await fetch('/api/generate-image', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'individual',
					name: userName || undefined,
					email: userEmail || undefined,
					additionalPrompt,
					trackingId,
					previousImageData: editInPlace && currentImage ? currentImage : undefined
				})
			});

			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Generation failed' }));
				throw new Error(err.message ?? `HTTP ${res.status}`);
			}

			const result = await res.json();
			progress = 100;
			progressMsg = 'Finishing up...';

			if (currentImage) {
				imageHistory = [...imageHistory, { imageData: currentImage, prompt: currentPrompt }];
			}
			currentImage = result.imageData;
			currentPrompt = result.prompt;
			generationsRemaining = result.generationsRemaining;
			vizState = 'done';
		} catch (e) {
			progress = 100;
			if (e instanceof Error && e.name !== 'AbortError') {
				errorMsg = e.message || 'Image generation failed. Please try again.';
				vizState = currentImage ? 'done' : 'error';
			}
		} finally {
			eventSource?.close();
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
			<div class="mt-4 overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-950 text-left shadow-2xl">
				<div class="flex flex-col lg:flex-row">
					<!-- Left Side: Studio Controls -->
					<div class="flex w-full flex-col justify-center border-b border-slate-800 p-8 lg:w-1/2 lg:border-r lg:border-b-0 lg:p-12">
						<div class="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/10 text-teal ring-1 ring-teal/20">
							<Sparkles size={28} />
						</div>
						
						<h3 class="font-display text-3xl font-black tracking-tight text-white md:text-4xl">
							Visualise Your Workspace
						</h3>
						<p class="mt-3 text-[15px] leading-relaxed text-slate-400">
							{#if vizState === 'form' || vizState === 'error'}
								Enter your details to generate your unique structural vision based on your individual and communal selections.
							{:else}
								Your workspace is materializing based on your selected features.
							{/if}
						</p>

						{#if vizState === 'form' || vizState === 'error'}
							<div class="mt-8 flex flex-col gap-4">
								{#if vizState === 'error'}
									<div class="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
										<p class="font-bold">Generation failed</p>
										<p class="mt-1 opacity-80">{errorMsg}</p>
									</div>
								{/if}
								
								<div class="group relative">
									<input
										type="text"
										placeholder="First Name"
										bind:value={userName}
										class="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-sm font-bold text-white placeholder:text-slate-600 placeholder:font-medium transition-all focus:border-teal focus:bg-slate-900 focus:ring-4 focus:ring-teal/20 focus:outline-none"
									/>
								</div>
								<div class="group relative">
									<input
										type="email"
										placeholder="Email Address"
										bind:value={userEmail}
										class="w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-sm font-bold text-white placeholder:text-slate-600 placeholder:font-medium transition-all focus:border-teal focus:bg-slate-900 focus:ring-4 focus:ring-teal/20 focus:outline-none"
									/>
								</div>

								<button
									type="button"
									class="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-teal px-8 py-4.5 text-sm font-black tracking-wide text-slate-950 shadow-[0_0_40px_rgba(20,184,166,0.2)] transition-all hover:scale-[1.02] hover:bg-teal-400 hover:shadow-[0_0_60px_rgba(20,184,166,0.3)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
									disabled={!userName.trim() || !userEmail.trim()}
									onclick={() => generateImage()}
								>
									<span>GENERATE DESIGN</span>
									<Sparkles size={16} class="transition-transform group-hover:scale-110" />
								</button>
								
								<p class="text-center text-[13px] font-medium text-slate-600">
									Returning emails will auto-load their previous generation.
								</p>
							</div>
						{:else}
							<!-- Status block while generating or done -->
							<div class="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
								<div class="flex items-center gap-4">
									<div class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-teal">
										<Brain size={24} class={vizState === 'generating' ? 'animate-pulse' : ''} />
									</div>
									<div>
										<p class="font-bold text-white">
											{vizState === 'generating' ? 'AI is working...' : 'Generation Complete'}
										</p>
										<p class="text-[13px] text-slate-500 mt-0.5">
											{currentImage ? `${generationsRemaining} edits remaining` : 'Connecting to neural net'}
										</p>
									</div>
								</div>
								{#if vizState === 'done'}
									<div class="mt-6 flex gap-3">
										<button
											onclick={retakeQuiz}
											class="flex-1 rounded-xl bg-slate-800 py-3 text-xs font-bold tracking-wider text-slate-300 uppercase transition-colors hover:bg-slate-700 hover:text-white"
										>
											New Concept
										</button>
										<button
											onclick={() => {
												userName = '';
												userEmail = '';
												vizState = 'form';
												currentImage = '';
											}}
											class="flex-1 rounded-xl bg-slate-800 py-3 text-xs font-bold tracking-wider text-slate-300 uppercase transition-colors hover:bg-slate-700 hover:text-white"
										>
											Clear User
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Right Side: Dedicated Canvas -->
					<div class="flex w-full items-center justify-center bg-black lg:w-1/2 p-6 md:p-12 lg:p-12">
						<!-- Constraint for the 1:1 image area -->
						<div class="relative w-full aspect-square overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-white/10">
							{#if !currentImage && vizState === 'form'}
								<!-- Empty Skeleton State -->
								<div class="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-slate-800/80 bg-slate-900/30 p-6 text-center">
									<div class="mb-4 text-slate-800">
										<div class="mx-auto h-24 w-24 rounded-2xl bg-slate-800/50"></div>
									</div>
									<p class="font-display text-lg font-bold text-slate-600">Awaiting Input</p>
								</div>
							{:else if vizState === 'generating' && !currentImage}
								<!-- Initial Generation State -->
								<div class="flex h-full w-full items-center justify-center bg-black/40">
									<AiLoader {progress} message={progressMsg} dark={true} showCredit={false} />
								</div>
							{:else if currentImage}
								<!-- Rendered Image State -->
								<div class="relative h-full w-full bg-black">
									<div class={vizState === 'generating' ? 'pointer-events-none h-full w-full opacity-40 blur-md transition-all duration-700' : 'h-full w-full transition-all duration-700'}>
										<WorkspaceImage
											imageData={currentImage}
											prompt={currentPrompt}
											{generationsRemaining}
											onregenerate={() => generateImage()}
											onedit={(editPrompt) => generateImage({ additionalPrompt: editPrompt, editInPlace: true })}
											onundo={undoImage}
											{canUndo}
											dark={true}
										/>
									</div>
									{#if vizState === 'generating'}
										<div class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
											<AiLoader {progress} message={progressMsg} dark={true} showCredit={false} />
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
	</div>
</AppBackground>
