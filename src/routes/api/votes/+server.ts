import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getActiveTally } from '$lib/server/session';

export const GET: RequestHandler = async ({ platform, cookies }) => {
	const db = getDb(platform);
	const result = await getActiveTally(db, cookies.get('session_id'));

	if (!result) {
		error(404, 'No active session');
	}

	return json(result);
};
