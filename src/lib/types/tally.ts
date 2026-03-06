/** A single feature with its vote tally, used in phase results. */
export interface RankedFeature {
	name: string;
	category: string;
	group: string;
	hasEvidence: boolean;
	caption: string | null;
	voteCount: number;
	percentage: number;
}

/** Aggregated result for one voting phase (individual or communal). */
export interface PhaseResult {
	score: number; // evidence ratio 0-100
	totalPicks: number; // total votes cast across all participants
	evidencePicks: number; // votes that went to evidence-based features
	features: RankedFeature[]; // ALL features sorted by vote count desc
}

/** Full tally for a session, returned by /api/votes and used in the dashboard. */
export interface TallyResult {
	session: { code: string; title: string; status: string };
	participantCount: number;
	voteCount: number;
	individual: PhaseResult;
	communal: PhaseResult;
	comments: Array<{ id: string; text: string }>;
}
