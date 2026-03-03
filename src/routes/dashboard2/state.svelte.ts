import type { CategoryStat } from '$lib/components/CategoryBreakdown.svelte';
import type { BucketFeature } from '$lib/components/BucketDistribution.svelte';
import { FEATURE_GROUPS, CATEGORY_TO_GROUP, RADAR_LABELS } from '$lib/data/default-features';
import type { GroupKey } from '$lib/data/default-features';
import { DashboardBaseState } from '$lib/stores/dashboard-base.svelte';

export { RADAR_LABELS };

export class Dashboard2State extends DashboardBaseState {
	// Bucket features — merge individual + communal views per feature
	readonly bucketFeatures = $derived.by((): BucketFeature[] => {
		const map = new Map<
			string,
			{
				name: string;
				group: string;
				hasEvidence: boolean;
				individualVotes: number;
				communalVotes: number;
			}
		>();

		for (const f of this.results.individual.features) {
			map.set(f.name, {
				name: f.name,
				group: f.group,
				hasEvidence: f.hasEvidence,
				individualVotes: f.voteCount,
				communalVotes: 0
			});
		}

		for (const f of this.results.communal.features) {
			const existing = map.get(f.name);
			if (existing) {
				existing.communalVotes = f.voteCount;
			} else {
				map.set(f.name, {
					name: f.name,
					group: f.group,
					hasEvidence: f.hasEvidence,
					individualVotes: 0,
					communalVotes: f.voteCount
				});
			}
		}

		return [...map.values()]
			.map((f) => {
				const totalVotes = f.individualVotes + f.communalVotes;
				return {
					...f,
					totalVotes,
					individualPct: totalVotes > 0 ? Math.round((f.individualVotes / totalVotes) * 100) : 0,
					communalPct: totalVotes > 0 ? Math.round((f.communalVotes / totalVotes) * 100) : 0
				};
			})
			.sort((a, b) => b.totalVotes - a.totalVotes);
	});

	// Consensus features: >75% agreement on one bucket
	readonly consensusFeatures = $derived.by(() =>
		this.bucketFeatures.filter(
			(f) => f.totalVotes > 0 && (f.individualPct >= 75 || f.communalPct >= 75)
		)
	);

	// Contested features: neither bucket > 65%
	readonly contestedFeatures = $derived.by(() =>
		this.bucketFeatures.filter(
			(f) => f.totalVotes > 0 && f.individualPct < 65 && f.communalPct < 65 && f.totalVotes >= 2
		)
	);

	// Bucket totals
	readonly totalIndividual = $derived(
		this.results.individual.features.reduce((s, f) => s + f.voteCount, 0)
	);
	readonly totalCommunal = $derived(
		this.results.communal.features.reduce((s, f) => s + f.voteCount, 0)
	);
	readonly totalAll = $derived(this.totalIndividual + this.totalCommunal);
	readonly individualPct = $derived(
		this.totalAll > 0 ? Math.round((this.totalIndividual / this.totalAll) * 100) : 50
	);

	// Category-level bucket split
	readonly categorySplitStats = $derived.by((): CategoryStat[] => {
		const grouped = new Map<
			GroupKey,
			{ totalVotes: number; evidenceCount: number; featureCount: number }
		>();
		for (const f of this.bucketFeatures) {
			const groupKey = (CATEGORY_TO_GROUP[f.group] ?? f.group) as GroupKey;
			const existing = grouped.get(groupKey);
			if (existing) {
				existing.totalVotes += f.totalVotes;
				existing.featureCount++;
				if (f.hasEvidence) existing.evidenceCount++;
			} else {
				grouped.set(groupKey, {
					totalVotes: f.totalVotes,
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

	// Key insights
	readonly mostDivisive = $derived.by(() => {
		if (this.contestedFeatures.length === 0) return null;
		return this.contestedFeatures.reduce((a, b) =>
			Math.abs(a.individualPct - a.communalPct) > Math.abs(b.individualPct - b.communalPct) ? a : b
		);
	});

	readonly topCommunalShift = $derived.by(() => {
		let maxShift = { name: '', shift: 0 };
		for (const f of this.bucketFeatures) {
			const shift = f.communalPct - f.individualPct;
			if (shift > maxShift.shift) maxShift = { name: f.name, shift };
		}
		return maxShift.shift > 0 ? maxShift : null;
	});

	readonly topCategory = $derived(
		this.categorySplitStats.length > 0 ? this.categorySplitStats[0] : null
	);

	// Donut chart segments
	readonly bucketSegments = $derived.by(() => [
		{ value: this.totalIndividual, color: 'var(--green)', label: 'Individual' },
		{ value: this.totalCommunal, color: 'var(--indigo-text)', label: 'Communal' }
	]);
}
