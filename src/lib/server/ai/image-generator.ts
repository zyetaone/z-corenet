import { fal } from '@fal-ai/client';

const MAX_GENERATIONS = 3;

export { MAX_GENERATIONS };

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
	const evidenceBacked = features
		.filter((f) => f.hasEvidence)
		.map((f) => f.name.toLowerCase());
	const allFeatures = features.map((f) => f.name.toLowerCase()).join(', ');

	const parts = [
		`Create a photorealistic architectural visualisation of a modern workplace interior`,
		`designed for cognitive performance. The space must prominently feature: ${allFeatures}.`
	];

	if (evidenceBacked.length > 0) {
		parts.push(
			`These evidence-backed elements should be prominent and well-integrated: ${evidenceBacked.join(', ')}.`
		);
	}

	parts.push(
		`Show humans actively using the space — people collaborating, working in focus zones,`,
		`taking breaks in green spaces.`,
		`Design an office relevant in 2033. Capture the entire spatial narrative from an elevated`,
		`three-quarter perspective showing multiple interconnected zones and their relationships.`,
		`Hyperrealistic architectural photography | Camera: Wide-angle 24mm lens capturing full`,
		`spatial context | Lighting: Natural daylight with subtle artificial accents | Style:`,
		`Premium architectural digest quality | No text, labels, watermarks, or UI elements.`,
		`Emphasize materiality, spatial flow, and the interplay of light and form.`
	);

	if (additionalPrompt?.trim()) {
		parts.push(`Additional requirements: ${additionalPrompt.trim()}`);
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
 * Call fal.ai nano-banana-2 and return a base64 data URI.
 */
export async function generateWorkspaceImage(prompt: string): Promise<{
	imageData: string;
	prompt: string;
}> {
	const result = await fal.subscribe('fal-ai/nano-banana-2', {
		input: {
			prompt,
			num_images: 1,
			aspect_ratio: '16:9',
			resolution: '1K',
			output_format: 'jpeg'
		}
	});

	const imageUrl = result.data?.images?.[0]?.url;
	if (!imageUrl) {
		throw new Error('No image URL in fal.ai response');
	}

	// Fetch the temporary URL and convert to base64 data URI
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
	const base64 = btoa(binary);
	const imageData = `data:image/jpeg;base64,${base64}`;

	return { imageData, prompt };
}
