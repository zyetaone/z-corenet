import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import {
	getLatestOpenSession,
	createSession,
	copyDefaultFeatures,
	createParticipant
} from '$lib/server/db/queries';
import { participants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { DEFAULT_FEATURES } from '$lib/data/default-features';
import { generateCode } from '$lib/server/utils';

async function getOrCreateSession(db: ReturnType<typeof getDb>) {
	const existing = await getLatestOpenSession(db);
	if (existing) return existing;

	const code = generateCode();
	const session = await createSession(db, code, 'Designing Workplaces That Think');
	await copyDefaultFeatures(db, session.id, DEFAULT_FEATURES);
	return session;
}

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const db = getDb(platform);
		const session = await getOrCreateSession(db);

		const existingParticipantId = cookies.get('participant_id');
		let validParticipant = false;

		if (existingParticipantId) {
			const existing = await db
				.select()
				.from(participants)
				.where(eq(participants.id, existingParticipantId))
				.limit(1);

			if (existing.length > 0 && existing[0].sessionId === session.id) {
				validParticipant = true;
			}
		}

		if (!validParticipant) {
			const participant = await createParticipant(db, session.id);

			cookies.set('participant_id', participant.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24
			});
			cookies.set('session_id', session.id, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24
			});

			// Clear UX cookies so returning user data doesn't bleed into a new participant
			cookies.delete('user_name', { path: '/' });
			cookies.delete('user_email', { path: '/' });
		}

		redirect(303, '/vote');
	}
};
