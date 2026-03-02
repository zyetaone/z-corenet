<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { VotingEngine } from '$lib/stores/voting.svelte';
	import VoteTopbar from '$lib/components/VoteTopbar.svelte';
	import PhaseBanner from '$lib/components/PhaseBanner.svelte';
	import FeatureGrid from '$lib/components/FeatureGrid.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data }: { data: PageData } = $props();
	const engine = untrack(() => new VotingEngine(data.features));

	let disabledIds = $derived(
		engine.count >= 5
			? new Set(
					engine.features
						.filter((f) => !engine.currentSelection.has(f.featureId))
						.map((f) => f.featureId)
				)
			: new Set<number>()
	);

	let displayFeatures = $derived(
		engine.phase === 'individual' ? engine.features : engine.availableFeatures
	);

	let usedIds = $derived(
		engine.phase === 'communal' ? engine.selectedIndividual : new Set<number>()
	);
</script>

<div
	class="flex min-h-screen flex-col"
>
	<VoteTopbar count={engine.count} phase={engine.phase} />

	<main class="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
		<PhaseBanner phase={engine.phase} />

		<FeatureGrid
			features={displayFeatures}
			selectedIds={engine.currentSelection}
			{disabledIds}
			{usedIds}
			phase={engine.phase}
			ontoggle={(id) => engine.toggle(id)}
		/>

		<div class="mt-8 flex flex-col items-center gap-6 pb-10">
			{#if engine.phase === 'individual'}
				<Button disabled={!engine.canContinue} onclick={() => engine.advancePhase()}>
					{engine.buttonText}
				</Button>
			{:else}
				<form
					method="POST"
					class="flex w-full max-w-lg flex-col items-center gap-6"
					use:enhance={() => {
						engine.isSubmitting = true;
						return async ({ update }) => {
							await update();
							engine.isSubmitting = false;
						};
					}}
				>
					<input
						type="hidden"
						name="individualIds"
						value={JSON.stringify([...engine.selectedIndividual])}
					/>
					<input
						type="hidden"
						name="communalIds"
						value={JSON.stringify([...engine.selectedCommunal])}
					/>

					<textarea
						name="comment"
						bind:value={engine.freeText}
						placeholder="Any thoughts on workplace design? (optional)"
						aria-label="Comments on workplace design"
						rows="3"
						class="w-full rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-base text-white placeholder-white/30 transition-colors outline-none focus:border-[var(--accent)]"
					></textarea>

					<Button type="submit" disabled={!engine.canContinue || engine.isSubmitting}>
						{engine.isSubmitting ? 'Submitting...' : engine.buttonText}
					</Button>
				</form>
			{/if}
		</div>
	</main>
</div>
