import { count, eq, sql } from 'drizzle-orm';
import type { DbClient } from './index';
import { comments, participants, sessionFeatures, sessions, votes, workspaceImages } from './schema';
import type { Comment, Participant, Session, SessionFeature, WorkspaceImage } from './schema';
import type { DefaultFeature } from '$lib/data/default-features';

// ── Sessions ──

export async function createSession(db: DbClient, code: string, title: string): Promise<Session> {
	const [session] = await db.insert(sessions).values({ code, title }).returning();
	return session;
}

export async function getSessionByCode(db: DbClient, code: string): Promise<Session | undefined> {
	const [session] = await db.select().from(sessions).where(eq(sessions.code, code));
	return session;
}

export async function getSessionById(db: DbClient, id: string): Promise<Session | undefined> {
	const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
	return session;
}

export async function getLatestOpenSession(db: DbClient): Promise<Session | undefined> {
	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.status, 'open'))
		.orderBy(sql`${sessions.createdAt} desc`)
		.limit(1);
	return session;
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
	// D1 limits ~100 bound params per query; batch to stay under limit
	const BATCH = 10;
	for (let i = 0; i < rows.length; i += BATCH) {
		await db.insert(sessionFeatures).values(rows.slice(i, i + BATCH));
	}
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
	if (featureIds.length === 0) return;

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

// ── Workspace Images ──

export async function getWorkspaceImageCount(
	db: DbClient,
	participantId: string,
	sessionId: string
): Promise<number> {
	const [result] = await db
		.select({ count: count() })
		.from(workspaceImages)
		.where(
			sql`${workspaceImages.participantId} = ${participantId} AND ${workspaceImages.sessionId} = ${sessionId}`
		);
	return result.count;
}

export async function getCollectiveImageCount(
	db: DbClient,
	sessionId: string
): Promise<number> {
	const [result] = await db
		.select({ count: count() })
		.from(workspaceImages)
		.where(
			sql`${workspaceImages.type} = 'collective' AND ${workspaceImages.sessionId} = ${sessionId}`
		);
	return result.count;
}

export async function insertWorkspaceImage(
	db: DbClient,
	data: {
		sessionId: string;
		participantId?: string;
		participantName?: string;
		participantEmail?: string;
		imageData: string;
		prompt: string;
		generationNum: number;
		type: 'individual' | 'collective';
		featureNames: string[];
	}
): Promise<WorkspaceImage> {
	const [row] = await db
		.insert(workspaceImages)
		.values({
			sessionId: data.sessionId,
			participantId: data.participantId ?? null,
			participantName: data.participantName ?? null,
			participantEmail: data.participantEmail ?? null,
			imageData: data.imageData,
			prompt: data.prompt,
			generationNum: data.generationNum,
			type: data.type,
			featureNames: JSON.stringify(data.featureNames)
		})
		.returning();
	return row;
}

export async function getSessionWorkspaceImages(
	db: DbClient,
	sessionId: string
): Promise<WorkspaceImage[]> {
	return db
		.select()
		.from(workspaceImages)
		.where(eq(workspaceImages.sessionId, sessionId))
		.orderBy(sql`${workspaceImages.createdAt} desc`);
}

export async function getLatestParticipantImage(
	db: DbClient,
	participantId: string,
	sessionId: string
): Promise<WorkspaceImage | undefined> {
	const [row] = await db
		.select()
		.from(workspaceImages)
		.where(
			sql`${workspaceImages.participantId} = ${participantId} AND ${workspaceImages.sessionId} = ${sessionId}`
		)
		.orderBy(sql`${workspaceImages.createdAt} desc`)
		.limit(1);
	return row;
}

export async function updateParticipantIdentity(
	db: DbClient,
	participantId: string,
	name: string,
	email: string
): Promise<void> {
	await db
		.update(participants)
		.set({ name, email })
		.where(eq(participants.id, participantId));
}
