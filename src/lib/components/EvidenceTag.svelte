<script lang="ts">
	let { hasEvidence }: { hasEvidence: boolean } = $props();
</script>

{#if hasEvidence}
	<span
		class="mt-1 inline-block rounded bg-green-500/12 px-2 py-0.5 text-xs font-bold tracking-wide text-[var(--green)]"
	>
		&#10003; EVIDENCE-BASED
	</span>
{:else}
	<span
		class="mt-1 inline-block rounded bg-red-500/12 px-2 py-0.5 text-xs font-bold tracking-wide text-[var(--red)]"
	>
		&#10007; LIMITED EVIDENCE
	</span>
{/if}
