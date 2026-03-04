import type { CategoryStat } from '$lib/types/dashboard';
import { FEATURE_GROUPS, CATEGORY_TO_GROUP, RADAR_LABELS } from '$lib/data/default-features';
import type { GroupKey } from '$lib/data/default-features';
import { DashboardBaseState } from '$lib/stores/dashboard-base.svelte';

export { RADAR_LABELS };

export class DashboardState extends DashboardBaseState {
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

	readonly evidenceSegments = $derived.by(() => {
		const evidenceVotes =
			this.results.individual.evidencePicks + this.results.communal.evidencePicks;
		const totalVotes = this.results.individual.totalPicks + this.results.communal.totalPicks;
		const nonEvidence = totalVotes - evidenceVotes;
		return [
			{ value: evidenceVotes, color: 'var(--color-green)', label: 'Evidence-backed' },
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
}
