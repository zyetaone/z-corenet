export interface ImageStreamResult {
	imageData: string;
	prompt: string;
	generationsRemaining: number;
}

export interface ImageStreamCallbacks {
	onProgress: (progress: number, message: string) => void;
	onResult: (result: ImageStreamResult) => void;
	onError: (message: string) => void;
}

/**
 * POST to /api/generate-image and handle the response,
 * whether it's a direct JSON result or an SSE stream.
 */
export async function streamImageGeneration(
	body: Record<string, unknown>,
	callbacks: ImageStreamCallbacks
): Promise<void> {
	const res = await fetch('/api/generate-image', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ message: 'Generation failed' }));
		throw new Error(err.message ?? `HTTP ${res.status}`);
	}

	const contentType = res.headers.get('content-type') ?? '';

	if (contentType.includes('application/json')) {
		const result = await res.json();
		callbacks.onResult({
			imageData: result.imageData,
			prompt: result.prompt,
			generationsRemaining: result.generationsRemaining
		});
		return;
	}

	// SSE stream
	const reader = res.body!.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });

		const events = buffer.split('\n\n');
		buffer = events.pop() || '';

		for (const event of events) {
			const dataLine = event.split('\n').find((l) => l.startsWith('data: '));
			if (!dataLine) continue;
			const payload = JSON.parse(dataLine.slice(6));

			if (payload.type === 'progress') {
				callbacks.onProgress(payload.progress, payload.message ?? '');
			} else if (payload.type === 'result') {
				callbacks.onResult({
					imageData: payload.imageData,
					prompt: payload.prompt,
					generationsRemaining: payload.generationsRemaining
				});
			} else if (payload.type === 'error') {
				const msg = payload.message || 'Generation failed';
				callbacks.onError(msg);
				throw new Error(msg);
			}
		}
	}
}
