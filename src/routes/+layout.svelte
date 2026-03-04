<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Designing Workplaces That Think · AWA x Zyeta</title>
</svelte:head>

{@render children()}
