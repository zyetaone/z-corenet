/** A feature as displayed on the thanks/results page after voting. */
export interface PickedFeature {
	name: string;
	hasEvidence: boolean;
	caption: string | null;
}

/** A feature as used by the client-side VotingEngine. */
export interface VotingFeature {
	id: number;
	sessionId: string;
	featureId: number;
	name: string;
	description: string;
	category: string;
	hasEvidence: boolean;
	level: string;
	caption: string | null;
}
