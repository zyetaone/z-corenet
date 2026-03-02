import { SvelteSet } from 'svelte/reactivity';
import type { SessionFeature } from '$lib/server/db/schema';
import { FEATURE_GROUPS, CATEGORY_TO_GROUP, type GroupKey } from '$lib/data/default-features';

const SOFT_CAP = 12;
const GROUP_COUNT = FEATURE_GROUPS.length; // 8

export class VotingEngine {
	features = $state<SessionFeature[]>([]);
	phase = $state<'individual' | 'communal'>('individual');
	selectedIndividual = new SvelteSet<number>();
	selectedCommunal = new SvelteSet<number>();
	freeText = $state('');
	isSubmitting = $state(false);
	error = $state('');

	readonly currentSelection = $derived(
		this.phase === 'individual' ? this.selectedIndividual : this.selectedCommunal
	);

	readonly count = $derived(this.currentSelection.size);

	readonly availableFeatures = $derived(
		this.phase === 'communal'
			? this.features.filter((f) => !this.selectedIndividual.has(f.featureId))
			: this.features
	);

	// Map featureId -> group key for quick lookup
	private readonly featureGroupMap = $derived(
		new Map(
			this.features.map((f) => [
				f.featureId,
				(CATEGORY_TO_GROUP[f.category] ?? f.category) as GroupKey
			])
		)
	);

	// Which groups have at least one pick in the current phase
	readonly completedGroups = $derived.by(() => {
		const groups = new Set<GroupKey>();
		for (const id of this.currentSelection) {
			const group = this.featureGroupMap.get(id);
			if (group) groups.add(group);
		}
		return groups;
	});

	readonly completedGroupCount = $derived(this.completedGroups.size);

	readonly allGroupsCovered = $derived(this.completedGroupCount === GROUP_COUNT);

	readonly atSoftCap = $derived(this.count >= SOFT_CAP);

	readonly canContinue = $derived(this.allGroupsCovered);

	readonly buttonText = $derived(
		this.allGroupsCovered
			? this.phase === 'individual'
				? 'Continue →'
				: 'Submit & See Results →'
			: `${this.completedGroupCount} of ${GROUP_COUNT} sections`
	);

	constructor(features: SessionFeature[]) {
		this.features = features;
	}

	toggle(featureId: number) {
		const sel = this.currentSelection;
		if (sel.has(featureId)) {
			sel.delete(featureId);
		} else if (!this.atSoftCap) {
			sel.add(featureId);
		}
	}

	isGroupComplete(groupKey: GroupKey): boolean {
		return this.completedGroups.has(groupKey);
	}

	advancePhase() {
		if (this.phase === 'individual' && this.allGroupsCovered) {
			this.phase = 'communal';
		}
	}
}
