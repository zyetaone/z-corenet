import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { createSession, copyDefaultFeatures } from '$lib/server/db/queries';
import { buildTallyResult } from '$lib/server/tally';
import { DEFAULT_FEATURES } from '$lib/data/default-features';

function generateCode(): string {
	return crypto.randomUUID().slice(0, 6).toUpperCase();
}

export const load: PageServerLoad = async ({ url, platform }) => {
	const code = url.searchParams.get('code');
	if (code) {
		const db = getDb(platform);
		const tally = await buildTallyResult(db, code);
		if (tally) {
			return { mode: 'dashboard' as const, ...tally };
		}
	}
	return { mode: 'create' as const };
};

export const actions: Actions = {
	create: async ({ request, platform }) => {
		const db = getDb(platform);
		const formData = await request.formData();
		const title = (formData.get('title') as string)?.trim() || 'Designing Workplaces That Think';

		const code = generateCode();
		const session = await createSession(db, code, title);
		await copyDefaultFeatures(db, session.id, DEFAULT_FEATURES);

		return { code };
	}
};
