import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getSessionWorkspaceImages, getAllWorkspaceImages } from '$lib/server/db/queries';
import { isR2Key } from '$lib/server/r2';

function resolveImageSrc(imageData: string, origin: string): string {
	if (isR2Key(imageData)) {
		return `${origin}/api/images/${imageData}`;
	}
	return imageData; // Legacy base64 data URI
}

export const GET: RequestHandler = async ({ platform, cookies, url }) => {
	const db = getDb(platform);
	const sessionId = cookies.get('session_id');
	const showAll = url.searchParams.get('all') === '1';
	const origin = url.origin;

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
			imageData: resolveImageSrc(img.imageData, origin),
			featureNames: img.featureNames ? JSON.parse(img.featureNames) : [],
			prompt: img.prompt,
			createdAt: img.createdAt
		})),
		collective: collective.map((img) => ({
			id: img.id,
			imageData: resolveImageSrc(img.imageData, origin),
			prompt: img.prompt,
			featureNames: img.featureNames ? JSON.parse(img.featureNames) : [],
			createdAt: img.createdAt
		}))
	});
};
