/**
 * R2 storage helpers for workspace images.
 *
 * Images are stored as `workspaces/<sessionId>/<imageId>.webp` keys.
 * The image_data column in D1 stores the R2 key (not base64).
 * Legacy rows with `data:image/...` prefixes are served directly.
 */

/**
 * Upload a base64 data URI to R2, returning the object key.
 */
export async function uploadImageToR2(
	bucket: R2Bucket,
	sessionId: string,
	imageId: string,
	dataUri: string
): Promise<string> {
	const [header, base64] = dataUri.split(',');
	const mime = header.match(/:(.*?);/)?.[1] ?? 'image/webp';
	const ext = mime.split('/')[1] ?? 'webp';

	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	const key = `workspaces/${sessionId}/${imageId}.${ext}`;
	await bucket.put(key, bytes, {
		httpMetadata: { contentType: mime }
	});

	return key;
}

/**
 * Check if a stored value is a legacy base64 data URI or an R2 key.
 */
export function isR2Key(value: string): boolean {
	return !value.startsWith('data:');
}

/**
 * Build a public URL for an R2 key.
 * Uses the R2 public dev domain. Replace with custom domain in production.
 */
export function r2KeyToUrl(key: string, origin: string): string {
	return `${origin}/api/images/${encodeURIComponent(key)}`;
}

/**
 * Get image data — either the legacy base64 or fetch from R2 and return as data URI.
 */
export async function getImageData(
	bucket: R2Bucket | undefined,
	storedValue: string
): Promise<string> {
	if (!isR2Key(storedValue)) {
		return storedValue; // Legacy base64 data URI
	}

	if (!bucket) {
		throw new Error('R2 bucket not available');
	}

	const obj = await bucket.get(storedValue);
	if (!obj) {
		throw new Error(`Image not found in R2: ${storedValue}`);
	}

	const arrayBuffer = await obj.arrayBuffer();
	const mime = obj.httpMetadata?.contentType ?? 'image/webp';
	const bytes = new Uint8Array(arrayBuffer);

	let binary = '';
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
	}
	return `data:${mime};base64,${btoa(binary)}`;
}
