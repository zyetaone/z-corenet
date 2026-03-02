<script lang="ts">
	let { onreset }: { onreset: () => void } = $props();

	let showConfirm = $state(false);
</script>

{#if showConfirm}
	<!-- Confirmation overlay -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="Confirm reset"
		onkeydown={(e) => {
			if (e.key === 'Escape') showConfirm = false;
		}}
	>
		<div
			class="mx-4 w-full max-w-sm rounded-2xl border border-white/10 p-8 text-center"
			style="background: var(--dark2)"
		>
			<div class="mb-4 text-4xl">&#9888;&#65039;</div>
			<h3 class="font-display mb-2 text-xl font-bold text-white">Reset Exercise?</h3>
			<p class="mb-6 text-sm leading-relaxed text-white/45">
				Reset all votes and start fresh? This cannot be undone.
			</p>
			<div class="flex gap-3">
				<button
					type="button"
					class="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10"
					onclick={() => (showConfirm = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
					onclick={() => {
						showConfirm = false;
						onreset();
					}}
				>
					Reset
				</button>
			</div>
		</div>
	</div>
{/if}

<button
	type="button"
	class="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10"
	onclick={() => (showConfirm = true)}
>
	New Exercise
</button>
