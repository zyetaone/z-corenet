<script lang="ts">
	import type { SessionFeature } from '$lib/server/db/schema';
	import CategoryIcon from './CategoryIcon.svelte';
	import { CATEGORY_TO_GROUP } from '$lib/data/default-features';

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
	aria-pressed={selected}
>
	<div class="card-header">
		<span class="card-icon-wrapper">
			<span class="card-icon"
				><CategoryIcon
					group={CATEGORY_TO_GROUP[feature.category] ?? feature.category}
					size={22}
					animated={true}
				/></span
			>
		</span>
		<span class="card-check {checkClass}">
			{#if selected}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 stroke-[3px]"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
			{/if}
		</span>
	</div>
	<div class="card-body">
		<span class="card-name">
			{feature.name}
		</span>
		<span class="card-desc">
			{feature.description}
			{#if used}
				<span class="used-label mt-2 block">Selected individually</span>
			{/if}
		</span>
		<span class="card-evidence" class:has-evidence={feature.hasEvidence}>
			{#if feature.hasEvidence}&#10003; Evidence-based{:else}&#10007; Limited evidence{/if}
		</span>
	</div>
</button>

<style>
	.feature-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		height: 100%;
		padding: 1.25rem;
		background: rgba(15, 25, 35, 0.06);
		border: 1px solid rgba(15, 25, 35, 0.12);

		:global(.theme-dark-blue) & {
			background: rgba(255, 255, 255, 0.03);
			border: 1px solid rgba(255, 255, 255, 0.06);
		}

		border-radius: 1.25rem;
		cursor: pointer;
		user-select: none;
		text-align: left;
		font-family: 'DM Sans', sans-serif;
		transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
		position: relative;
		overflow: hidden;
		color: currentColor;
	}

	.feature-card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(15, 25, 35, 0.03) 0%, transparent 100%);

		:global(.theme-dark-blue) & {
			background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
		}

		opacity: 0;
		transition: opacity 0.3s;
	}

	.feature-card:hover:not(.disabled):not(.used) {
		border-color: rgba(15, 25, 35, 0.15);
		background: rgba(15, 25, 35, 0.05);

		:global(.theme-dark-blue) & {
			border-color: rgba(255, 255, 255, 0.2);
			background: rgba(255, 255, 255, 0.06);
			box-shadow:
				0 12px 32px rgba(0, 0, 0, 0.2),
				inset 0 1px 0 rgba(255, 255, 255, 0.1);
		}

		transform: translateY(-4px);
		box-shadow:
			0 12px 32px rgba(15, 25, 35, 0.08),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	.feature-card:hover:not(.disabled):not(.used)::before {
		opacity: 1;
	}

	.feature-card:active:not(.disabled):not(.used) {
		transform: scale(0.98) translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.feature-card.selected-a {
		background: rgba(0, 200, 83, 0.08);
		border-color: rgba(0, 200, 83, 0.3);
		box-shadow:
			0 4px 20px rgba(0, 200, 83, 0.1),
			inset 0 0 0 1px rgba(0, 200, 83, 0.2);

		:global(.theme-dark-blue) & {
			box-shadow:
				0 4px 20px rgba(0, 200, 83, 0.15),
				inset 0 0 0 1px rgba(0, 200, 83, 0.2);
		}
	}

	.feature-card.selected-b {
		background: rgba(92, 107, 192, 0.08);
		border-color: rgba(92, 107, 192, 0.3);
		box-shadow:
			0 4px 20px rgba(92, 107, 192, 0.15),
			inset 0 0 0 1px rgba(92, 107, 192, 0.2);
	}

	.feature-card.disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.feature-card.used {
		opacity: 0.3;
		cursor: not-allowed;
		pointer-events: none;
		background: rgba(0, 0, 0, 0.2);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		width: 100%;
		position: relative;
		z-index: 10;
	}

	.card-icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.75rem;
		background: rgba(15, 25, 35, 0.06);
		border: 1px solid rgba(15, 25, 35, 0.08);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		transition: all 0.3s ease;
	}

	:global(.theme-dark-blue) .card-icon-wrapper {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.feature-card:hover:not(.disabled):not(.used) .card-icon-wrapper {
		transform: scale(1.05) rotate(-3deg);
		background: rgba(15, 25, 35, 0.1);
	}

	:global(.theme-dark-blue) .feature-card:hover:not(.disabled):not(.used) .card-icon-wrapper {
		background: rgba(255, 255, 255, 0.1);
	}

	.feature-card.selected-a .card-icon-wrapper {
		background: rgba(0, 200, 83, 0.15);
		border-color: rgba(0, 200, 83, 0.3);
		color: var(--green);
	}

	.feature-card.selected-b .card-icon-wrapper {
		background: rgba(92, 107, 192, 0.15);
		border-color: rgba(92, 107, 192, 0.3);
		color: #8c9eff;
	}

	.card-icon {
		font-size: 1.25rem;
	}

	.card-check {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
		color: transparent;
	}

	.card-check.off {
		background: transparent;
		border: 2px solid rgba(15, 25, 35, 0.2);

		:global(.theme-dark-blue) & {
			border: 2px solid rgba(255, 255, 255, 0.15);
		}
	}

	.feature-card:hover:not(.disabled):not(.used) .card-check.off {
		border-color: rgba(15, 25, 35, 0.4);

		:global(.theme-dark-blue) & {
			border-color: rgba(255, 255, 255, 0.3);
		}
	}

	.card-check.on-a {
		background: var(--green);
		border: 2px solid var(--green);
		color: #fff;
		box-shadow: 0 0 10px rgba(0, 200, 83, 0.3);
		transform: scale(1.1);
	}

	.card-check.on-b {
		background: var(--indigo);
		border: 2px solid var(--indigo);
		color: #fff;
		box-shadow: 0 0 10px rgba(92, 107, 192, 0.4);
		transform: scale(1.1);
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		position: relative;
		z-index: 10;
	}

	.card-name {
		font-family: 'DM Sans', sans-serif;
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.3;
		letter-spacing: -0.01em;
		color: currentColor;
	}

	.feature-card.selected-a .card-name {
		color: var(--green-dim);
	}

	.feature-card.selected-b .card-name {
		color: #b8c4ff;
	}

	.card-desc {
		font-size: 0.8125rem;
		opacity: 0.85;
		line-height: 1.5;
	}

	.used-label {
		font-size: 0.65rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.5;
	}

	.card-evidence {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: rgba(239, 68, 68, 0.08);
		color: var(--red-text);
		border: 1px solid rgba(239, 68, 68, 0.15);
	}

	.card-evidence.has-evidence {
		background: rgba(0, 200, 83, 0.1);
		color: var(--green-text);
		border: 1px solid rgba(0, 200, 83, 0.2);
	}

	:global(.theme-dark-blue) .card-evidence {
		background: rgba(239, 68, 68, 0.12);
		border-color: rgba(239, 68, 68, 0.2);
	}

	:global(.theme-dark-blue) .card-evidence.has-evidence {
		background: rgba(0, 200, 83, 0.15);
		border-color: rgba(0, 200, 83, 0.25);
	}
</style>
