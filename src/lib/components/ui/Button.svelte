<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		disabled = false,
		fullWidth = false,
		onclick,
		type = 'button',
		...rest
	}: {
		children: Snippet;
		disabled?: boolean;
		fullWidth?: boolean;
		onclick?: () => void;
		type?: 'button' | 'submit';
	} = $props();
</script>

<button {type} {disabled} {onclick} class="btn-primary" class:full-width={fullWidth} {...rest}>
	{@render children()}
</button>

<style>
	.btn-primary {
		background: linear-gradient(135deg, var(--teal), var(--accent));
		color: #fff;
		border: none;
		border-radius: 0.75rem;
		padding: 1rem 3.5rem;
		font-size: 1.0625rem;
		font-weight: 700;
		cursor: pointer;
		letter-spacing: 0.5px;
		box-shadow: 0 4px 28px rgba(0, 139, 139, 0.45);
		font-family: 'DM Sans', sans-serif;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 32px rgba(0, 139, 139, 0.55);
	}

	.btn-primary:active:not(:disabled) {
		transform: translateY(1px);
		box-shadow: 0 2px 16px rgba(0, 139, 139, 0.35);
	}

	.btn-primary:disabled {
		background: rgba(0, 139, 139, 0.2);
		box-shadow: none;
		cursor: not-allowed;
		opacity: 0.5;
	}

	.btn-primary:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 3px;
	}

	.btn-primary.full-width {
		width: 100%;
		padding: 1rem 2rem;
		font-size: 1.125rem;
	}
</style>
