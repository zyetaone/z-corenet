<script lang="ts">
	import { X, Download, Maximize2 } from '@lucide/svelte';
	import PromptDropdown from './PromptDropdown.svelte';

	let {
		image,
		onclose
	}: {
		image: {
			participantName: string;
			imageData: string;
			featureNames: string[];
			prompt?: string;
		};
		onclose: () => void;
	} = $props();

	let fullscreen = $state(false);

	function download() {
		const link = document.createElement('a');
		link.href = image.imageData;
		link.download = `workspace-${image.participantName}-${Date.now()}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (fullscreen) {
				fullscreen = false;
			} else {
				onclose();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<div
	class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
	role="presentation"
	onclick={onclose}
></div>

<!-- Modal -->
<div
	class="fixed inset-4 z-50 mx-auto my-auto flex max-h-[90vh] max-w-2xl flex-col overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
	role="dialog"
	aria-modal="true"
>
	<!-- Close button -->
	<button
		type="button"
		class="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
		onclick={onclose}
	>
		<X size={18} />
	</button>

	<!-- Image -->
	<div class="p-4 pb-0">
		<img
			src={image.imageData}
			alt="{image.participantName}'s workspace"
			class="w-full rounded-2xl object-cover"
			style="aspect-ratio: 16/9"
		/>
	</div>

	<!-- Content -->
	<div class="flex flex-col gap-3 p-5">
		<h3 class="font-display text-lg font-bold text-white">
			{image.participantName}'s Workspace
		</h3>

		{#if image.featureNames.length > 0}
			<div>
				<p class="mb-1 text-xs font-semibold tracking-wider text-white/40 uppercase">Feature choices</p>
				<p class="text-sm leading-relaxed text-white/70">
					{image.featureNames.join(', ')}
				</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex gap-2">
			<button type="button"
				class="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
				onclick={download}
			>
				<Download size={13} /> Download
			</button>
			<button type="button"
				class="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
				onclick={() => (fullscreen = true)}
			>
				<Maximize2 size={13} /> Full Size
			</button>
		</div>

		{#if image.prompt}
			<PromptDropdown prompt={image.prompt} dark={true} />
		{/if}
	</div>
</div>

<!-- Fullscreen -->
{#if fullscreen}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
		role="dialog"
		aria-modal="true"
		onclick={() => (fullscreen = false)}
		onkeydown={(e) => e.key === 'Escape' && (fullscreen = false)}
		tabindex="-1"
	>
		<img
			src={image.imageData}
			alt="{image.participantName}'s workspace (full size)"
			class="max-h-full max-w-full object-contain"
		/>
	</div>
{/if}
