<script lang="ts">
	import { RefreshCw, Download, Maximize2 } from '@lucide/svelte';
	import PromptDropdown from './PromptDropdown.svelte';

	let {
		imageData,
		prompt,
		generationsRemaining,
		onregenerate,
		dark = false
	}: {
		imageData: string;
		prompt: string;
		generationsRemaining: number;
		onregenerate: (additionalPrompt?: string) => void;
		dark?: boolean;
	} = $props();

	let repromptText = $state('');
	let fullscreen = $state(false);

	function download() {
		const link = document.createElement('a');
		link.href = imageData;
		link.download = `workspace-${Date.now()}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function toggleFullscreen() {
		fullscreen = !fullscreen;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && fullscreen) {
			fullscreen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="workspace-image" class:dark-mode={dark}>
	<!-- Image -->
	<button type="button" class="image-container" onclick={toggleFullscreen}>
		<img src={imageData} alt="AI-generated workspace" class="workspace-img" />
	</button>

	<!-- Reprompt input -->
	<div class="reprompt-row">
		<input
			type="text"
			class="reprompt-input"
			placeholder="Add to prompt: &quot;more plants, warmer lighting...&quot;"
			bind:value={repromptText}
			disabled={generationsRemaining <= 0}
		/>
	</div>

	<!-- Action buttons -->
	<div class="actions-row">
		<button
			type="button"
			class="action-btn"
			disabled={generationsRemaining <= 0}
			onclick={() => { onregenerate(repromptText || undefined); repromptText = ''; }}
		>
			<RefreshCw size={14} />
			{#if generationsRemaining > 0}
				Regenerate ({generationsRemaining} left)
			{:else}
				All generations used
			{/if}
		</button>
		<button type="button" class="action-btn" onclick={download}>
			<Download size={14} /> Download
		</button>
		<button type="button" class="action-btn" onclick={toggleFullscreen}>
			<Maximize2 size={14} /> Full Size
		</button>
	</div>

	<!-- Prompt dropdown -->
	<PromptDropdown {prompt} {dark} />
</div>

<!-- Fullscreen overlay -->
{#if fullscreen}
	<div
		class="fullscreen-overlay"
		role="dialog"
		aria-modal="true"
		onclick={toggleFullscreen}
		onkeydown={(e) => e.key === 'Escape' && toggleFullscreen()}
		tabindex="-1"
	>
		<img src={imageData} alt="AI-generated workspace (full size)" class="fullscreen-img" />
	</div>
{/if}

<style>
	.workspace-image {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	.image-container {
		cursor: zoom-in;
		border: none;
		background: none;
		padding: 0;
		border-radius: 1rem;
		overflow: hidden;
	}

	.workspace-img {
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 1rem;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
	}

	.reprompt-row {
		width: 100%;
	}

	.reprompt-input {
		width: 100%;
		padding: 0.625rem 0.875rem;
		border-radius: 0.75rem;
		border: 1px solid rgba(15, 25, 35, 0.12);
		background: rgba(15, 25, 35, 0.03);
		font-size: 0.8125rem;
		color: rgba(15, 25, 35, 0.8);
		font-family: var(--font-sans);
		transition: border-color 0.2s;
	}

	.reprompt-input:focus {
		outline: none;
		border-color: var(--color-teal);
	}

	.reprompt-input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dark-mode .reprompt-input {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.8);
	}

	.actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 0.625rem;
		border: 1px solid rgba(15, 25, 35, 0.1);
		background: rgba(15, 25, 35, 0.04);
		font-size: 0.75rem;
		font-weight: 600;
		color: rgba(15, 25, 35, 0.6);
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-btn:hover:not(:disabled) {
		background: rgba(15, 25, 35, 0.08);
		color: rgba(15, 25, 35, 0.8);
	}

	.action-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.dark-mode .action-btn {
		border-color: rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.6);
	}

	.dark-mode .action-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.8);
	}

	.fullscreen-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.9);
		backdrop-filter: blur(8px);
		cursor: zoom-out;
		padding: 2rem;
	}

	.fullscreen-img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		border-radius: 0.5rem;
	}
</style>
