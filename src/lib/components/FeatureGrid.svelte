<script lang="ts">
	import type { SessionFeature } from '$lib/server/db/schema';
	import { FEATURE_GROUPS, CATEGORY_TO_GROUP } from '$lib/data/default-features';
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

	let grouped = $derived(
		FEATURE_GROUPS.map((group) => ({
			...group,
			features: features.filter(
				(f) => (CATEGORY_TO_GROUP[f.category] ?? f.category) === group.key
			)
		})).filter((g) => g.features.length > 0)
	);
</script>

{#each grouped as group (group.key)}
	<div class="mb-6">
		<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-white/45">
			{group.icon} {group.label}
		</p>
		<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each group.features as feature (feature.id)}
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
	</div>
{/each}
