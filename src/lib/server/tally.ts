import type { DbClient } from './db';
import {
	getSessionByCode,
	getSessionFeatures,
	tallyVotes,
	getParticipantCount,
	getVoteCount,
	getComments
} from './db/queries';

export interface RankedFeature {
	name: string;
	category: string;
	hasEvidence: boolean;
	caption: string | null;
	percentage: number;
}

export interface PhaseResult {
	score: number;
	features: RankedFeature[];
}

export interface TallyResult {
	session: { code: string; title: string; status: string };
	participantCount: number;
	voteCount: number;
	individual: PhaseResult;
	communal: PhaseResult;
	comments: Array<{ id: string; text: string }>;
}

function buildPhaseResult(
	phase: string,
	tallies: Array<{ featureId: number; phase: string; voteCount: number }>,
	featuresMap: Map<
		number,
		{ name: string; category: string; hasEvidence: boolean; caption: string | null }
	>,
	participantCount: number
): PhaseResult {
	const phaseTallies = tallies
		.filter((t) => t.phase === phase)
		.sort((a, b) => b.voteCount - a.voteCount)
		.slice(0, 5);

	const features: RankedFeature[] = phaseTallies.map((t) => {
		const feature = featuresMap.get(t.featureId);
		return {
			name: feature?.name ?? 'Unknown',
			category: feature?.category ?? 'unknown',
			hasEvidence: feature?.hasEvidence ?? false,
			caption: feature?.caption ?? null,
			percentage: participantCount > 0 ? Math.round((t.voteCount / participantCount) * 100) : 0
		};
	});

	const score = features.filter((f) => f.hasEvidence).length;

	return { score, features };
}

export async function buildTallyResult(db: DbClient, code: string): Promise<TallyResult | null> {
	const session = await getSessionByCode(db, code);
	if (!session) return null;

	const [sessionFeatures, tallies, participantCount, voteCount, rawComments] = await Promise.all([
		getSessionFeatures(db, session.id),
		tallyVotes(db, session.id),
		getParticipantCount(db, session.id),
		getVoteCount(db, session.id),
		getComments(db, session.id)
	]);

	const featuresMap = new Map(
		sessionFeatures.map((f) => [
			f.featureId,
			{
				name: f.name,
				category: f.category,
				hasEvidence: f.hasEvidence,
				caption: f.caption
			}
		])
	);

	const individual = buildPhaseResult('individual', tallies, featuresMap, participantCount);
	const communal = buildPhaseResult('communal', tallies, featuresMap, participantCount);

	const comments = rawComments.map((c) => ({ id: c.id, text: c.text }));

	return {
		session: { code: session.code, title: session.title, status: session.status },
		participantCount,
		voteCount,
		individual,
		communal,
		comments
	};
}
