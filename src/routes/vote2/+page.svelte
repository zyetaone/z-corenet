<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { SessionFeature } from '$lib/server/db/schema';
	import { CATEGORY_TO_GROUP } from '$lib/data/default-features';
	import CategoryIcon from '$lib/components/CategoryIcon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import EvidenceTag from '$lib/components/EvidenceTag.svelte';

	let { data }: { data: PageData } = $props();

	// Shuffle features once on mount for variety
	const shuffled: SessionFeature[] = untrack(() =>
		[...data.features].sort(() => Math.random() - 0.5)
	);

	let currentIndex = $state(0);
	let individualIds = $state<number[]>([]);
	let communalIds = $state<number[]>([]);
	let skippedIds = $state<number[]>([]);
	let isSubmitting = $state(false);
	let comment = $state('');

	// Drag state
	let dragX = $state(0);
	let dragY = $state(0);
	let isDragging = $state(false);
	let startX = 0;
	let startY = 0;
	let flyAway = $state<'left' | 'right' | null>(null);

	const SWIPE_THRESHOLD = 80;

	const currentCard = $derived(currentIndex < shuffled.length ? shuffled[currentIndex] : null);
	const nextCard = $derived(currentIndex + 1 < shuffled.length ? shuffled[currentIndex + 1] : null);
	const isDone = $derived(currentIndex >= shuffled.length);
	const progress = $derived(currentIndex / shuffled.length);

	// Derive direction from drag
	const dragDirection = $derived(
		dragX < -SWIPE_THRESHOLD ? 'left' : dragX > SWIPE_THRESHOLD ? 'right' : 'none'
	);
	const rotation = $derived(dragX * 0.06);
	const opacity = $derived(Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1));

	function onPointerDown(e: PointerEvent) {
		if (flyAway) return;
		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
		dragX = 0;
		dragY = 0;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDragging) return;
		dragX = e.clientX - startX;
		dragY = (e.clientY - startY) * 0.3;
	}

	function onPointerUp() {
		if (!isDragging) return;
		isDragging = false;

		if (dragDirection === 'left') {
			swipe('left');
		} else if (dragDirection === 'right') {
			swipe('right');
		} else {
			// Snap back
			dragX = 0;
			dragY = 0;
		}
	}

	function swipe(direction: 'left' | 'right') {
		if (!currentCard || flyAway) return;

		flyAway = direction;

		if (direction === 'left') {
			individualIds = [...individualIds, currentCard.featureId];
		} else {
			communalIds = [...communalIds, currentCard.featureId];
		}

		navigator.vibrate?.(10);

		// Wait for fly animation, then advance
		setTimeout(() => {
			currentIndex++;
			flyAway = null;
			dragX = 0;
			dragY = 0;
		}, 350);
	}

	function skip() {
		if (!currentCard || flyAway) return;
		skippedIds = [...skippedIds, currentCard.featureId];
		currentIndex++;
	}

	function undo() {
		if (currentIndex === 0) return;
		currentIndex--;
		const prevFeatureId = shuffled[currentIndex].featureId;

		// Remove from whichever bucket it was in
		individualIds = individualIds.filter((id) => id !== prevFeatureId);
		communalIds = communalIds.filter((id) => id !== prevFeatureId);
		skippedIds = skippedIds.filter((id) => id !== prevFeatureId);
	}

	// Keyboard controls
	function onKeydown(e: KeyboardEvent) {
		if (isDone) return;
		if (e.key === 'ArrowLeft') swipe('left');
		else if (e.key === 'ArrowRight') swipe('right');
		else if (e.key === 'ArrowDown' || e.key === ' ') {
			e.preventDefault();
			skip();
		} else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			undo();
		}
	}
</script>

