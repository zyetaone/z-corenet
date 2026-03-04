<script lang="ts">
	import { fly, fade, scale } from 'svelte/transition';
	import { CheckCircle2, Brain, UsersRound, Check } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { useMount } from '$lib/utils/use-mount.svelte';

	let { data }: { data: PageData } = $props();
	const { mounted, reduceMotion } = useMount();
</script>

<svelte:head>
	<title>Your Results — CoreNet</title>
</svelte:head>

<div
	class="bg-teal-gradient relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10"
>
	<div
		class="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-30 mix-blend-soft-light transition-opacity duration-1000"
	>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.15),transparent_50%)]"
		></div>
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(0,0,0,0.1),transparent_50%)]"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-5xl text-center">
		{#if mounted}
			<div
				in:fly={{
					y: reduceMotion ? 0 : -20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 100
				}}
				class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl"
				style="background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); box-shadow: 0 10px 40px rgba(0,0,0,0.15)"
			>
				🧠
			</div>

			<div
				in:fly={{
					y: reduceMotion ? 0 : 20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 200
				}}
			>
				<h1 class="mb-1 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
					Your Final Choices
				</h1>
				<p class="mb-8 text-sm font-semibold tracking-[0.2em] text-white/50 uppercase">
					Powered by AWA &times; Zyeta
				</p>
			</div>

			<!-- Individual + Collective side by side -->
			<div
				in:fly={{
					y: reduceMotion ? 0 : 20,
					duration: reduceMotion ? 0 : 800,
					delay: reduceMotion ? 0 : 350
				}}
				class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10"
			>
				<div
					class="flex flex-col rounded-3xl border border-white/50 bg-white/95 p-6 text-left shadow-2xl backdrop-blur-md transition-transform duration-500 hover:-translate-y-1 md:p-8"
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
								in:fly={{
									x: reduceMotion ? 0 : -12,
									duration: reduceMotion ? 0 : 400,
									delay: reduceMotion ? 0 : 450 + i * 80
								}}
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
					class="flex flex-col rounded-3xl border border-white/50 bg-white/95 p-6 text-left shadow-2xl backdrop-blur-md transition-transform duration-500 hover:-translate-y-1 md:p-8"
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
								in:fly={{
									x: reduceMotion ? 0 : 12,
									duration: reduceMotion ? 0 : 400,
									delay: reduceMotion ? 0 : 450 + i * 80
								}}
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
										<p class="mt-1.5 text-[13px] leading-relaxed text-slate-500 italic">
											{feature.caption}
										</p>
									{/if}
								</div>
							</li>
						{/each}
					</ol>
				</div>
			</div>
		{/if}
	</div>
</div>
