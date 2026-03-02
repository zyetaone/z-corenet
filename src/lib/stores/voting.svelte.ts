import { SvelteSet } from 'svelte/reactivity'
import type { SessionFeature } from '$lib/server/db/schema'

export class VotingEngine {
	features = $state<SessionFeature[]>([])
	phase = $state<'individual' | 'communal'>('individual')
	selectedIndividual = new SvelteSet<number>()
	selectedCommunal = new SvelteSet<number>()
	freeText = $state('')
	isSubmitting = $state(false)
	error = $state('')

	readonly currentSelection = $derived(
		this.phase === 'individual' ? this.selectedIndividual : this.selectedCommunal
	)
	readonly count = $derived(this.currentSelection.size)
	readonly canContinue = $derived(this.count === 5)
	readonly buttonText = $derived(
		this.count === 5
			? this.phase === 'individual'
				? 'Continue →'
				: 'Submit & See Results →'
			: `Select ${5 - this.count} more`
	)
	readonly availableFeatures = $derived(
		this.phase === 'communal'
			? this.features.filter((f) => !this.selectedIndividual.has(f.featureId))
			: this.features
	)

	constructor(features: SessionFeature[]) {
		this.features = features
	}

	toggle(featureId: number) {
		const sel = this.currentSelection
		if (sel.has(featureId)) {
			sel.delete(featureId)
		} else if (sel.size < 5) {
			sel.add(featureId)
		}
	}

	advancePhase() {
		if (this.phase === 'individual' && this.selectedIndividual.size === 5) {
			this.phase = 'communal'
		}
	}
}
