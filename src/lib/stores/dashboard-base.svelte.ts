import type { TallyResult } from '$lib/server/tally';
import type { RadarDataset } from '$lib/components/RadarChart.svelte';
import type { CategoryStat } from '$lib/components/CategoryBreakdown.svelte';
import { FEATURE_GROUPS, CATEGORY_TO_GROUP } from '$lib/data/default-features';
import type { GroupKey } from '$lib/data/default-features';

export class DashboardBaseState {
	static readonly TOTAL_PAGES = 2;

	data = $state.raw<TallyResult>(null!);
	polledResults = $state.raw<TallyResult | null>(null);
	justUpdated = $state(false);
	polling = $state(false);
	showResults = $state(false);
	page = $state(1);
	direction = $state<'forward' | 'backward'>('forward');

	constructor(initialData: TallyResult) {
		this.data = initialData;
	}

	nextPage() {
		if (this.page < DashboardBaseState.TOTAL_PAGES) {
			this.direction = 'forward';
			this.page++;
		}
	}

	prevPage() {
		if (this.page > 1) {
			this.direction = 'backward';
			this.page--;
		}
	}

	readonly results = $derived(this.polledResults ?? this.data);
	readonly baseUrl = $derived(typeof window !== 'undefined' ? window.location.origin : '');

	// Merge both phases into one sorted list
	readonly combinedFeatures = $derived.by(() => {
		const map = new Map<
			string,
			{
				name: string;
				category: string;
				group: string;
				hasEvidence: boolean;
				caption: string | null;
				voteCount: number;
			}
		>();
		for (const f of [...this.results.individual.features, ...this.results.communal.features]) {
			const existing = map.get(f.name);
			if (existing) {
				existing.voteCount += f.voteCount;
			} else {
				map.set(f.name, { ...f });
			}
		}
		const merged = [...map.values()].sort((a, b) => b.voteCount - a.voteCount);
		const totalParticipants = this.results.participantCount;
		return merged.map((f) => ({
			...f,
			percentage: totalParticipants > 0 ? Math.round((f.voteCount / totalParticipants) * 100) : 0
		}));
	});

	readonly overallEvidenceRatio = $derived(
		Math.round((this.results.individual.score + this.results.communal.score) / 2)
	);

	readonly allFeatures = $derived([
		...this.results.individual.features,
		...this.results.communal.features
	]);

	readonly radarDatasets = $derived.by((): RadarDataset[] => {
		const indGroup = new Map<string, number>();
		const commGroup = new Map<string, number>();

		for (const f of this.results.individual.features) {
			const key = (CATEGORY_TO_GROUP[f.group] ?? f.group) as string;
			indGroup.set(key, (indGroup.get(key) ?? 0) + f.voteCount);
		}
		for (const f of this.results.communal.features) {
			const key = (CATEGORY_TO_GROUP[f.group] ?? f.group) as string;
			commGroup.set(key, (commGroup.get(key) ?? 0) + f.voteCount);
		}

		const keys = FEATURE_GROUPS.map((fg) => fg.key);
		const maxVal = Math.max(
			...keys.map((k) => Math.max(indGroup.get(k) ?? 0, commGroup.get(k) ?? 0)),
			1
		);

		return [
			{
				label: 'Individual',
				values: keys.map((k) => Math.round(((indGroup.get(k) ?? 0) / maxVal) * 100)),
				color: 'var(--color-green)',
				fillOpacity: 0.2
			},
			{
				label: 'Communal',
				values: keys.map((k) => Math.round(((commGroup.get(k) ?? 0) / maxVal) * 100)),
				color: 'var(--color-indigo-text)',
				fillOpacity: 0.15
			}
		];
	});

	handleShowResults() {
		this.showResults = true;
		this.page = 1;
		this.direction = 'forward';
	}

	async handleReset() {
		try {
			const res = await fetch('/api/reset', { method: 'POST' });
			if (res.ok) {
				this.showResults = false;
				this.polledResults = null;
				this.page = 1;
				this.direction = 'forward';
			}
		} catch {
			// silently ignore reset errors
		}
	}

	async poll() {
		try {
			this.polling = true;
			const res = await fetch('/api/votes');
			if (res.ok) {
				this.polledResults = await res.json();
				this.justUpdated = true;
				setTimeout(() => (this.justUpdated = false), 600);
			}
		} catch {
			// silently ignore polling errors
		} finally {
			this.polling = false;
		}
	}
}
