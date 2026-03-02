<script lang="ts">
	let { phase }: { phase: 'individual' | 'communal' } = $props();

	let isIndividual = $derived(phase === 'individual');
</script>

<div class="phase-banner" class:phase-a={isIndividual} class:phase-b={!isIndividual}>
	{#if isIndividual}
		<h2 class="banner-heading heading-a">&#x1f9e0; Phase A &mdash; The Individual Brain</h2>
		<p class="banner-text">
			Select the <strong>5 features</strong> you believe have the greatest impact on an
			<strong>individual knowledge worker's cognitive performance</strong> &mdash; their body budget,
			focus, mental energy and sustained thinking ability.
		</p>
		<span class="research-ref">
			Based on AWA &amp; CEBMa research: The 13 Factors of Cognitive Fitness &middot; Lisa Feldman
			Barrett's Body Budget Model
		</span>
	{:else}
		<h2 class="banner-heading heading-b">&#x1f91d; Phase B &mdash; The Connected Brain</h2>
		<p class="banner-text">
			From the <strong>remaining features</strong>, select the <strong>5</strong> you believe have
			the greatest impact on
			<strong>team and communal cognitive performance</strong> &mdash; trust, social cohesion, information
			sharing and collective intelligence.
		</p>
		<span class="research-ref">
			Based on AWA &amp; CEBMa research: The 6 Factors of Connected Teams &middot; Neural Synchrony
			in Co-located Teams
		</span>
	{/if}
</div>

<style>
	.phase-banner {
		text-align: center;
		padding: 1.25rem;
		margin-bottom: 1.25rem;
		border-radius: 0.875rem;
	}

	.phase-a {
		background: linear-gradient(135deg, rgba(0, 200, 83, 0.06), rgba(0, 200, 83, 0.02));
		border: 1px solid rgba(0, 200, 83, 0.15);
	}

	.phase-b {
		background: linear-gradient(135deg, rgba(92, 107, 192, 0.06), rgba(92, 107, 192, 0.02));
		border: 1px solid rgba(92, 107, 192, 0.15);
	}

	.banner-heading {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.375rem;
		margin-bottom: 0.375rem;
	}

	.heading-a {
		color: #1b5e20;
	}

	.heading-b {
		color: #3949ab;
	}

	.banner-text {
		font-size: 0.875rem;
		color: #777;
		line-height: 1.5;
	}

	.research-ref {
		display: inline-block;
		margin-top: 0.5rem;
		font-size: 0.75rem;
		color: #999;
		font-style: italic;
		background: rgba(0, 0, 0, 0.03);
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
	}
</style>
