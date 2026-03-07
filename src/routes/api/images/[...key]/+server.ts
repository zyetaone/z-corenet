import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const bucket = platform?.env?.IMAGES;
	if (!bucket) error(503, 'Image storage not available');

	const key = params.key;
	if (!key || !key.startsWith('workspaces/')) {
		error(400, 'Invalid image key');
	}

	const obj = await bucket.get(key);
	if (!obj) error(404, 'Image not found');

	const headers = new Headers();
	headers.set('Content-Type', obj.httpMetadata?.contentType ?? 'image/webp');
	headers.set('Cache-Control', 'public, max-age=31536000, immutable');

	return new Response(obj.body, { headers });
};
