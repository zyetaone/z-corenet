import { onMount } from 'svelte';

export function useMount() {
	let mounted = $state(false);
	let reduceMotion = $state(false);

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
	});

	return {
		get mounted() {
			return mounted;
		},
		get reduceMotion() {
			return reduceMotion;
		}
	};
}
