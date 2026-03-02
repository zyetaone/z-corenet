<script lang="ts">
	let {
		individualScore,
		communalScore,
		totalCorrect
	}: {
		individualScore: number;
		communalScore: number;
		totalCorrect: number;
	} = $props();

	const overallPct = $derived(Math.round((totalCorrect / 10) * 100));

	const scoreColor = $derived(
		totalCorrect >= 8 ? 'var(--green)' : totalCorrect >= 5 ? 'var(--orange)' : 'var(--red)'
	);

	const messageBg = $derived(
		totalCorrect >= 8
			? 'background: rgba(0,200,83,0.08)'
			: totalCorrect >= 5
				? 'background: rgba(255,179,0,0.08)'
				: 'background: rgba(255,82,82,0.08)'
	);

	const message = $derived(
		totalCorrect >= 8
			? "Outstanding cognitive literacy. The group clearly connected the science to practical design decisions. AWA's body budget and 6 Factors frameworks have landed."
			: totalCorrect >= 5
				? "Good instincts \u2014 but some popular choices don't move the cognitive needle. This is exactly why evidence-based design matters, and why AWA's CEBMa research partnership exists."
				: "A common result. The group favoured traditional fit-out over evidence-based cognitive design. This gap between intuition and evidence is precisely what AWA's research programme with CEBMa was designed to close."
	);
</script>

<!-- Score cards -->
<div class="flex flex-col gap-5 px-4 pb-8 md:flex-row md:gap-7 md:px-8">
	<!-- Individual Brain accuracy -->
	<div class="flex-1 rounded-[20px] border border-white/6 bg-white/3 px-6 py-6 text-center">
		<div class="font-display text-[72px] leading-none font-extrabold" style="font-variant-numeric: tabular-nums">
			<span style="color: var(--green)">{individualScore}</span><span class="text-4xl text-white/25"
				>/5</span
			>
		</div>
		<div class="mt-2 text-base leading-relaxed text-white/45">
			Individual Brain accuracy<br />
			<small class="text-white/25">Evidence-based picks in Phase A</small>
		</div>
	</div>

	<!-- Connected Brain accuracy -->
	<div class="flex-1 rounded-[20px] border border-white/6 bg-white/3 px-6 py-6 text-center">
		<div class="font-display text-[72px] leading-none font-extrabold" style="font-variant-numeric: tabular-nums">
			<span style="color: var(--indigo-text)">{communalScore}</span><span class="text-4xl text-white/25"
				>/5</span
			>
		</div>
		<div class="mt-2 text-base leading-relaxed text-white/45">
			Connected Brain accuracy<br />
			<small class="text-white/25">Evidence-based picks in Phase B</small>
		</div>
	</div>

	<!-- Overall Cognitive Design Literacy -->
	<div class="flex-1 rounded-[20px] border border-white/6 bg-white/3 px-6 py-6 text-center">
		<div
			class="font-display text-[72px] leading-none font-extrabold"
			style="color: {scoreColor}; font-variant-numeric: tabular-nums"
		>
			{overallPct}%
		</div>
		<div class="mt-2 text-base leading-relaxed text-white/45">
			Overall Cognitive<br />Design Literacy
		</div>
	</div>
</div>

<!-- Score message -->
<div class="px-4 pb-7 md:px-8">
	<div
		class="rounded-[14px] p-[18px_28px] text-lg leading-relaxed text-white/90 font-medium"
		style={messageBg}
	>
		{message}
	</div>
</div>
