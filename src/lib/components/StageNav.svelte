<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	let {
		currentPage,
		totalPages,
		onprev,
		onnext
	}: {
		currentPage: number;
		totalPages: number;
		onprev: () => void;
		onnext: () => void;
	} = $props();
</script>

<nav class="flex items-center justify-center gap-6 py-6" aria-label="Analytics pages">
	<button
		type="button"
		class="rounded-full border border-white/10 bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95 active:bg-white/15 disabled:cursor-default disabled:opacity-20"
		disabled={currentPage === 0}
		onclick={onprev}
		aria-label="Previous page"
	>
		<ChevronLeft class="h-5 w-5" strokeWidth={2.5} />
	</button>

	<!-- Progress dots -->
	<div
		class="flex items-center gap-2"
		role="group"
		aria-label={`Page ${currentPage + 1} of ${totalPages}`}
	>
		{#each Array(totalPages) as _, i (i)}
			<div
				class={`h-2.5 rounded-full transition-all duration-300 ${i === currentPage ? 'w-8 bg-teal' : 'w-2.5 bg-white/15'}`}
				aria-label={`Page ${i + 1}${i === currentPage ? ' (current)' : ''}`}
			></div>
		{/each}
	</div>

	<button
		type="button"
		class="rounded-full border border-white/10 bg-white/5 p-3 text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95 active:bg-white/15 disabled:cursor-default disabled:opacity-20"
		disabled={currentPage === totalPages - 1}
		onclick={onnext}
		aria-label="Next page"
	>
		<ChevronRight class="h-5 w-5" strokeWidth={2.5} />
	</button>
</nav>
