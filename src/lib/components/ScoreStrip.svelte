<script lang="ts">
	let {
		individualScore,
		communalScore,
		overallScore
	}: {
		individualScore: number;
		communalScore: number;
		overallScore: number;
	} = $props();

	const scoreColor = $derived(
		overallScore >= 70 ? 'var(--green)' : overallScore >= 40 ? 'var(--orange)' : 'var(--red)'
	);

	const messageBg = $derived(
		overallScore >= 70
			? 'background: rgba(0,200,83,0.08)'
			: overallScore >= 40
				? 'background: rgba(255,179,0,0.08)'
				: 'background: rgba(255,82,82,0.08)'
	);

	const message = $derived(
		overallScore >= 70
			? "Outstanding cognitive literacy. The group clearly connected the science to practical design decisions. AWA's body budget and 6 Factors frameworks have landed."
			: overallScore >= 40
				? "Good instincts \u2014 but some popular choices don't move the cognitive needle. This is exactly why evidence-based design matters, and why AWA's CEBMa research partnership exists."
				: "A common result. The group favoured traditional fit-out over evidence-based cognitive design. This gap between intuition and evidence is precisely what AWA's research programme with CEBMa was designed to close."
	);
</script>

<!-- Score cards -->
<div class="flex flex-col gap-5 px-4 pb-8 md:flex-row md:gap-7 md:px-8">
	<!-- Individual Brain accuracy -->
	<div class="group relative flex-1 overflow-hidden rounded-3xl border border-[#1a2b3c]/10 bg-white/40 p-8 text-center shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white/60">
		<div class="pointer-events-none absolute -inset-1 z-0 bg-radial-[at_50%_0%] from-(--green)/15 to-transparent opacity-50 transition-opacity group-hover:opacity-100"></div>
		<div class="relative z-10 font-display text-[80px] leading-none font-extrabold" style="font-variant-numeric: tabular-nums">
			<span style="color: var(--green); text-shadow: 0 4px 20px rgba(0, 200, 83, 0.4);">{individualScore}</span><span class="text-4xl text-[#1a2b3c]/20">%</span>
		</div>
		<div class="relative z-10 mt-3 text-base font-medium leading-relaxed text-[#1a2b3c]/60">
			Individual Brain accuracy<br />
			<small class="mt-1 block text-[#1a2b3c]/30 tracking-wide uppercase font-bold text-[10px]">Evidence-based individual picks</small>
		</div>
	</div>

	<!-- Collective Brain accuracy -->
	<div class="group relative flex-1 overflow-hidden rounded-3xl border border-[#1a2b3c]/10 bg-white/40 p-8 text-center shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white/60">
		<div class="pointer-events-none absolute -inset-1 z-0 bg-radial-[at_50%_0%] from-(--indigo)/20 to-transparent opacity-50 transition-opacity group-hover:opacity-100"></div>
		<div class="relative z-10 font-display text-[80px] leading-none font-extrabold" style="font-variant-numeric: tabular-nums">
			<span style="color: var(--indigo-text); text-shadow: 0 4px 20px rgba(140, 158, 255, 0.4);">{communalScore}</span><span class="text-4xl text-[#1a2b3c]/20">%</span>
		</div>
		<div class="relative z-10 mt-3 text-base font-medium leading-relaxed text-[#1a2b3c]/60">
			Collective Brain accuracy<br />
			<small class="mt-1 block text-[#1a2b3c]/30 tracking-wide uppercase font-bold text-[10px]">Evidence-based collective picks</small>
		</div>
	</div>

	<!-- Overall Cognitive Design Literacy -->
	<div class="group relative flex-1 overflow-hidden rounded-3xl border border-[#1a2b3c]/10 bg-white/40 p-8 text-center shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:bg-white/60">
		<div class="pointer-events-none absolute -inset-1 z-0 bg-radial-[at_50%_0%] from-white/20 to-transparent opacity-50 transition-opacity group-hover:opacity-100"></div>
		<div
			class="relative z-10 font-display text-[80px] leading-none font-extrabold drop-shadow-2xl"
			style="color: {scoreColor}; font-variant-numeric: tabular-nums; text-shadow: 0 4px 20px {scoreColor}40;"
		>
			{overallScore}%
		</div>
		<div class="relative z-10 mt-3 text-base font-medium leading-relaxed text-[#1a2b3c]/60">
			Overall Cognitive<br />Design Literacy
		</div>
	</div>
</div>

<!-- Score message -->
<div class="px-4 pb-7 md:px-8">
	<div
		class="relative overflow-hidden rounded-3xl border border-[#1a2b3c]/10 p-[24px_32px] text-lg leading-relaxed text-[#1a2b3c]/90 font-medium shadow-2xl backdrop-blur-xl"
		style={messageBg}
	>
		<div class="pointer-events-none absolute -inset-1 z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.4),transparent_50%)]"></div>
		<div class="relative z-10">{message}</div>
	</div>
</div>
