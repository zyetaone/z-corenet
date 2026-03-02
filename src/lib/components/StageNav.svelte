<script lang="ts">
	let {
		currentStage,
		totalStages,
		onprev,
		onnext
	}: {
		currentStage: number;
		totalStages: number;
		onprev: () => void;
		onnext: () => void;
	} = $props();
</script>

<nav class="flex items-center justify-center gap-6 py-6" aria-label="Analytics stages">
	<button
		type="button"
		class="rounded-full border border-[#1a2b3c]/10 bg-[#1a2b3c]/5 p-3 text-[#1a2b3c]/50 transition-all hover:bg-[#1a2b3c]/10 hover:text-[#1a2b3c] disabled:opacity-20 disabled:cursor-default"
		disabled={currentStage === 0}
		onclick={onprev}
		aria-label="Previous stage"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
		</svg>
	</button>

	<!-- Progress dots -->
	<div class="flex items-center gap-2">
		{#each Array(totalStages) as _, i (i)}
			<div
				class={`h-2.5 rounded-full transition-all duration-300 ${i === currentStage ? 'w-8 bg-[var(--accent)]' : 'w-2.5 bg-[#1a2b3c]/15'}`}
			></div>
		{/each}
	</div>

	<button
		type="button"
		class="rounded-full border border-[#1a2b3c]/10 bg-[#1a2b3c]/5 p-3 text-[#1a2b3c]/50 transition-all hover:bg-[#1a2b3c]/10 hover:text-[#1a2b3c] disabled:opacity-20 disabled:cursor-default"
		disabled={currentStage === totalStages - 1}
		onclick={onnext}
		aria-label="Next stage"
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
		</svg>
	</button>
</nav>
