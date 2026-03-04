import { redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import type { DbClient } from './db';
import { getLatestOpenSession } from './db/queries';
import { buildTallyResultById } from './tally';
import type { TallyResult } from './tally';

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
 * Resolve a TallyResult from a session cookie or fall back to the latest open session.
 */
export async function resolveSessionTally(
	db: DbClient,
	sessionId: string | undefined
): Promise<TallyResult | null> {
	if (sessionId) {
		const result = await buildTallyResultById(db, sessionId);
		if (result) return result;
	}

	const session = await getLatestOpenSession(db);
	if (session) {
		return buildTallyResultById(db, session.id);
	}

	return null;
}
