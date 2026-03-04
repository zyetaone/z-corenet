import type { DbClient } from './db';
import {
	getSessionById,
	getSessionFeatures,
	tallyVotes,
	getParticipantCount,
	getVoteCount,
	getComments
} from './db/queries';
import { CATEGORY_TO_GROUP } from '$lib/data/default-features';

export interface RankedFeature {
	name: string;
	category: string;
	group: string;
	hasEvidence: boolean;
	caption: string | null;
	voteCount: number;
	percentage: number;
}

export interface PhaseResult {
	score: number; // evidence ratio 0-100
	totalPicks: number; // total votes cast across all participants
	evidencePicks: number; // votes that went to evidence-based features
	features: RankedFeature[]; // ALL features sorted by vote count desc
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
		{ name: string; category: string; group: string; hasEvidence: boolean; caption: string | null }
	>,
	participantCount: number
): PhaseResult {
	const phaseTallies = tallies
		.filter((t) => t.phase === phase)
		.sort((a, b) => b.voteCount - a.voteCount);

	const features: RankedFeature[] = phaseTallies.map((t) => {
		const feature = featuresMap.get(t.featureId);
		return {
			name: feature?.name ?? 'Unknown',
			category: feature?.category ?? 'unknown',
			group: feature?.group ?? 'unknown',
			hasEvidence: feature?.hasEvidence ?? false,
			caption: feature?.caption ?? null,
			voteCount: t.voteCount,
			percentage: participantCount > 0 ? Math.round((t.voteCount / participantCount) * 100) : 0
		};
	});

	const totalPicks = phaseTallies.reduce((sum, t) => sum + t.voteCount, 0);
	const evidencePicks = phaseTallies
		.filter((t) => featuresMap.get(t.featureId)?.hasEvidence)
		.reduce((sum, t) => sum + t.voteCount, 0);
	const score = totalPicks > 0 ? Math.round((evidencePicks / totalPicks) * 100) : 0;

	return { score, totalPicks, evidencePicks, features };
}

export async function buildTallyResultById(
	db: DbClient,
	sessionId: string
): Promise<TallyResult | null> {
	const session = await getSessionById(db, sessionId);
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
				group: CATEGORY_TO_GROUP[f.category] ?? f.category,
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
