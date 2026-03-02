<script lang="ts">
	import type { SessionFeature } from '$lib/server/db/schema';
	import FeatureCard from './FeatureCard.svelte';

	let {
		features,
		selectedIds,
		disabledIds,
		usedIds,
		phase,
		ontoggle
	}: {
		features: SessionFeature[];
		selectedIds: Set<number>;
		disabledIds: Set<number>;
		usedIds: Set<number>;
		phase: 'individual' | 'communal';
		ontoggle: (featureId: number) => void;
	} = $props();

	let shuffled = $derived(
		[...features].sort(
			(a, b) => ((a.featureId * 2654435761) % 100) - ((b.featureId * 2654435761) % 100)
		)
	);
</script>

<div class="feature-grid">
	{#each shuffled as feature (feature.id)}
		<FeatureCard
			{feature}
			selected={selectedIds.has(feature.featureId)}
			disabled={disabledIds.has(feature.featureId)}
			used={usedIds.has(feature.featureId)}
			{phase}
			onclick={() => ontoggle(feature.featureId)}
		/>
	{/each}
</div>

<style>
	.feature-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.625rem;
	}

	@media (min-width: 860px) {
		.feature-grid {
			grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		}
	}
</style>
