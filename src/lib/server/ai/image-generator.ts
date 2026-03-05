import { fal } from '@fal-ai/client';
import { emitProgress } from './progress-emitter';

const MAX_GENERATIONS = 3;
const MAX_COLLECTIVE_GENERATIONS = 10;

export { MAX_GENERATIONS, MAX_COLLECTIVE_GENERATIONS };

/**
 * Configure fal.ai client with API key from platform env.
 */
export function configureFal(apiKey: string): void {
	fal.config({ credentials: apiKey });
}

/**
 * Build a hybrid workspace prompt combining CoreNet evidence awareness
 * with workspace-studio rendering specifications.
 */
export function buildWorkspacePrompt(
	features: Array<{ name: string; hasEvidence: boolean }>,
	additionalPrompt?: string
): string {
	const allFeatures = features.map((f) => f.name.toLowerCase()).join(', ');
	const annotations = features
		.map((f) => `${f.name.toLowerCase()} = ${f.hasEvidence ? 'GREEN' : 'RED'} circle`)
		.join('; ');

	// Rotate material palettes across generations for visual variety
	const palettes = [
		'warm timber, terrazzo floors, brass fixtures, and woven textiles',
		'polished concrete, blackened steel, frosted glass partitions, and pops of citrus colour',
		'pale oak, white marble, matte ceramic, and sage-green upholstery',
		'reclaimed brick, brushed copper, live-edge wood slabs, and indigo accents',
		'birch plywood, cork panels, matte black frames, and burnt-orange soft furnishings'
	];
	const palette = palettes[Math.floor(Math.random() * palettes.length)];

	const parts = [
		`Create a photorealistic architectural visualisation of a forward-thinking workplace interior`,
		`designed for cognitive performance and well-being. The space must prominently feature: ${allFeatures}.`,
		`Show humans actively using the space — people collaborating, working in focus zones,`,
		`and taking breaks in biophilic areas. Material palette: ${palette}.`,
		`Incorporate subtle forward-looking design touches — fluid organic forms, integrated smart surfaces,`,
		`and thoughtful use of natural light — while keeping the overall aesthetic warm and inviting.`,
		`Wide-angle professional architectural photography, cinematic lighting.`
	];

	parts.push(
		`\n\nANNOTATION OVERLAY: Circle each feature with a coloured ring and thin leader line to a caption panel:`,
		`${annotations}.`,
		`GREEN circles = strong scientific evidence for cognitive performance.`,
		`RED circles = limited evidence.`,
		`Use professional architectural diagram overlay style — clean, modern, semi-transparent caption backgrounds (green-tinted or red-tinted).`
	);

	if (additionalPrompt?.trim()) {
		parts.push(`\nAdditional requirements: ${additionalPrompt.trim()}`);
	}

	return parts.join(' ');
}

/**
 * Build regeneration prompt by appending user modifications.
 */
export function buildRegenerationPrompt(
	previousPrompt: string,
	userInput?: string
): string {
	if (userInput?.trim()) {
		return `${previousPrompt} | Alternative version: ${userInput.trim()}`;
	}
	return `${previousPrompt} | Show me another option with a fresh perspective and different design approach while maintaining the core requirements.`;
}

/**
 * Convert a base64 data URI to a Blob for uploading.
 */
const ALLOWED_MIMES = new Set(['image/webp', 'image/jpeg', 'image/png']);

function dataUriToBlob(dataUri: string): Blob {
	const [header, base64] = dataUri.split(',');
	const mime = header.match(/:(.*?);/)?.[1] ?? 'image/webp';
	if (!ALLOWED_MIMES.has(mime)) {
		throw new Error(`Unsupported image type: ${mime}`);
	}
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new Blob([bytes], { type: mime });
}

/**
 * Convert a fal.ai image URL response to a base64 data URI.
 */