<svelte:head>
	<title>Swipe to Sort — CoreNet</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<div class="relative flex min-h-screen flex-col overflow-hidden">
	<div class="animated-grid-bg"></div>

	<!-- Header -->
	<header class="vote2-header relative z-10 w-full overflow-hidden">
		<!-- Add backdrop explicitly inside header to guarantee it shows above grid -->
		<div
			class="pointer-events-none absolute inset-0 border-b border-[#1a2b3c]/5 bg-white/70 backdrop-blur-xl"
		></div>
		<div class="relative z-10 flex w-full items-center justify-between">
			<div class="flex items-center gap-3">
				<span class="text-xl">&#x1F0CF;</span>
				<div>
					<div class="font-display text-sm font-bold text-[#1a2b3c]">Swipe to Sort</div>
					<div class="text-[10px] font-medium tracking-wider text-[#1a2b3c]/40 uppercase">
						{data.session.title}
					</div>
				</div>
			</div>
			<div class="flex items-center gap-3">
				<div class="flex gap-1.5 text-[10px] font-bold tracking-wider uppercase">
					<span class="rounded-full bg-(--green)/10 px-2 py-0.5 text-(--green)">
						&#x1F9E0; {individualIds.length}
					</span>
					<span class="rounded-full bg-(--indigo-text)/10 px-2 py-0.5 text-(--indigo-text)">
						&#x1F91D; {communalIds.length}
					</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Progress bar -->
	<div class="h-1 w-full bg-[#1a2b3c]/5">
		<div
			class="h-full bg-linear-to-r from-(--green) to-(--indigo-text) transition-all duration-300"
			style="width: {progress * 100}%"
		></div>
	</div>

	<!-- Main content -->
	<main class="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8">
		{#if !isDone}
			<!-- Direction labels -->
			<div class="mb-6 flex w-full max-w-sm items-center justify-between px-2">
				<div class="flex items-center gap-1.5 text-xs font-bold text-(--green)">
					<span>&larr;</span>
					<span>&#x1F9E0; Individual</span>
				</div>
				<div class="text-[10px] font-medium text-[#1a2b3c]/30">
					{currentIndex + 1} / {shuffled.length}
				</div>
				<div class="flex items-center gap-1.5 text-xs font-bold text-(--indigo-text)">
					<span>&#x1F91D; Collective</span>
					<span>&rarr;</span>
				</div>
			</div>

			<!-- Card stack area -->
			<div class="card-stack">
				<!-- Next card (static preview) -->
				{#if nextCard}
					<div class="swipe-card next-card">
						<div class="card-icon-area">
							<CategoryIcon
								group={CATEGORY_TO_GROUP[nextCard.category] ?? nextCard.category}
								size={36}
								animated={false}
							/>
						</div>
					</div>
				{/if}

				<!-- Current card (draggable) -->
				{#if currentCard}
					{@const group = CATEGORY_TO_GROUP[currentCard.category] ?? currentCard.category}
					<div
						class="swipe-card current-card"
						class:dragging={isDragging}
						class:fly-left={flyAway === 'left'}
						class:fly-right={flyAway === 'right'}
						style="transform: translate({flyAway ? 0 : dragX}px, {flyAway
							? 0
							: dragY}px) rotate({flyAway ? 0 : rotation}deg)"
						role="button"
						tabindex="0"
						onpointerdown={onPointerDown}
						onpointermove={onPointerMove}
						onpointerup={onPointerUp}
						onpointercancel={onPointerUp}
					>
						<!-- Swipe direction overlays -->
						<div
							class="swipe-overlay left-overlay"
							style="opacity: {dragDirection === 'left' ? opacity : 0}"
						>
							<span class="text-3xl">&#x1F9E0;</span>
							<span class="text-sm font-bold">Individual</span>
						</div>
						<div
							class="swipe-overlay right-overlay"
							style="opacity: {dragDirection === 'right' ? opacity : 0}"
						>
							<span class="text-3xl">&#x1F91D;</span>
							<span class="text-sm font-bold">Collective</span>
						</div>

						<!-- Card content -->
						<div class="card-icon-area">
							<CategoryIcon {group} size={48} animated={true} />
						</div>
						<div class="card-group-label">{group}</div>
						<h2 class="card-title">{currentCard.name}</h2>
						<p class="card-description">{currentCard.description}</p>
						<EvidenceTag hasEvidence={currentCard.hasEvidence} />
					</div>
				{/if}
			</div>

			<!-- Action buttons -->
			<div class="mt-8 flex items-center gap-5">
				<button
					type="button"
					class="action-btn undo-btn"
					onclick={undo}
					disabled={currentIndex === 0}
					aria-label="Undo"
					title="Undo (Ctrl+Z)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<button
					type="button"
					class="action-btn swipe-left-btn"
					onclick={() => swipe('left')}
					aria-label="Individual brain"
					title="Individual (←)"
				>
					<span class="text-xl">&#x1F9E0;</span>
				</button>

				<button
					type="button"
					class="action-btn skip-btn"
					onclick={skip}
					aria-label="Skip"
					title="Skip (↓)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<button
					type="button"
					class="action-btn swipe-right-btn"
					onclick={() => swipe('right')}
					aria-label="Collective brain"
					title="Collective (→)"
				>
					<span class="text-xl">&#x1F91D;</span>
				</button>
			</div>

			<!-- Keyboard hint -->
			<p class="mt-4 text-xs font-medium tracking-wider text-[#1a2b3c]/40">
				Swipe or use arrow keys &middot; Ctrl+Z to undo
			</p>
		{:else}
			<!-- Results summary + submit -->
			<div class="w-full max-w-md">
				<div class="mb-6 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-(--green) to-(--indigo-text) shadow-lg"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-8 w-8 text-white"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<h2 class="font-display text-2xl font-bold text-[#1a2b3c]">All sorted!</h2>
					<p class="mt-1 text-sm text-[#1a2b3c]/50">Review your picks before submitting</p>
				</div>

				<!-- Summary pills -->
				<div class="mb-6 grid grid-cols-2 gap-3">
					<div class="rounded-2xl border border-(--green)/20 bg-(--green)/5 p-4 backdrop-blur-sm">
						<div class="mb-2 flex items-center gap-2">
							<span>&#x1F9E0;</span>
							<span class="text-xs font-bold text-(--green)">Individual Brain</span>
						</div>
						<div
							class="text-3xl font-extrabold text-(--green)"
							style="font-variant-numeric: tabular-nums"
						>
							{individualIds.length}
						</div>
						<div class="mt-1 text-[10px] font-medium text-[#1a2b3c]/40">features</div>
					</div>
					<div
						class="rounded-2xl border border-(--indigo-text)/20 bg-(--indigo-text)/5 p-4 backdrop-blur-sm"
					>
						<div class="mb-2 flex items-center gap-2">
							<span>&#x1F91D;</span>
							<span class="text-xs font-bold text-(--indigo-text)">Collective Brain</span>
						</div>
						<div
							class="text-3xl font-extrabold text-(--indigo-text)"
							style="font-variant-numeric: tabular-nums"
						>
							{communalIds.length}
						</div>
						<div class="mt-1 text-[10px] font-medium text-[#1a2b3c]/40">features</div>
					</div>
				</div>

				{#if skippedIds.length > 0}
					<p class="mb-4 text-center text-xs text-[#1a2b3c]/40">
						{skippedIds.length} skipped
					</p>
				{/if}

				{#if individualIds.length === 0 || communalIds.length === 0}
					<div
						class="mb-4 rounded-xl border border-(--orange)/30 bg-(--orange)/5 p-3 text-center text-xs font-medium text-(--orange)"
					>
						You need at least one pick in each bucket to submit.
						<button
							type="button"
							class="mt-1 block min-h-[44px] w-full py-3 font-bold underline"
							onclick={() => {
								currentIndex = 0;
								individualIds = [];
								communalIds = [];
								skippedIds = [];
							}}
						>
							Start over
						</button>
					</div>
				{/if}

				<form
					method="POST"
					class="flex flex-col gap-4"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					{#each individualIds as id}
						<input type="hidden" name="individualIds" value={id} />
					{/each}
					{#each communalIds as id}
						<input type="hidden" name="communalIds" value={id} />
					{/each}

					<textarea
						name="comment"
						bind:value={comment}
						placeholder="Any thoughts on workplace design? (optional)"
						aria-label="Comments on workplace design"
						rows="2"
						class="w-full rounded-xl border border-[#1a2b3c]/10 bg-white/60 px-4 py-3 text-sm text-[#1a2b3c] placeholder-[#1a2b3c]/30 transition-all outline-none focus:border-(--teal) focus:bg-white focus:shadow-sm"
					></textarea>

					<Button
						type="submit"
						disabled={individualIds.length === 0 || communalIds.length === 0 || isSubmitting}
					>
						{isSubmitting ? 'Submitting...' : 'Submit & See Results →'}
					</Button>

					<button
						type="button"
						class="min-h-[44px] py-3 text-xs font-medium text-[#1a2b3c]/40 transition-colors hover:text-[#1a2b3c]/70"
						onclick={() => {
							currentIndex = 0;
							individualIds = [];
							communalIds = [];
							skippedIds = [];
						}}
					>
						Start over
					</button>
				</form>
			</div>
		{/if}
	</main>
</div>

<style>
	.vote2-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		background: transparent;
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.card-stack {
		position: relative;
		width: 300px;
		height: 400px;
	}

	@media (min-width: 640px) {
		.card-stack {
			width: 340px;
			height: 440px;
		}
	}

	.swipe-card {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.75rem;
		border-radius: 1.5rem;
		background: white;
		border: 1px solid rgba(26, 43, 60, 0.08);
		box-shadow:
			0 8px 40px rgba(26, 43, 60, 0.08),
			0 2px 8px rgba(26, 43, 60, 0.04);
		text-align: center;
		user-select: none;
		touch-action: none;
	}

	.next-card {
		transform: scale(0.95) translateY(8px);
		opacity: 0.5;
		z-index: 1;
	}

	.current-card {
		z-index: 10;
		cursor: grab;
		transition: box-shadow 0.2s;
	}

	.current-card.dragging {
		cursor: grabbing;
		box-shadow:
			0 16px 60px rgba(26, 43, 60, 0.15),
			0 4px 16px rgba(26, 43, 60, 0.08);
		transition: none;
	}

	.current-card:not(.dragging):not(.fly-left):not(.fly-right) {
		transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.current-card.fly-left {
		animation: fly-off-left 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
	}

	.current-card.fly-right {
		animation: fly-off-right 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
	}

	@keyframes fly-off-left {
		to {
			transform: translateX(-150vw) rotate(-30deg);
			opacity: 0;
		}
	}

	@keyframes fly-off-right {
		to {
			transform: translateX(150vw) rotate(30deg);
			opacity: 0;
		}
	}

	.swipe-overlay {
		position: absolute;
		top: 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 1rem;
		border-radius: 1rem;
		font-weight: 700;
		pointer-events: none;
		transition: opacity 0.1s;
	}

	.left-overlay {
		left: 1rem;
		background: rgba(0, 200, 83, 0.1);
		border: 2px solid var(--green);
		color: var(--green);
	}

	.right-overlay {
		right: 1rem;
		background: rgba(92, 107, 192, 0.1);
		border: 2px solid var(--indigo-text);
		color: var(--indigo-text);
	}

	.card-icon-area {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 5rem;
		height: 5rem;
		border-radius: 1.25rem;
		background: rgba(15, 25, 35, 0.04);
		border: 1px solid rgba(15, 25, 35, 0.06);
		margin-bottom: 1.25rem;
		color: var(--teal);
	}

	.card-group-label {
		font-size: 0.625rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.15em;
		color: rgba(26, 43, 60, 0.35);
		margin-bottom: 0.5rem;
	}

	.card-title {
		font-family: 'DM Sans', sans-serif;
		font-size: 1.25rem;
		font-weight: 800;
		line-height: 1.25;
		color: #1a2b3c;
		margin-bottom: 0.75rem;
	}

	.card-description {
		font-size: 0.8125rem;
		line-height: 1.6;
		color: rgba(26, 43, 60, 0.6);
		max-width: 260px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1px solid rgba(26, 43, 60, 0.1);
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(26, 43, 60, 0.06);
	}

	.action-btn:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow: 0 4px 16px rgba(26, 43, 60, 0.12);
	}

	.action-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.action-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.undo-btn {
		width: 3rem;
		height: 3rem;
		color: rgba(26, 43, 60, 0.4);
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(8px);
	}

	.swipe-left-btn {
		width: 4rem;
		height: 4rem;
		border-color: rgba(0, 200, 83, 0.2);
		background: rgba(0, 200, 83, 0.08);
		backdrop-filter: blur(12px);
	}

	.swipe-left-btn:hover:not(:disabled) {
		background: rgba(0, 200, 83, 0.15);
		border-color: rgba(0, 200, 83, 0.4);
	}

	.skip-btn {
		width: 3rem;
		height: 3rem;
		color: rgba(26, 43, 60, 0.4);
		background: rgba(255, 255, 255, 0.6);
		backdrop-filter: blur(8px);
	}

	.swipe-right-btn {
		width: 4rem;
		height: 4rem;
		border-color: rgba(92, 107, 192, 0.2);
		background: rgba(92, 107, 192, 0.08);
		backdrop-filter: blur(12px);
	}

	.swipe-right-btn:hover:not(:disabled) {
		background: rgba(92, 107, 192, 0.15);
		border-color: rgba(92, 107, 192, 0.4);
	}

	@media (prefers-reduced-motion: reduce) {
		.current-card.fly-left,
		.current-card.fly-right {
			animation-duration: 0.01ms;
		}
		.current-card:not(.dragging):not(.fly-left):not(.fly-right) {
			transition-duration: 0.01ms;
		}
	}
</style>
