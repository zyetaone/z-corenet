<script lang="ts">
	import CategoryIcon from './CategoryIcon.svelte';
	import type { GroupKey } from '$lib/data/default-features';
	import { useAnimateOnce } from '$lib/utils/use-animate-once.svelte';

	export interface CategoryStat {
		key: GroupKey;
		label: string;
		totalVotes: number;
		percentage: number;
		evidenceCount: number;
		featureCount: number;
	}

	let {
		categories,
		maxVotes
	}: {
		categories: CategoryStat[];
		maxVotes: number;
	} = $props();

	// Top 3 category labels for summary sentence
	const topLabels = $derived(categories.slice(0, 3).map((c) => c.label));

	const summary = $derived(
		topLabels.length === 3
			? `Your group prioritises ${topLabels[0]}, ${topLabels[1]}, and ${topLabels[2]}.`
			: topLabels.length === 2
				? `Your group prioritises ${topLabels[0]} and ${topLabels[1]}.`
				: topLabels.length === 1
					? `Your group prioritises ${topLabels[0]}.`
					: ''
	);

	const anim = useAnimateOnce();
</script>

<div class="space-y-3">
	{#each categories as cat, i (cat.key)}
		<div
			class="group relative flex items-center gap-4 rounded-2xl border border-[#1a2b3c]/5 bg-white/70 px-4 py-3 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-[#1a2b3c]/15 hover:bg-white/95 hover:shadow-lg {i ===
			0
				? 'shadow-[0_0_15px_rgba(0,191,165,0.1)] ring-1 ring-(--accent)/20'
				: ''}"
			style={!anim.done
				? `animation: bar-enter 0.5s ease-out both; animation-delay: ${i * 40}ms`
				: ''}
		>
			<!-- Category icon -->
			<div class="shrink-0 text-(--teal) transition-all duration-500 group-hover:scale-110">
				<CategoryIcon group={cat.key} size={22} animated={true} />
			</div>

			<!-- Label + bar -->
			<div class="min-w-0 flex-1">
				<div class="mb-1.5 flex items-center gap-2">
					<span
						class="truncate text-sm font-extrabold text-[#1a2b3c]/90 transition-colors group-hover:text-[#1a2b3c] md:text-base"
						>{cat.label}</span
					>
					<span
						class="shrink-0 rounded bg-(--green)/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-(--green-text) uppercase"
					>
						{cat.evidenceCount}/{cat.featureCount} evidence
					</span>
				</div>
				<!-- Horizontal bar -->
				<div
					class="relative h-2.5 overflow-hidden rounded-full bg-[#1a2b3c]/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
				>
					<div
						class="absolute top-0 bottom-0 left-0 rounded-full bg-linear-to-r from-(--teal) to-(--accent) transition-all duration-1000 ease-out"
						style="width: {maxVotes > 0
							? (cat.totalVotes / maxVotes) * 100
							: 0}%; box-shadow: inset 0 1px 1px rgba(255,255,255,0.4);"
					></div>
				</div>
			</div>

			<!-- Percentage -->
			<div class="flex shrink-0 flex-col items-end justify-center">
				<span class="text-xs font-bold tracking-wider text-[#1a2b3c]/40 uppercase">Demand</span>
				<span
					class="text-xl font-extrabold text-[#1a2b3c] tabular-nums transition-colors group-hover:text-(--teal)"
				>
					{cat.percentage}%
				</span>
			</div>
		</div>
	{/each}
</div>

{#if summary}
	<p
		class="mt-6 text-center text-sm font-medium text-[#1a2b3c]/50"
		style={!anim.done
			? `animation: bar-enter 0.4s ease-out both; animation-delay: ${categories.length * 60 + 200}ms`
			: ''}
	>
		{summary}
	</p>
{/if}
