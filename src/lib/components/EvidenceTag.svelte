<script lang="ts">
	let { hasEvidence }: { hasEvidence: boolean } = $props();
</script>

{#if hasEvidence}
	<span
		class="mt-1 inline-block min-w-[140px] rounded bg-green-500/12 px-2 py-0.5 text-center text-xs font-bold tracking-wide text-(--green-text)"
	>
		&#10003; EVIDENCE-BASED
	</span>
{:else}
	<span
		class="mt-1 inline-block min-w-[140px] rounded bg-red-500/12 px-2 py-0.5 text-center text-xs font-bold tracking-wide text-(--red-text)"
	>
		&#10007; LIMITED EVIDENCE
	</span>
{/if}
