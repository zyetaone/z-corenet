import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getSessionWorkspaceImages, getAllWorkspaceImages } from '$lib/server/db/queries';

export const GET: RequestHandler = async ({ platform, cookies, url }) => {
	const db = getDb(platform);
	const sessionId = cookies.get('session_id');
	const showAll = url.searchParams.get('all') === '1';

	// If ?all=1, return all images ever (cross-session showcase)
	// Otherwise, return only images for the current session
	const images = showAll
		? await getAllWorkspaceImages(db)
		: sessionId
			? await getSessionWorkspaceImages(db, sessionId)
			: [];

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
