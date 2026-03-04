import { SvelteSet } from 'svelte/reactivity';
import type { SessionFeature } from '$lib/server/db/schema';
import { MAX_PICKS } from '$lib/data/default-features';

export class VotingEngine {
	features = $state<SessionFeature[]>([]);
	phase = $state<'individual' | 'communal'>('individual');
	selectedIndividual = new SvelteSet<number>();
	selectedCommunal = new SvelteSet<number>();
	isSubmitting = $state(false);
	error = $state('');

	readonly currentSelection = $derived(
		this.phase === 'individual' ? this.selectedIndividual : this.selectedCommunal
	);

	readonly count = $derived(this.currentSelection.size);

	readonly atMax = $derived(this.count >= MAX_PICKS);

	readonly canContinue = $derived(this.count === MAX_PICKS);

	readonly buttonText = $derived(
		this.canContinue
			? this.phase === 'individual'
				? 'Continue →'
				: 'Submit & See Results →'
			: `${this.count} of ${MAX_PICKS} selected`
	);

	constructor(features: SessionFeature[]) {
		this.features = features;
	}

	toggle(featureId: number) {
		if (this.phase === 'communal' && this.selectedIndividual.has(featureId)) return;
		const sel = this.currentSelection;
		if (sel.has(featureId)) {
			sel.delete(featureId);
		} else if (!this.atMax) {
			sel.add(featureId);
		}
	}

	advancePhase() {
		if (this.phase === 'individual' && this.canContinue) {
			this.phase = 'communal';
			if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
}
