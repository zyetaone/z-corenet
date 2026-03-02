<script lang="ts">
	let {
		count,
		phase
	}: {
		count: number;
		phase: 'individual' | 'communal';
	} = $props();

	let isComplete = $derived(count === 5);
	let isIndividual = $derived(phase === 'individual');
</script>

<header class="vote-topbar">
	<div class="topbar-left">
		<span class="topbar-icon">&#x1f9e0;</span>
		<span class="topbar-title-short">AWA</span>
		<span class="topbar-title-full">AWA &middot; Workplace Cognitive Design</span>
	</div>
	<div class="topbar-phase">
		<span class="topbar-phase-badge" class:badge-a={isIndividual} class:badge-b={!isIndividual}>
			{isIndividual ? 'Phase A' : 'Phase B'}
		</span>
		<span class="counter-pill" class:incomplete={!isComplete} class:complete={isComplete}>
			<span class="counter-num" class:num-incomplete={!isComplete} class:num-complete={isComplete}>
				{count}
			</span>
			<span class="counter-label">/ 5 selected</span>
		</span>
	</div>
</header>

<style>
	.vote-topbar {
		background: var(--dark);
		padding: 0.875rem 1.75rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: sticky;
		top: 0;
		z-index: 50;
		box-shadow: 0 2px 20px rgba(0, 0, 0, 0.25);
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.topbar-icon {
		font-size: 1.75rem;
	}

	.topbar-title-short {
		display: none;
		font-family: 'Playfair Display', Georgia, serif;
		color: #fff;
		font-size: 1rem;
		font-weight: 700;
	}

	.topbar-title-full {
		font-family: 'Playfair Display', Georgia, serif;
		color: #fff;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.topbar-phase {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.topbar-phase-badge {
		padding: 0.375rem 1rem;
		border-radius: 1.25rem;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.badge-a {
		background: rgba(0, 200, 83, 0.15);
		color: var(--green);
	}

	.badge-b {
		background: rgba(92, 107, 192, 0.15);
		color: #8c9eff;
	}

	.counter-pill {
		border-radius: 1.375rem;
		padding: 0.5rem 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s;
	}

	.counter-pill.incomplete {
		background: rgba(255, 255, 255, 0.08);
	}

	.counter-pill.complete {
		background: linear-gradient(135deg, var(--teal), var(--accent));
	}

	.counter-num {
		font-size: 1.375rem;
		font-weight: 800;
		transition: color 0.3s;
		font-family: 'DM Sans', sans-serif;
	}

	.num-incomplete {
		color: var(--accent);
	}

	.num-complete {
		color: #fff;
	}

	.counter-label {
		color: rgba(255, 255, 255, 0.55);
		font-size: 0.8125rem;
	}

	@media (max-width: 640px) {
		.topbar-title-short {
			display: inline;
		}
		.topbar-title-full {
			display: none;
		}
	}
</style>
