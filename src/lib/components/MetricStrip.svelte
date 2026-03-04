<script lang="ts">
	import { Users, Brain, Target, ShieldCheck } from '@lucide/svelte';

	let {
		participantCount,
		evidenceScore,
		consensusScore,
		totalVotes
	}: {
		participantCount: number;
		evidenceScore: number;
		consensusScore: number;
		totalVotes: number;
	} = $props();
</script>

<div class="metrics-grid">
	<div class="metric-card glass-panel">
		<div class="icon-box text-teal-400">
			<Users size={20} />
		</div>
		<div class="content">
			<span class="label">Participants</span>
			<span class="value">{participantCount}</span>
		</div>
	</div>

	<div class="metric-card glass-panel">
		<div class="icon-box text-emerald-300">
			<Brain size={20} />
		</div>
		<div class="content">
			<span class="label">Brain Fuel</span>
			<span class="value"
				>{totalVotes} <small class="text-xs font-normal opacity-50">votes</small></span
			>
		</div>
	</div>

	<div class="metric-card glass-panel">
		<div class="icon-box text-teal-300">
			<ShieldCheck size={20} />
		</div>
		<div class="content">
			<span class="label">Evidence Score</span>
			<span class="value">{evidenceScore}%</span>
		</div>
	</div>

	<div class="metric-card glass-panel">
		<div class="icon-box text-lime-400">
			<Target size={20} />
		</div>
		<div class="content">
			<span class="label">Team Alignment</span>
			<span class="value">{consensusScore}%</span>
		</div>
	</div>
</div>

<style>
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	@media (min-width: 768px) {
		.metrics-grid {
			grid-template-columns: repeat(4, 1fr);
			gap: 1rem;
		}
	}

	.metric-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: 1.25rem;
		border-color: rgba(255, 255, 255, 0.08);
	}

	.icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.05);
	}

	.content {
		display: flex;
		flex-direction: column;
	}

	.label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.4);
	}

	.value {
		font-size: 1.25rem;
		font-weight: 800;
		color: #fff;
		font-variant-numeric: tabular-nums;
	}
</style>
