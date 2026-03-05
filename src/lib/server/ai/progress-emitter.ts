let emitter = new EventTarget();

export function emitProgress(id: string, progress: number, message: string) {
	emitter.dispatchEvent(
		new CustomEvent('progress', {
			detail: { id, progress, message }
		})
	);
}

export function subscribeProgress(id: string, callback: (progress: number, message: string) => void) {
	const handler = (e: Event) => {
		const customEvent = e as CustomEvent;
		if (customEvent.detail.id === id) {
			callback(customEvent.detail.progress, customEvent.detail.message);
		}
	};
	emitter.addEventListener('progress', handler);
	return () => emitter.removeEventListener('progress', handler);
}
