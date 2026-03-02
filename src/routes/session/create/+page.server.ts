import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import { createSession, copyDefaultFeatures } from '$lib/server/db/queries';
import { DEFAULT_FEATURES } from '$lib/data/default-features';

function generateCode(): string {
	return crypto.randomUUID().slice(0, 6).toUpperCase();
}

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const db = getDb(platform);
		const formData = await request.formData();
		const title =
			(formData.get('title') as string)?.trim() || 'Designing Workplaces That Think';

		const code = generateCode();
		const session = await createSession(db, code, title);
		await copyDefaultFeatures(db, session.id, DEFAULT_FEATURES);

		redirect(303, `/session/${code}/dashboard`);
	}
};
