<script lang="ts">
	let { url, size = 200 }: { url: string; size?: number } = $props();

	const qrSrc = $derived(
		`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=ffffff&bgcolor=0f1923&format=svg`
	);
</script>

<img
	src={qrSrc}
	alt="QR code linking to {url}"
	width={size}
	height={size}
	class="rounded-xl"
	style="image-rendering: pixelated"
/>
