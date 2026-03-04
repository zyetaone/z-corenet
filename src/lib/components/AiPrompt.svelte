<script lang="ts">
	import { Palette, MessageSquareText } from '@lucide/svelte';
	let {
		features,
		hidden = true
	}: {
		features: Array<{
			name: string;
			category: string;
			hasEvidence: boolean;
			caption: string | null;
		}>;
		hidden?: boolean;
	} = $props();

	const promptFeatures = $derived(features.map((f) => f.name.toLowerCase()).join(', '));

	const promptAnnotations = $derived(
		features
			.map((f) => `${f.name.toLowerCase()} = ${f.hasEvidence ? 'GREEN' : 'RED'} circle`)
			.join('; ')
	);
</script>

{#if !hidden}
	<div class="px-4 pb-10 md:px-8">
		<div class="rounded-[20px] border border-white/6 bg-white/3 p-8">
			<!-- Header -->
			<h3 class="mb-1.5 flex items-center gap-2 font-display text-2xl font-bold text-white">
				<Palette class="h-6 w-6 text-accent" /> AI Workplace Visualisation
			</h3>
			<p class="mb-5 text-sm text-white/45">
				Generate an image of the group's ideal cognitive workplace — annotated with evidence status
			</p>

			<!-- Prompt box -->
			<div class="rounded-[14px] border border-white/5 bg-black/30 p-[22px]">
				<div class="text-sm leading-[1.7] text-white/70">
					Create a photorealistic architectural visualisation of a modern workplace interior
					designed for cognitive performance. The space must prominently feature: <span
						class="font-bold text-accent">{promptFeatures}</span
					>. Show humans actively using the space — people collaborating, working in focus zones,
					taking breaks in green spaces. Warm natural light, visible plants and natural materials.
					Wide-angle professional architectural photography.
					<br /><br />
					<strong class="text-white">ANNOTATION OVERLAY:</strong> Circle each feature with a
					coloured ring and thin leader line to a caption panel: {promptAnnotations}.
					<span class="font-bold text-green">GREEN circles</span> = strong scientific evidence for
					cognitive performance. Each GREEN feature gets a one-sentence caption explaining its
					cognitive impact.
					<span class="font-bold text-red">RED circles</span> = limited evidence. RED captions name the
					feature only. Use professional architectural diagram overlay style — clean, modern, semi-transparent
					caption backgrounds (green-tinted or red-tinted).
				</div>
			</div>

			<!-- Caption grid -->
			<div class="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-2">
				{#each features as feature (feature.name)}
					{@const isEvidence = feature.hasEvidence}
					{@const reason = isEvidence
						? (feature.caption ?? 'Supports cognitive performance')
						: 'No strong cognitive performance evidence'}
					<div
						class="flex items-start gap-2.5 rounded-[10px] px-3.5 py-2"
						style={isEvidence
							? 'background: rgba(0,200,83,0.06); border-left: 3px solid var(--color-green)'
							: 'background: rgba(255,82,82,0.06); border-left: 3px solid var(--color-red)'}
					>
						<span
							class="mt-0.5 shrink-0 font-mono text-xs font-bold"
							style="color: {isEvidence ? 'var(--color-green-text)' : 'var(--color-red-text)'}"
						>
							{isEvidence ? 'GREEN' : ' RED '}
						</span>
						<div>
							<span class="text-sm font-semibold text-white">{feature.name}</span><br />
							<span class="text-[13px] text-white/45">{reason}</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Footer note -->
			<p class="mt-4 text-xs text-white/25 italic">
				Paste prompt into Midjourney, DALL·E or similar. Use caption reference for manual annotation
				in PowerPoint/Canva if needed.
			</p>
		</div>
	</div>
{/if}
