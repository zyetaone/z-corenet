/**
 * Reactive flag that flips to `true` after a delay.
 * Used by chart components to run entry animations once, then stop.
 *
 * Usage:
 *   const anim = useAnimateOnce();
 *   style={!anim.done ? `animation: bar-enter 0.5s ease-out both; animation-delay: ${i * 60}ms` : ''}
 */
export function useAnimateOnce(delay = 1500) {
	let done = $state(false);

	$effect(() => {
		if (!done) {
			const timer = setTimeout(() => {
				done = true;
			}, delay);
			return () => clearTimeout(timer);
		}
	});

	return {
		get done() {
			return done;
		}
	};
}
