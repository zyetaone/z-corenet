<script lang="ts">
	import QRCode from 'qrcode';

	let { url, size = 200 }: { url: string; size?: number } = $props();

	let svgString = $state('');
	let error = $state(false);

	$effect(() => {
		QRCode.toString(url, {
			type: 'svg',
			width: size,
			margin: 1,
			color: { dark: '#1a2b3c', light: '#ffffff' }
		})
			.then((svg) => {
				svgString = svg;
				error = false;
			})
			.catch(() => {
				error = true;
			});
	});
</script>

{#if svgString}
	<div class="qr-container" style="width: {size}px; height: {size}px">
		{@html svgString}
	</div>
{:else if error}
	<div
		class="flex items-center justify-center rounded-xl bg-white p-4"
		style="width: {size}px; height: {size}px"
	>
		<code class="text-center font-mono text-xs break-all text-[#1a2b3c]">{url}</code>
	</div>
{:else}
	<div
		class="animate-pulse rounded-xl bg-[#1a2b3c]/10"
		style="width: {size}px; height: {size}px"
	></div>
{/if}

<style>
	.qr-container :global(svg) {
		width: 100%;
		height: 100%;
		border-radius: 0.75rem;
	}
</style>
