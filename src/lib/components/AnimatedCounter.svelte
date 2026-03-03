<script lang="ts">
	let {
		value,
		label,
		suffix = '',
		duration = 800,
		color = ''
	}: {
		value: number;
		label: string;
		suffix?: string;
		duration?: number;
		color?: string;
	} = $props();

	let displayValue = $state(0);
	let currentValue = 0;

	$effect(() => {
		const start = currentValue;
		const end = value;
		const startTime = performance.now();
		let frameId: number;

		function animate(now: number) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			const next = Math.round(start + (end - start) * eased);
			displayValue = next;
			currentValue = next;

			if (progress < 1) {
				frameId = requestAnimationFrame(animate);
			}
		}

		frameId = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frameId);
	});
</script>

<div class="flex flex-col items-center">
	<span
		class="text-4xl font-extrabold lg:text-5xl"
		style="font-variant-numeric: tabular-nums; color: {color || '#1a2b3c'}"
	>
		{displayValue}{suffix}
	</span>
	<span class="mt-1 text-xs font-semibold tracking-widest text-[#1a2b3c]/40 uppercase">
		{label}
	</span>
</div>
