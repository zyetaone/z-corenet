<script lang="ts">
	import { Brain, ShieldCheck } from '@lucide/svelte';

	let {
		evidenceScore,
		totalVotes
	}: {
		evidenceScore: number;
		totalVotes: number;
	} = $props();
</script>

<div class="metrics-grid">
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
</div>

<style>
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.5rem;
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
		background: rgba(0, 128, 128, 0.08);
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
		color: rgba(26, 43, 60, 0.45);
	}

	.value {
		font-size: 1.25rem;
		font-weight: 800;
		color: #004d40;
		font-variant-numeric: tabular-nums;
	}
</style>
