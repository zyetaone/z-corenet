<script lang="ts">
	import { setContext } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	setContext('session', () => data.session);
	setContext('features', () => data.features);
</script>

{@render children()}
