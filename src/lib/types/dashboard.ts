import type { GroupKey } from '$lib/data/default-features';

export interface RadarDataset {
	label: string;
	values: number[];
	color: string;
	fillOpacity?: number;
}

export interface CategoryStat {
	key: GroupKey;
	label: string;
	totalVotes: number;
	percentage: number;
	evidenceCount: number;
	featureCount: number;
	evidenceVotes: number;
	evidenceRatio: number; // 0-100, vote-weighted
}
