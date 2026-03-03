<script lang="ts">
	import CategoryIcon from './CategoryIcon.svelte';
	import type { RankedFeature } from '$lib/server/tally';
	import { useAnimateOnce } from '$lib/utils/use-animate-once.svelte';

	export interface BucketFeature {
		name: string;
		group: string;
		hasEvidence: boolean;
		individualVotes: number;
		communalVotes: number;
		totalVotes: number;
		individualPct: number;
		communalPct: number;
	}

	let {
		features,
		animateIn = true
	}: {
		features: BucketFeature[];
		animateIn?: boolean;
	} = $props();

	const anim = useAnimateOnce();
</script>

<div class="space-y-2">
	{#each features as f, i (f.name)}
		<div
			class="group relative flex items-center gap-4 rounded-2xl border border-[#1a2b3c]/5 bg-white/70 px-4 py-3 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:border-[#1a2b3c]/15 hover:bg-white/95 hover:shadow-lg"
			style={animateIn && !anim.done
				? `animation: bar-enter 0.5s ease-out both; animation-delay: ${i * 40}ms`
				: ''}
		>
			<!-- Category icon -->
			<div
				class="shrink-0 text-[#1a2b3c]/50 transition-transform duration-500 group-hover:scale-110 group-hover:text-[#1a2b3c]/80"
			>
				<CategoryIcon group={f.group} size={20} animated={false} />
			</div>

			<!-- Name -->
			<div class="min-w-0 flex-1">
				<div class="mb-1.5 flex items-center gap-2">
					<span
						class="truncate text-sm font-extrabold text-[#1a2b3c]/90 transition-colors group-hover:text-[#1a2b3c] md:text-base"
						>{f.name}</span
					>
					{#if f.hasEvidence}
						<span
							class="shrink-0 text-[10px] font-bold tracking-wider text-(--green-text) uppercase opacity-80"
							title="Evidence-Backed">✓ Evidence-Backed</span
						>
					{/if}
				</div>
				<!-- Split bar -->
				<div
					class="flex h-2.5 overflow-hidden rounded-full bg-[#1a2b3c]/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]"
				>
					{#if f.individualPct > 0}
						<div
							class="h-full bg-linear-to-r from-(--green) to-(--green) transition-all duration-700 ease-out"
							style="width: {f.individualPct}%; box-shadow: inset 0 1px 1px rgba(255,255,255,0.4);"
						></div>
					{/if}
					{#if f.communalPct > 0}
						<div
							class="h-full bg-linear-to-r from-(--teal) to-(--accent) transition-all duration-700 ease-out"
							style="width: {f.communalPct}%; box-shadow: inset 0 1px 1px rgba(255,255,255,0.4);"
						></div>
					{/if}
				</div>
			</div>

			<!-- Bucket counts -->
			<div class="flex shrink-0 flex-col items-end gap-0.5 text-xs font-bold tabular-nums">
				<span class="text-(--green) opacity-80 transition-colors group-hover:opacity-100">
					Indiv: {f.individualVotes}
				</span>
				<span class="text-(--indigo-text) opacity-80 transition-colors group-hover:opacity-100">
					Comm: {f.communalVotes}
				</span>
			</div>
		</div>
	{/each}
</div>
