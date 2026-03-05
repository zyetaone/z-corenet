import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscribeProgress } from '$lib/server/ai/progress-emitter';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const sessionId = cookies.get('session_id');
	if (!sessionId) error(401, 'No active session');

	const trackingId = url.searchParams.get('id');
	if (!trackingId) error(400, 'Missing tracking ID');

	let closed = false;
	let interval: ReturnType<typeof setInterval>;
	let unsubscribe: () => void;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();
			const write = (chunk: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					// Controller already closed — ignore
				}
			};

			write('retry: 1000\n\n');

			unsubscribe = subscribeProgress(trackingId, (progress, message) => {
				write(`data: ${JSON.stringify({ progress, message })}\n\n`);
			});

			interval = setInterval(() => write(': keepalive\n\n'), 15000);
		},
		cancel() {
			closed = true;
			clearInterval(interval);
			unsubscribe?.();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
