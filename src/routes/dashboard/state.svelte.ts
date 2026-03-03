import type { TallyResult } from '$lib/server/tally';
import type { RadarDataset } from '$lib/components/RadarChart.svelte';
import type { CategoryStat } from '$lib/components/CategoryBreakdown.svelte';
import { FEATURE_GROUPS, CATEGORY_TO_GROUP } from '$lib/data/default-features';
import type { GroupKey } from '$lib/data/default-features';

export const RADAR_LABELS = ['Light', 'Air', 'Sound', 'Nature', 'Health', 'Tech', 'Social', 'Design'];

export class DashboardState {
	data = $state.raw<TallyResult>(null!);
	polledResults = $state.raw<TallyResult | null>(null);
	justUpdated = $state(false);
	polling = $state(false);
	showResults = $state(false);

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

	readonly categoryStats = $derived.by((): CategoryStat[] => {
		const grouped = new Map<
			GroupKey,
			{ totalVotes: number; evidenceCount: number; featureCount: number }
		>();
		for (const f of this.combinedFeatures) {
			const groupKey = (CATEGORY_TO_GROUP[f.group] ?? f.group) as GroupKey;
			const existing = grouped.get(groupKey);
			if (existing) {
				existing.totalVotes += f.voteCount;
				existing.featureCount++;
				if (f.hasEvidence) existing.evidenceCount++;
			} else {
				grouped.set(groupKey, {
					totalVotes: f.voteCount,
					featureCount: 1,
					evidenceCount: f.hasEvidence ? 1 : 0
				});
			}
		}

		const totalVotesAll = [...grouped.values()].reduce((s, g) => s + g.totalVotes, 0);

		return FEATURE_GROUPS.map((fg) => {
			const g = grouped.get(fg.key) ?? { totalVotes: 0, evidenceCount: 0, featureCount: 0 };
			return {
				key: fg.key,
				label: fg.label,
				totalVotes: g.totalVotes,
				percentage: totalVotesAll > 0 ? Math.round((g.totalVotes / totalVotesAll) * 100) : 0,
				evidenceCount: g.evidenceCount,
				featureCount: g.featureCount
			};
		})
			.filter((c) => c.featureCount > 0)
			.sort((a, b) => b.totalVotes - a.totalVotes);
	});

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
				color: 'var(--green)',
				fillOpacity: 0.2
			},
			{
				label: 'Communal',
				values: keys.map((k) => Math.round(((commGroup.get(k) ?? 0) / maxVal) * 100)),
				color: 'var(--indigo-text)',
				fillOpacity: 0.15
			}
		];
	});

	readonly evidenceSegments = $derived.by(() => {
		const evidenceVotes = this.results.individual.evidencePicks + this.results.communal.evidencePicks;
		const totalVotes = this.results.individual.totalPicks + this.results.communal.totalPicks;
		const nonEvidence = totalVotes - evidenceVotes;
		return [
			{ value: evidenceVotes, color: 'var(--green)', label: 'Evidence-backed' },
			{ value: Math.max(nonEvidence, 0), color: '#1a2b3c20', label: 'Not evidence-backed' }
		];
	});

	// Key insights
	readonly topOverallFeature = $derived(
		this.combinedFeatures.length > 0 ? this.combinedFeatures[0] : null
	);

	readonly topCategory = $derived(this.categoryStats.length > 0 ? this.categoryStats[0] : null);

	readonly consensusAlignment = $derived.by(() => {
		if (this.results.individual.totalPicks === 0 || this.results.communal.totalPicks === 0)
			return 0;
		const topInd = this.results.individual.features.slice(0, 5).map((f) => f.name);
		const topCom = this.results.communal.features.slice(0, 5).map((f) => f.name);
		const shared = topInd.filter((name) => topCom.includes(name));
		return Math.round((shared.length / 5) * 100);
	});

	readonly allFeatures = $derived([
		...this.results.individual.features,
		...this.results.communal.features
	]);

	handleShowResults() {
		this.showResults = true;
	}

	async handleReset() {
		try {
			const res = await fetch('/api/reset', { method: 'POST' });
			if (res.ok) {
				this.showResults = false;
				this.polledResults = null;
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
