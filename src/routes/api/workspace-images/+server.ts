import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getSessionWorkspaceImages } from '$lib/server/db/queries';

export const GET: RequestHandler = async ({ platform, cookies }) => {
	const sessionId = cookies.get('session_id');
	if (!sessionId) error(401, 'No active session');

	const db = getDb(platform);
	const images = await getSessionWorkspaceImages(db, sessionId);

	// Split into individual and collective, return latest per participant
	const individualMap = new Map<string, (typeof images)[0]>();
	const collective: (typeof images)[0][] = [];

	for (const img of images) {
		if (img.type === 'collective') {
			collective.push(img);
		} else if (img.participantId) {
			// Keep only the latest image per participant
			if (!individualMap.has(img.participantId)) {
				individualMap.set(img.participantId, img);
			}
		}
	}

	return json({
		individual: [...individualMap.values()].map((img) => ({
			id: img.id,
			participantName: img.participantName ?? 'Anonymous',
			imageData: img.imageData,
			featureNames: img.featureNames ? JSON.parse(img.featureNames) : [],
			createdAt: img.createdAt
		})),
		collective: collective.map((img) => ({
			id: img.id,
			imageData: img.imageData,
			prompt: img.prompt,
			featureNames: img.featureNames ? JSON.parse(img.featureNames) : [],
			createdAt: img.createdAt
		}))
	});
};
