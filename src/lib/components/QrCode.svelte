<script lang="ts">
	import QRCode from 'qrcode';

	let { url, size = 200 }: { url: string; size?: number } = $props();

	const qrSvg = $derived(
		QRCode.toString(url, {
			type: 'svg',
			width: size,
			margin: 1,
			color: { dark: '#1a2b3c', light: '#ffffff' }
		})
	);
</script>

{#await qrSvg}
	<div
		class="rounded-xl bg-navy/10 motion-safe:animate-pulse"
		style="width: {size}px; height: {size}px"
	></div>
{:then svgString}
	<div class="qr-container" style="width: {size}px; height: {size}px">
		{@html svgString}
	</div>
{:catch}
	<div
		class="flex items-center justify-center rounded-xl bg-white p-4"
		style="width: {size}px; height: {size}px"
	>
		<code class="text-center font-mono text-xs break-all text-navy">{url}</code>
	</div>
{/await}

<style>
	.qr-container :global(svg) {
		width: 100%;
		height: 100%;
		border-radius: 0.75rem;
	}
</style>
