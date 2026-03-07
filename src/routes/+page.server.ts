import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import { createParticipant, hasParticipantVoted } from '$lib/server/db/queries';
import { participants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getOrCreateOpenSession } from '$lib/server/session';

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const db = getDb(platform);
		const session = await getOrCreateOpenSession(db);

		const existingParticipantId = cookies.get('participant_id');
		let needsNewParticipant = true;

		if (existingParticipantId) {
			const existing = await db
				.select({ id: participants.id, sessionId: participants.sessionId })
				.from(participants)
				.where(eq(participants.id, existingParticipantId))
				.limit(1);

			if (existing.length > 0 && existing[0].sessionId === session.id) {
				// Check if this participant already voted — if so, create a fresh one
				const voted = await hasParticipantVoted(db, existingParticipantId, session.id);

				if (!voted) {
					needsNewParticipant = false;
				}
			}
		}

		if (needsNewParticipant) {
			const participant = await createParticipant(db, session.id);

			cookies.set('participant_id', participant.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				maxAge: 60 * 60 * 24
			});
			cookies.set('session_id', session.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				maxAge: 60 * 60 * 24
			});

			cookies.set('user_name', '', { path: '/', maxAge: 0, httpOnly: false });
			cookies.set('user_email', '', { path: '/', maxAge: 0, httpOnly: false });
		}

		redirect(303, '/vote');
	}
};
