import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	// Erase the participant details to allow a fresh vote/survey completion
	cookies.delete('participant_id', { path: '/' });

	// Clear UX cookies so the new participant starts fresh
	cookies.delete('user_name', { path: '/' });
	cookies.delete('user_email', { path: '/' });

	// We intentionally keep session_id so they rejoin the same overarching active lobby context
	return json({ ok: true });
};
