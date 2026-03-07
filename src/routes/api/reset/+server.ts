import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { createSession, copyDefaultFeatures } from '$lib/server/db/queries';
import { DEFAULT_FEATURES } from '$lib/data/default-features';
import { generateCode } from '$lib/server/session';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ platform, request, cookies }) => {
	const ADMIN_PIN = (platform?.env as any)?.ADMIN_PIN || '1234';
	const pin = request.headers.get('x-admin-pin');

	if (pin !== ADMIN_PIN) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const db = getDb(platform);

	// Close all open sessions
	await db.update(sessions).set({ status: 'closed' }).where(eq(sessions.status, 'open'));

	// Create a fresh session
	const code = generateCode();
	const session = await createSession(db, code, 'Designing Workplaces That Think');
	await copyDefaultFeatures(db, session.id, DEFAULT_FEATURES);

	// Update the dashboard's session cookie so the next poll uses the new session
	cookies.set('session_id', session.id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: 60 * 60 * 24
	});

	return json({ ok: true });
};
