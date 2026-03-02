import { and, count, eq, sql } from 'drizzle-orm';
import type { DbClient } from './index';
import { comments, participants, sessionFeatures, sessions, votes } from './schema';
import type { Comment, Participant, Session, SessionFeature } from './schema';
import type { DefaultFeature } from '$lib/data/default-features';

// ── Sessions ──

export async function createSession(
	db: DbClient,
	code: string,
	title: string
): Promise<Session> {
	const [session] = await db.insert(sessions).values({ code, title }).returning();
	return session;
}

export async function getSessionByCode(
	db: DbClient,
	code: string
): Promise<Session | undefined> {
	const [session] = await db.select().from(sessions).where(eq(sessions.code, code));
	return session;
}

export async function closeSession(db: DbClient, sessionId: string): Promise<void> {
	await db.update(sessions).set({ status: 'closed' }).where(eq(sessions.id, sessionId));
}

// ── Session Features ──

export async function copyDefaultFeatures(
	db: DbClient,
	sessionId: string,
	features: DefaultFeature[]
): Promise<void> {
	const rows = features.map((f) => ({
		sessionId,
		featureId: f.featureId,
		name: f.name,
		description: f.description,
		category: f.category,
		hasEvidence: f.hasEvidence,
		level: f.level,
		caption: f.caption
	}));
	await db.insert(sessionFeatures).values(rows);
}

export async function getSessionFeatures(
	db: DbClient,
	sessionId: string
): Promise<SessionFeature[]> {
	return db
		.select()
		.from(sessionFeatures)
		.where(eq(sessionFeatures.sessionId, sessionId))
		.orderBy(sessionFeatures.featureId);
}

export async function updateSessionFeature(
	db: DbClient,
	id: number,
	data: Partial<Pick<SessionFeature, 'name' | 'description' | 'category' | 'hasEvidence' | 'level' | 'caption'>>
): Promise<void> {
	await db.update(sessionFeatures).set(data).where(eq(sessionFeatures.id, id));
}

export async function deleteSessionFeature(db: DbClient, id: number): Promise<void> {
	await db.delete(sessionFeatures).where(eq(sessionFeatures.id, id));
}

export async function addSessionFeature(
	db: DbClient,
	sessionId: string,
	feature: Omit<DefaultFeature, 'featureId'> & { featureId: number }
): Promise<SessionFeature> {
	const [row] = await db
		.insert(sessionFeatures)
		.values({
			sessionId,
			featureId: feature.featureId,
			name: feature.name,
			description: feature.description,
			category: feature.category,
			hasEvidence: feature.hasEvidence,
			level: feature.level,
			caption: feature.caption
		})
		.returning();
	return row;
}

// ── Participants ──

export async function createParticipant(
	db: DbClient,
	sessionId: string,
	name?: string
): Promise<Participant> {
	const [participant] = await db
		.insert(participants)
		.values({ sessionId, name: name || null })
		.returning();
	return participant;
}

export async function getParticipantCount(db: DbClient, sessionId: string): Promise<number> {
	const [result] = await db
		.select({ count: count() })
		.from(participants)
		.where(eq(participants.sessionId, sessionId));
	return result.count;
}

// ── Votes ──

export async function saveVotes(
	db: DbClient,
	participantId: string,
	sessionId: string,
	phase: string,
	featureIds: number[]
): Promise<void> {
	const rows = featureIds.map((featureId) => ({
		participantId,
		sessionId,
		phase,
		featureId
	}));
	await db.insert(votes).values(rows).onConflictDoNothing();
}

export async function getVoteCount(db: DbClient, sessionId: string): Promise<number> {
	const result = await db
		.selectDistinct({ participantId: votes.participantId })
		.from(votes)
		.where(eq(votes.sessionId, sessionId));
	return result.length;
}

export interface VoteTally {
	featureId: number;
	phase: string;
	voteCount: number;
}

export async function tallyVotes(db: DbClient, sessionId: string): Promise<VoteTally[]> {
	const rows = await db
		.select({
			featureId: votes.featureId,
			phase: votes.phase,
			voteCount: count()
		})
		.from(votes)
		.where(eq(votes.sessionId, sessionId))
		.groupBy(votes.featureId, votes.phase);
	return rows;
}

// ── Comments ──

export async function saveComment(
	db: DbClient,
	participantId: string,
	sessionId: string,
	text: string
): Promise<void> {
	await db.insert(comments).values({ participantId, sessionId, text });
}

export async function getComments(db: DbClient, sessionId: string): Promise<Comment[]> {
	return db.select().from(comments).where(eq(comments.sessionId, sessionId));
}
