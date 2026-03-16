<script lang="ts">
	let { onreset }: { onreset: (pin: string) => Promise<string | null> } = $props();

	let showConfirm = $state(false);
	let step = $state<'confirm' | 'pin'>('confirm');
	let pin = $state('');
	let pinError = $state('');
	let submitting = $state(false);

	let cancelBtn: HTMLButtonElement | undefined = $state();
	let pinInput: HTMLInputElement | undefined = $state();
	let dialogEl: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (showConfirm && step === 'confirm' && cancelBtn) {
			cancelBtn.focus();
		}
		if (showConfirm && step === 'pin' && pinInput) {
			pinInput.focus();
		}
	});

	function close() {
		showConfirm = false;
		step = 'confirm';
		pin = '';
		pinError = '';
	}

	async function submitPin() {
		if (pin.length < 4) {
			pinError = 'Enter the 4-digit PIN';
			return;
		}
		pinError = '';
		submitting = true;
		const err = await onreset(pin);
		submitting = false;
		if (err) {
			pinError = err;
		} else {
			close();
		}
	}

	function getFocusable(container: HTMLElement): HTMLElement[] {
		return Array.from(
			container.querySelectorAll<HTMLElement>(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => !el.hasAttribute('disabled'));
	}

	function handleDialogKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
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
			{#if step === 'confirm'}
				<div class="mb-4 text-4xl">&#9888;&#65039;</div>
				<h3 class="mb-2 font-display text-xl font-bold text-navy">Reset Exercise?</h3>
				<p class="mb-6 text-sm leading-relaxed text-navy/60">
					Reset all votes and start fresh? This cannot be undone.
				</p>
				<div class="flex gap-3">
					<button
						bind:this={cancelBtn}
						type="button"
						class="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-(--dark2)/50 bg-white px-4 py-3 text-sm font-semibold text-navy/70 transition-colors hover:bg-(--dark2)/30"
						onclick={close}
					>
						Cancel
					</button>
					<button
						type="button"
						class="min-h-[44px] flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
						onclick={() => (step = 'pin')}
					>
						Reset
					</button>
				</div>
			{:else}
				<div class="mb-4 text-4xl">&#128274;</div>
				<h3 class="mb-2 font-display text-xl font-bold text-navy">Enter Admin PIN</h3>
				<p class="mb-5 text-sm leading-relaxed text-navy/60">
					Enter the facilitator PIN to confirm the reset.
				</p>
				<input
					bind:this={pinInput}
					type="password"
					inputmode="numeric"
					maxlength="4"
					placeholder="----"
					bind:value={pin}
					onkeydown={(e) => {
						if (e.key === 'Enter') submitPin();
					}}
					class="mx-auto mb-2 block w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-navy transition-all focus:border-teal focus:ring-4 focus:ring-teal/10 focus:outline-none"
				/>
				{#if pinError}
					<p class="mb-3 text-xs font-semibold text-red-500">{pinError}</p>
				{/if}
				<div class="mt-5 flex gap-3">
					<button
						type="button"
						class="min-h-[44px] flex-1 cursor-pointer rounded-xl border border-(--dark2)/50 bg-white px-4 py-3 text-sm font-semibold text-navy/70 transition-colors hover:bg-(--dark2)/30"
						onclick={close}
					>
						Cancel
					</button>
					<button
						type="button"
						class="min-h-[44px] flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
						onclick={submitPin}
						disabled={submitting}
					>
						{submitting ? 'Resetting...' : 'Confirm'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

<button
	type="button"
	class="cursor-pointer bg-transparent px-2 py-1 text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase transition-colors hover:text-white/60"
	onclick={() => (showConfirm = true)}
>
	New Exercise
</button>
