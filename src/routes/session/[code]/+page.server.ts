import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import { createParticipant, getSessionByCode } from '$lib/server/db/queries';

export const actions: Actions = {
	default: async ({ request, params, platform, cookies }) => {
		const db = getDb(platform);
		const session = await getSessionByCode(db, params.code);
		if (!session) return { error: 'Session not found' };

		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim() || undefined;

		const participant = await createParticipant(db, session.id, name);

		cookies.set('participant_id', participant.id, {
			path: `/session/${params.code}`,
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24
		});

		redirect(303, `/session/${params.code}/vote`);
	}
};
