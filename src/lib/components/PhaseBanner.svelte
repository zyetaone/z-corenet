<script lang="ts">
	let { phase }: { phase: 'individual' | 'communal' } = $props();

	let isIndividual = $derived(phase === 'individual');
</script>

<div class="phase-banner">
	{#if isIndividual}
		<h2 class="banner-heading heading-a">&#x1f9e0; Phase A &mdash; The Individual Brain</h2>
	{:else}
		<h2 class="banner-heading heading-b">&#x1f91d; Phase B &mdash; The Connected Brain</h2>
	{/if}
</div>

<style>
	.phase-banner {
		text-align: center;
		padding: 0.5rem;
		margin-bottom: 1rem;
	}

	.banner-heading {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.5rem;
		margin-bottom: 0;
	}

	.heading-a {
		color: var(--green);
	}

	.heading-b {
		color: #8c9eff;
	}
</style>
