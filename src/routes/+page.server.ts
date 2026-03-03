import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import {
	getLatestOpenSession,
	createSession,
	copyDefaultFeatures,
	createParticipant
} from '$lib/server/db/queries';
import { DEFAULT_FEATURES } from '$lib/data/default-features';

function generateCode(): string {
	return crypto.randomUUID().slice(0, 6).toUpperCase();
}

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

		redirect(303, '/vote');
	}
};
