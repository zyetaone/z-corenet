import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { createSession, copyDefaultFeatures } from '$lib/server/db/queries';
import { DEFAULT_FEATURES } from '$lib/data/default-features';
import { eq } from 'drizzle-orm';

function generateCode(): string {
	return crypto.randomUUID().slice(0, 6).toUpperCase();
}

export const POST: RequestHandler = async ({ platform }) => {
	const db = getDb(platform);

	// Close all open sessions
	await db.update(sessions).set({ status: 'closed' }).where(eq(sessions.status, 'open'));

	// Create a fresh session
	const code = generateCode();
	const session = await createSession(db, code, 'Designing Workplaces That Think');
	await copyDefaultFeatures(db, session.id, DEFAULT_FEATURES);

	return json({ ok: true });
};
