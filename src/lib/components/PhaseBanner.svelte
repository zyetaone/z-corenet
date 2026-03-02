<script lang="ts">
	let { phase }: { phase: 'individual' | 'communal' } = $props();

	let isIndividual = $derived(phase === 'individual');
</script>

<div class="phase-banner">
	{#if isIndividual}
		<h2 class="banner-heading heading-a">&#x1f9e0; Phase A &mdash; The Individual Brain</h2>
		<p class="banner-sub">Choose 5 features that help <strong>you</strong> do your best thinking</p>
	{:else}
		<h2 class="banner-heading heading-b">&#x1f91d; Phase B &mdash; The Connected Brain</h2>
		<p class="banner-sub">Choose 5 features that help your <strong>team</strong> think together</p>
	{/if}
</div>

<style>
	.phase-banner {
		text-align: center;
		padding: 1rem 0.5rem;
		margin-bottom: 1.5rem;
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
		color: var(--indigo-text);
	}

	.banner-sub {
		font-size: 0.9375rem;
		color: rgba(255, 255, 255, 0.45);
		margin-top: 0.375rem;
	}
	.banner-sub strong {
		color: rgba(255, 255, 255, 0.75);
	}
</style>
