<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { VotingEngine } from '$lib/stores/voting.svelte';
	import VoteTopbar from '$lib/components/VoteTopbar.svelte';
	import FeatureGrid from '$lib/components/FeatureGrid.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data }: { data: PageData } = $props();
	const engine = untrack(() => new VotingEngine(data.features));

	let disabledIds = $derived(
		engine.atSoftCap
			? new Set(
					engine.features
						.filter(
							(f) =>
								!engine.currentSelection.has(f.featureId) &&
								!engine.isFromUncoveredGroup(f.featureId)
						)
						.map((f) => f.featureId)
				)
			: new Set<number>()
	);

	let displayFeatures = $derived(engine.features);

	let usedIds = $derived(
		engine.phase === 'communal' ? engine.selectedIndividual : new Set<number>()
	);
</script>

<svelte:head>
	<title>Vote — CoreNet</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col transition-colors duration-700 {engine.phase === 'communal'
		? 'theme-dark-blue'
		: ''}"
>
	<div class="animated-grid-bg"></div>
	<VoteTopbar
		phase={engine.phase}
		completedGroups={engine.completedGroups}
		totalPicks={engine.count}
	/>

	<main class="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
		<FeatureGrid
			features={displayFeatures}
			selectedIds={engine.currentSelection}
			{disabledIds}
			{usedIds}
			phase={engine.phase}
			ontoggle={(id) => engine.toggle(id)}
			completedGroups={engine.completedGroups}
		/>

		<div class="mt-6 flex flex-col items-center gap-6 pb-8">
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
					{#each [...engine.selectedIndividual] as id}
						<input type="hidden" name="individualIds" value={id} />
					{/each}
					{#each [...engine.selectedCommunal] as id}
						<input type="hidden" name="communalIds" value={id} />
					{/each}

					<textarea
						name="comment"
						bind:value={engine.freeText}
						placeholder="Any thoughts on workplace design? (optional)"
						aria-label="Comments on workplace design"
						rows="3"
						class="w-full rounded-xl border border-white/12 bg-white/10 px-5 py-3.5 text-base text-white placeholder-white/50 transition-colors outline-none focus:border-(--accent) focus:bg-white/15 focus:ring-1 focus:ring-(--accent)/50"
					></textarea>

					<Button type="submit" disabled={!engine.canContinue || engine.isSubmitting}>
						{engine.isSubmitting ? 'Submitting...' : engine.buttonText}
					</Button>
				</form>
			{/if}
		</div>
	</main>
</div>
