import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getSessionWorkspaceImages, getAllWorkspaceImages } from '$lib/server/db/queries';

export const GET: RequestHandler = async ({ platform, cookies, url }) => {
	const db = getDb(platform);
	const sessionId = cookies.get('session_id');
	const showAll = url.searchParams.get('all') === '1';

	// If ?all=1, return all images (cross-session showcase) — requires a valid session
	// Otherwise, return only images for the current session
	const images = showAll
		? sessionId
			? await getAllWorkspaceImages(db)
			: []
		: sessionId
			? await getSessionWorkspaceImages(db, sessionId)
			: [];

	// Split into individual and collective — keep ALL generations
	const individual: (typeof images)[0][] = [];
	const collective: (typeof images)[0][] = [];

	for (const img of images) {
		if (img.type === 'collective') {
			collective.push(img);
		} else {
			individual.push(img);
		}
	}

	return json({
		individual: individual.map((img) => ({
			id: img.id,
			participantName: img.participantName ?? 'Anonymous',
			imageData: img.imageData,
			featureNames: img.featureNames ? JSON.parse(img.featureNames) : [],
			prompt: img.prompt,
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
