<script lang="ts">
	let {
		phase,
		totalPicks,
		maxPicks
	}: {
		phase: 'individual' | 'communal';
		totalPicks: number;
		maxPicks: number;
	} = $props();

	const isIndividual = $derived(phase === 'individual');
	const allDone = $derived(totalPicks === maxPicks);
	import { Brain, UsersRound } from 'lucide-svelte';
</script>

<header class="vote-topbar">
	<!-- Left: phase context -->
	<div class="flex min-w-0 items-center gap-3">
		<span class="shrink-0 text-white/50">
			{#if isIndividual}
				<Brain size={28} />
			{:else}
				<UsersRound size={28} />
			{/if}
		</span>
		<div class="min-w-0">
			<div
				class="truncate font-display text-base font-bold md:text-lg"
				style="color: {isIndividual ? 'var(--color-green)' : 'var(--color-indigo-text)'}"
			>
				{isIndividual ? 'The Individual Brain' : 'The Collective Brain'}
			</div>
			<div class="flex flex-col">
				<div class="truncate text-sm font-medium text-white/80 md:text-base">
					{isIndividual
						? 'Select 5 features for your personal productivity'
						: "Select 5 different features for your team's success"}
				</div>
				<div class="truncate text-[11px] text-white/50 italic md:text-xs">
					{isIndividual
						? '(These cannot be reused for the team)'
						: '(Your personal picks are disabled)'}
				</div>
			</div>
		</div>
	</div>

	<!-- Right: counter -->
	<div class="flex shrink-0 items-center gap-4">
		<div
			class="rounded-full px-4 py-1.5 text-sm font-bold transition-all duration-300 {allDone
				? isIndividual
					? 'bg-green/20 text-green'
					: 'bg-indigo-text/20 text-indigo-text'
				: 'bg-white/8 text-white/60'}"
		>
			<span style="font-variant-numeric: tabular-nums">{totalPicks}</span>/{maxPicks}
		</div>
	</div>

	<!-- Phase accent line -->
	<div
		class="phase-accent"
		class:phase-accent--individual={isIndividual}
		class:phase-accent--communal={!isIndividual}
	></div>
</header>

<style>
	.vote-topbar {
		background: rgba(15, 25, 35, 0.85);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		padding: 0.75rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		position: sticky;
		top: 0;
		z-index: 50;
		box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
		isolation: isolate;
	}

	@media (min-width: 640px) {
		.vote-topbar {
			padding: 0.75rem 1.75rem;
		}
	}

	.phase-accent {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		transition: background-color 0.4s ease;
	}

	.phase-accent--individual {
		background-color: var(--color-green);
	}

	.phase-accent--communal {
		background-color: var(--color-indigo-text);
	}
</style>
