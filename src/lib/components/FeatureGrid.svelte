<script lang="ts">
	import type { SessionFeature } from '$lib/server/db/schema';
	import { FEATURE_GROUPS, CATEGORY_TO_GROUP, type GroupKey } from '$lib/data/default-features';
	import FeatureCard from './FeatureCard.svelte';
	import CategoryIcon from './CategoryIcon.svelte';
	import { fly } from 'svelte/transition';

	let {
		features,
		selectedIds,
		disabledIds,
		usedIds,
		phase,
		ontoggle,
		completedGroups
	}: {
		features: SessionFeature[];
		selectedIds: Set<number>;
		disabledIds: Set<number>;
		usedIds: Set<number>;
		phase: 'individual' | 'communal';
		ontoggle: (featureId: number) => void;
		completedGroups: Set<GroupKey>;
	} = $props();

	let grouped = $derived(
		FEATURE_GROUPS.map((group) => ({
			...group,
			features: features.filter((f) => (CATEGORY_TO_GROUP[f.category] ?? f.category) === group.key)
		})).filter((g) => g.features.length > 0)
	);
</script>

<div class="space-y-8">
	{#each grouped as group, i (group.key)}
		<div
			in:fly={{ y: 20, duration: 600, delay: i * 100 }}
			class="rounded-3xl border p-5 shadow-sm transition-colors duration-700 sm:p-6 {phase ===
			'individual'
				? 'border-[#1a2b3c]/10 bg-white/40'
				: 'border-white/5 bg-white/5'}"
		>
			<div class="mb-5 flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-2xl text-xl shadow-inner backdrop-blur-md transition-colors duration-300 {completedGroups.has(
						group.key
					)
						? phase === 'individual'
							? 'bg-(--green)/15'
							: 'bg-(--indigo-text)/15'
						: phase === 'individual'
							? 'bg-white/80'
							: 'bg-white/10'}"
				>
					{#if completedGroups.has(group.key)}
						<svg
							class="h-5 w-5 {phase === 'individual' ? 'text-(--green)' : 'text-(--indigo-text)'}"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{:else}
						<CategoryIcon group={group.key} size={22} />
					{/if}
				</div>
				<h3
					class="font-display text-base font-bold tracking-wide uppercase transition-colors duration-700 {phase ===
					'individual'
						? 'text-[#1a2b3c]'
						: 'text-white/90'}"
				>
					{group.label}
				</h3>
			</div>

			<div
				class="grid gap-3.5 sm:gap-2.5"
				style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));"
			>
				{#each group.features as feature, j (feature.id)}
					<div in:fly={{ y: 10, duration: 400, delay: i * 100 + j * 50 }}>
						<FeatureCard
							{feature}
							selected={selectedIds.has(feature.featureId)}
							disabled={disabledIds.has(feature.featureId)}
							used={usedIds.has(feature.featureId)}
							{phase}
							onclick={() => ontoggle(feature.featureId)}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
