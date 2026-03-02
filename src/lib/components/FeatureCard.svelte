<script lang="ts">
	import type { SessionFeature } from '$lib/server/db/schema';
	import { CATEGORY_ICONS } from '$lib/data/icons';

	let {
		feature,
		selected,
		disabled,
		used,
		phase,
		onclick
	}: {
		feature: SessionFeature;
		selected: boolean;
		disabled: boolean;
		used: boolean;
		phase: 'individual' | 'communal';
		onclick: () => void;
	} = $props();

	let checkClass = $derived(selected ? (phase === 'individual' ? 'on-a' : 'on-b') : 'off');

	let icon = $derived(CATEGORY_ICONS[feature.category] ?? '📌');
</script>

<button
	type="button"
	class="feature-card"
	class:selected-a={selected && phase === 'individual'}
	class:selected-b={selected && phase === 'communal'}
	class:disabled={disabled && !used}
	class:used
	onclick={!disabled && !used ? onclick : undefined}
	{disabled}
	tabindex={used ? -1 : 0}
	aria-disabled={used || disabled}
>
	<span class="card-check {checkClass}">
		{#if selected}✓{/if}
	</span>
	<span class="card-body">
		<span class="card-name">
			<span class="card-icon">{icon}</span>
			{feature.name}
		</span>
		<span class="card-desc">
			{feature.description}
			{#if used}
				<span class="used-label">(selected in Phase A)</span>
			{/if}
		</span>
	</span>
</button>

<style>
	.feature-card {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		width: 100%;
		min-height: 3rem;
		padding: 1rem 1.125rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		cursor: pointer;
		user-select: none;
		text-align: left;
		font-family: 'DM Sans', sans-serif;
		transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); /* Springy easing */
	}

	.feature-card:hover:not(.disabled):not(.used) {
		border-color: rgba(255, 255, 255, 0.25);
		background: rgba(255, 255, 255, 0.07);
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.feature-card:active:not(.disabled):not(.used) {
		transform: scale(0.97) translateY(0);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.feature-card.selected-a {
		background: rgba(0, 200, 83, 0.08);
		border-color: var(--green);
	}

	.feature-card.selected-b {
		background: rgba(92, 107, 192, 0.08);
		border-color: var(--indigo);
	}

	.feature-card.disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.feature-card.used {
		opacity: 0.25;
		cursor: not-allowed;
		pointer-events: none;
	}

	.card-check {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.375rem;
		flex-shrink: 0;
		margin-top: 1px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.18s;
		font-size: 0.875rem;
		font-weight: 700;
		color: #fff;
	}

	.card-check.off {
		background: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.2);
	}

	.card-check.on-a {
		background: var(--green);
		border: none;
	}

	.card-check.on-b {
		background: var(--indigo);
		border: none;
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.card-name {
		font-family: 'Playfair Display', Georgia, serif;
		font-weight: 600;
		font-size: 0.9375rem;
		color: #fff;
		line-height: 1.3;
	}

	.card-icon {
		font-size: 0.9375rem;
	}

	.card-desc {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.5);
		line-height: 1.45;
	}

	.used-label {
		display: inline;
		font-style: italic;
		color: rgba(255, 255, 255, 0.35);
	}
</style>
