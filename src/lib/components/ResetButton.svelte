<script lang="ts">
	let { onreset }: { onreset: () => void } = $props();

	let showConfirm = $state(false);

	let cancelBtn: HTMLButtonElement | undefined = $state();
	let dialogEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (showConfirm && cancelBtn) {
			cancelBtn.focus();
		}
	});

	function getFocusable(container: HTMLElement): HTMLElement[] {
		return Array.from(
			container.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => !el.hasAttribute('disabled'));
	}

	function handleDialogKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			showConfirm = false;
			return;
		}

		if (e.key === 'Tab' && dialogEl) {
			const focusable = getFocusable(dialogEl);
			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}
	}
</script>

{#if showConfirm}
	<!-- Confirmation overlay -->
	<div
		bind:this={dialogEl}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
		role="alertdialog"
		tabindex="-1"
		aria-modal="true"
		aria-label="Confirm reset"
		onkeydown={handleDialogKeydown}
	>
		<div
			class="mx-4 w-full max-w-sm rounded-2xl border border-(--dark2)/30 bg-white p-8 text-center shadow-2xl"
		>
			<div class="mb-4 text-4xl">&#9888;&#65039;</div>
			<h3 class="font-display mb-2 text-xl font-bold text-[#1a2b3c]">Reset Exercise?</h3>
			<p class="mb-6 text-sm leading-relaxed text-[#1a2b3c]/60">
				Reset all votes and start fresh? This cannot be undone.
			</p>
			<div class="flex gap-3">
				<button
					bind:this={cancelBtn}
					type="button"
					class="flex-1 cursor-pointer rounded-xl border border-(--dark2)/50 bg-white px-4 py-2.5 text-sm font-semibold text-[#1a2b3c]/70 transition-colors hover:bg-(--dark2)/30"
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
	class="min-h-[44px] cursor-pointer rounded-xl border border-[#1a2b3c]/20 bg-white/60 px-4 py-2 text-xs font-semibold text-[#1a2b3c]/70 shadow-sm transition-colors hover:bg-white"
	onclick={() => (showConfirm = true)}
>
	New Exercise
</button>