async function imageUrlToDataUri(imageUrl: string): Promise<string> {
	const imageResponse = await fetch(imageUrl);
	if (!imageResponse.ok) {
		throw new Error(`Failed to fetch image: ${imageResponse.status}`);
	}

	const arrayBuffer = await imageResponse.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);

	// Convert to base64 in chunks to avoid call stack overflow
	let binary = '';
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
	}
	return `data:image/webp;base64,${btoa(binary)}`;
}

/**
 * Call fal.ai nano-banana-2 and return a base64 data URI.
 */
export async function generateWorkspaceImage(prompt: string, trackingId?: string): Promise<{
	imageData: string;
	prompt: string;
}> {
	let currentProgress = 0;
	if (trackingId) emitProgress(trackingId, currentProgress, 'Starting generation...');

	const result = await fal.subscribe('fal-ai/nano-banana-2', {
		input: {
			prompt,
			num_images: 1,
			aspect_ratio: '16:9',
			resolution: '1K',
			output_format: 'webp'
		},
		onQueueUpdate(update) {
			if (!trackingId) return;
			if (update.status === 'IN_PROGRESS') {
				// Fake a progressive increase between 10-90% based on multiple log events
				currentProgress = Math.min(95, currentProgress + 15);
				const msg = update.logs?.[update.logs.length - 1]?.message ?? 'Processing image...';
				emitProgress(trackingId, currentProgress, msg);
			} else if (update.status === 'IN_QUEUE') {
				emitProgress(trackingId, 5, 'Waiting in queue...');
			}
		}
	});

	const imageUrl = result.data?.images?.[0]?.url;
	if (!imageUrl) {
		throw new Error('No image URL in fal.ai response');
	}

	if (trackingId) emitProgress(trackingId, 97, 'Downloading image...');
	const imageData = await imageUrlToDataUri(imageUrl);
	return { imageData, prompt };
}

/**
 * Edit an existing image via fal.ai nano-banana/edit endpoint.
 * Uploads the base64 image to fal storage, then sends it for editing.
 */
export async function editWorkspaceImage(
	currentImageDataUri: string,
	editPrompt: string,
	trackingId?: string
): Promise<{
	imageData: string;
	prompt: string;
}> {
	let currentProgress = 0;
	if (trackingId) emitProgress(trackingId, currentProgress, 'Uploading image for editing...');

	// Upload base64 image to fal storage so we can pass a URL
	const blob = dataUriToBlob(currentImageDataUri);
	const file = new File([blob], 'workspace.webp', { type: blob.type });
	const uploadedUrl = await fal.storage.upload(file);

	if (trackingId) emitProgress(trackingId, 10, 'Starting image edit...');

	// Wrap user edit instruction to preserve existing annotation overlays
	const wrappedPrompt = [
		editPrompt,
		'IMPORTANT: Preserve all existing text labels, annotation overlays, coloured circles,',
		'caption panels, and leader lines exactly as they appear in the original image.',
		'Only modify the areas and elements described above. Do not remove or alter any labels',
		'unless explicitly asked to.'
	].join(' ');

	const result = await fal.subscribe('fal-ai/nano-banana/edit', {
		input: {
			prompt: wrappedPrompt,
			image_urls: [uploadedUrl],
			num_images: 1,
			output_format: 'webp'
		},
		onQueueUpdate(update) {
			if (!trackingId) return;
			if (update.status === 'IN_PROGRESS') {
				currentProgress = Math.min(95, currentProgress + 15);
				const msg = update.logs?.[update.logs.length - 1]?.message ?? 'Editing image...';
				emitProgress(trackingId, currentProgress, msg);
			} else if (update.status === 'IN_QUEUE') {
				emitProgress(trackingId, 5, 'Waiting in queue...');
			}
		}
	});

	const imageUrl = result.data?.images?.[0]?.url;
	if (!imageUrl) {
		throw new Error('No image URL in fal.ai edit response');
	}

	if (trackingId) emitProgress(trackingId, 97, 'Downloading edited image...');
	const imageData = await imageUrlToDataUri(imageUrl);
	return { imageData, prompt: editPrompt };
}
