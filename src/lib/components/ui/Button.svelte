<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		disabled = false,
		loading = false,
		fullWidth = false,
		onclick,
		type = 'button',
		...rest
	}: {
		children: Snippet;
		disabled?: boolean;
		loading?: boolean;
		fullWidth?: boolean;
		onclick?: () => void;
		type?: 'button' | 'submit';
		class?: string;
		style?: string;
		[key: string]: any;
	} = $props();
</script>

<button
	{type}
	disabled={disabled || loading}
	{onclick}
	class="btn-primary"
	class:full-width={fullWidth}
	class:is-loading={loading}
	{...rest}
>
	{#if loading}
		<span class="loading-spinner"></span>
	{/if}
	<span class:opacity-0={loading}>
		{@render children()}
	</span>
</button>

<style>
	.btn-primary {
		position: relative;
		overflow: hidden;
		background: linear-gradient(135deg, var(--color-teal), var(--color-accent));
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 1rem;
		padding: 1.125rem 3.5rem;
		font-size: 1.0625rem;
		font-weight: 700;
		cursor: pointer;
		letter-spacing: 0.05em;
		box-shadow:
			0 4px 20px rgba(0, 191, 165, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		font-family: 'DM Sans', sans-serif;
		transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
		z-index: 1;
	}

	.btn-primary::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: -1;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow:
			0 8px 30px rgba(0, 191, 165, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.btn-primary:hover:not(:disabled)::before {
		opacity: 1;
	}

	.btn-primary:active:not(:disabled) {
		transform: scale(0.97) translateY(0);
		box-shadow:
			0 2px 10px rgba(0, 191, 165, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.btn-primary:disabled {
		background: rgba(15, 25, 35, 0.06);
		border-color: rgba(15, 25, 35, 0.08);
		color: rgba(15, 25, 35, 0.25);
		box-shadow: none;
		cursor: not-allowed;
		transform: none;
	}

	:global(.theme-dark-blue) .btn-primary:disabled {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.3);
	}

	.btn-primary:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 4px;
	}

	.btn-primary.full-width {
		width: 100%;
		padding: 1.125rem 2rem;
		font-size: 1.125rem;
	}
	.btn-primary.is-loading {
		cursor: wait;
	}

	.loading-spinner {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: #fff;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	.opacity-0 {
		opacity: 0;
	}
</style>
