import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import type { DbClient } from './db';
import {
	getLatestOpenSession,
	getSessionById,
	createSession,
	copyDefaultFeatures,
	createParticipant
} from './db/queries';
import { participants } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { buildTallyResultById } from './tally';
import type { TallyResult } from './tally';
import { DEFAULT_FEATURES } from '$lib/data/default-features';

export function generateCode(): string {
	return crypto.randomUUID().slice(0, 6).toUpperCase();
}

const COOKIE_OPTS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: true,
	maxAge: 60 * 60 * 24
};

/**
 * Read participant + session cookies; redirect to "/" if either is missing.
 */
export function requireParticipant(cookies: Cookies): {
	participantId: string;
	sessionId: string;
} {
	const participantId = cookies.get('participant_id');
	const sessionId = cookies.get('session_id');
	if (!participantId || !sessionId) {
		redirect(303, '/');
	}
	return { participantId, sessionId };
}

/**
 * Find an open session or create one.
 */
export async function getOrCreateOpenSession(db: DbClient) {
	const existing = await getLatestOpenSession(db);
	if (existing) return existing;

	const code = generateCode();
	const session = await createSession(db, code, 'Designing Workplaces That Think');
	await copyDefaultFeatures(db, session.id, DEFAULT_FEATURES);
	return session;
}

/**
 * Set participant + session cookies and clear UX cookies.
 */
function setParticipantCookies(cookies: Cookies, participantId: string, sessionId: string) {
	cookies.set('participant_id', participantId, COOKIE_OPTS);
	cookies.set('session_id', sessionId, COOKIE_OPTS);
	cookies.set('user_name', '', { path: '/', maxAge: 0, httpOnly: false });
	cookies.set('user_email', '', { path: '/', maxAge: 0, httpOnly: false });
}

/**
 * Resolve a valid open session + participant from cookies.
 * Self-heals if cookies are stale: finds/creates an open session
 * and registers a new participant, updating cookies.
 *
 * Returns the session, participantId, and sessionId.
 */
export async function resolveSessionAndParticipant(
	db: DbClient,
	cookies: Cookies
): Promise<{
	session: { id: string; code: string; title: string; status: string };
	participantId: string;
	sessionId: string;
}> {
	let participantId = cookies.get('participant_id');
	let sessionId = cookies.get('session_id');

	let session = sessionId ? await getSessionById(db, sessionId) : null;

	if (!session || session.status !== 'open') {
		// Stale or missing session — get/create open session + new participant
		session = await getOrCreateOpenSession(db);
		const participant = await createParticipant(db, session.id);
		participantId = participant.id;
		sessionId = session.id;
		setParticipantCookies(cookies, participantId, sessionId);
	} else if (participantId) {
		// Session is valid — verify participant belongs to it
		const [p] = await db
			.select({ id: participants.id })
			.from(participants)
			.where(and(eq(participants.id, participantId), eq(participants.sessionId, session.id)))
			.limit(1);

		if (!p) {
			const participant = await createParticipant(db, session.id);
			participantId = participant.id;
			sessionId = session.id;
			setParticipantCookies(cookies, participantId, sessionId);
		}
	}

	if (!participantId || !sessionId) {
		redirect(303, '/');
	}

	return { session, participantId, sessionId };
}

/**
 * Get active tally — always prefers the latest open session.
 * Falls back to a specific session ID for historical views when no open session exists.
 */
export async function getActiveTally(
	db: DbClient,
	sessionId: string | undefined
): Promise<TallyResult | null> {
	const openSession = await getLatestOpenSession(db);
	if (openSession) {
		return buildTallyResultById(db, openSession.id);
	}

	if (sessionId) {
		const result = await buildTallyResultById(db, sessionId);
		if (result) return result;
	}

	return null;
}
