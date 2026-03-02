<script lang="ts">
	import { goto } from '$app/navigation';
	import { fade, fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let joinCode = $state('');
	let joinError = $state('');
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	function handleJoin() {
		const code = joinCode.trim().toUpperCase();
		if (code.length < 4) {
			joinError = 'Enter a valid session code';
			return;
		}
		joinError = '';
		goto(`/session/${code}`);
	}
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
	style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
>
	<!-- Ambient Background Orbs -->
	<div class="pointer-events-none absolute inset-0 z-0 overflow-hidden">
		<div
			class="absolute -left-[10%] -top-[20%] h-[60%] w-[60%] rounded-full opacity-30 mix-blend-screen blur-[120px]"
			style="background-color: var(--teal)"
		></div>
		<div
			class="absolute -right-[10%] top-[60%] h-[50%] w-[50%] rounded-full opacity-20 mix-blend-screen blur-[120px]"
			style="background-color: var(--accent)"
		></div>
	</div>

	<div class="relative z-10 w-full max-w-md text-center">
		{#if mounted}
			<!-- Badge -->
			<div
				in:fly={{ y: -20, duration: 800, delay: 100 }}
				class="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-2.5 pl-5 pr-6 text-sm text-white/80 shadow-lg backdrop-blur-md transition-all hover:bg-white/10"
			>
				<span class="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[10px]">✨</span>
				<span>Powered by <strong class="text-[var(--accent)]">AWA × CEBMa</strong> Research</span>
			</div>

			<!-- Icon -->
			<div
				in:fly={{ y: -20, duration: 800, delay: 200 }}
				class="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-[2rem] text-6xl shadow-2xl transition-transform duration-500 hover:scale-105 hover:rotate-3"
				style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 20px 50px rgba(0,139,139,0.3)"
			>
				🧠
			</div>

			<!-- Title -->
			<h1 
				in:fly={{ y: 20, duration: 800, delay: 300 }}
				class="font-display mb-4 tracking-tight text-5xl font-extrabold text-transparent bg-clip-text" 
				style="background-image: linear-gradient(to right, #ffffff, #d1d5db); line-height: 1.15"
			>
				Designing Workplaces<br/>That Think
			</h1>
			<p
				in:fade={{ duration: 800, delay: 500 }}
				class="mb-12 text-xs font-bold tracking-[0.25em] text-[var(--accent)] uppercase"
			>
				Cognitive Performance Exercise
			</p>

			<!-- Actions -->
			<div 
				in:fly={{ y: 30, duration: 800, delay: 600 }}
				class="space-y-6"
			>
				<a
					href="/session/create"
					class="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl p-4.5 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
					style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 10px 40px rgba(0,139,139,0.3)"
				>
					<div class="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
					<span>Create New Session</span>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
				</a>

				<div class="relative py-2">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-white/10"></div>
					</div>
					<div class="relative flex justify-center text-xs uppercase tracking-widest">
						<span class="px-4 text-white/50" style="background-color: #15222E;">or join session</span>
					</div>
				</div>

				<form
					class="flex flex-col gap-3 sm:flex-row"
					onsubmit={(e) => {
						e.preventDefault();
						handleJoin();
					}}
				>
					<div class="relative flex-1">
						<input
							type="text"
							bind:value={joinCode}
							placeholder="ENTER CODE"
							maxlength="8"
							class="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4.5 text-center text-lg font-bold tracking-[0.2em] text-white uppercase placeholder-white/20 backdrop-blur-md outline-none transition-all focus:border-[var(--accent)] focus:bg-white/10 focus:ring-4 focus:ring-[var(--accent)]/20"
						/>
					</div>
					<button
						type="submit"
						class="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-8 py-4.5 font-bold text-white backdrop-blur-md transition-all hover:bg-white/15 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-white/10 active:scale-95 sm:w-auto"
					>
						Join
					</button>
				</form>
				
				{#if joinError}
					<div in:fade={{duration: 200}} class="mt-4 text-sm font-medium text-[var(--red)] flex items-center justify-center gap-2 bg-[var(--red)]/10 py-3 rounded-xl border border-[var(--red)]/20 backdrop-blur-md">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
						</svg>
						{joinError}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
