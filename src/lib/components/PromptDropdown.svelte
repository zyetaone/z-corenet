<script lang="ts">
	import { ChevronDown, Copy, Check } from '@lucide/svelte';

	let {
		prompt,
		dark = false
	}: {
		prompt: string;
		dark?: boolean;
	} = $props();

	let open = $state(false);
	let copied = $state(false);

	function copyToClipboard() {
		navigator.clipboard.writeText(prompt);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="prompt-dropdown" class:dark-mode={dark}>
	<button type="button" class="toggle-btn" onclick={() => (open = !open)}>
		<ChevronDown size={14} class="chevron {open ? 'rotated' : ''}" />
		View full prompt
	</button>

	{#if open}
		<div class="prompt-box">
			<button type="button" class="copy-btn" onclick={copyToClipboard}>
				{#if copied}
					<Check size={14} />
				{:else}
					<Copy size={14} />
				{/if}
			</button>
			<pre class="prompt-text">{prompt}</pre>
		</div>
	{/if}
</div>

<style>
	.prompt-dropdown {
		width: 100%;
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(15, 25, 35, 0.4);
		cursor: pointer;
		background: none;
		border: none;
		padding: 0.25rem 0;
		transition: color 0.2s;
	}

	.toggle-btn:hover {
		color: rgba(15, 25, 35, 0.7);
	}

	.dark-mode .toggle-btn {
		color: rgba(255, 255, 255, 0.35);
	}

	.dark-mode .toggle-btn:hover {
		color: rgba(255, 255, 255, 0.7);
	}

	:global(.chevron) {
		transition: transform 0.2s;
	}

	:global(.chevron.rotated) {
		transform: rotate(180deg);
	}

	.prompt-box {
		position: relative;
		margin-top: 0.5rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: rgba(0, 0, 0, 0.05);
		border: 1px solid rgba(0, 0, 0, 0.08);
	}

	.dark-mode .prompt-box {
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.copy-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.375rem;
		border-radius: 0.375rem;
		background: rgba(0, 0, 0, 0.06);
		border: none;
		color: rgba(15, 25, 35, 0.4);
		cursor: pointer;
		transition: all 0.2s;
	}

	.copy-btn:hover {
		background: rgba(0, 0, 0, 0.12);
		color: rgba(15, 25, 35, 0.7);
	}

	.dark-mode .copy-btn {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.4);
	}

	.dark-mode .copy-btn:hover {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.7);
	}

	.prompt-text {
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		line-height: 1.6;
		color: rgba(15, 25, 35, 0.6);
		white-space: pre-wrap;
		word-break: break-word;
		margin: 0;
	}

	.dark-mode .prompt-text {
		color: rgba(255, 255, 255, 0.55);
	}
</style>
