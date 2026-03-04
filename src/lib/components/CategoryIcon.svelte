<script lang="ts">
	import type { GroupKey } from '$lib/data/default-features';
	import {
		Sun,
		Wind,
		AudioWaveform,
		Leaf,
		HeartPulse,
		Monitor,
		Users,
		Armchair,
		CircleDashed
	} from '@lucide/svelte';

	let {
		group,
		size = 24,
		animated = true
	}: {
		group: GroupKey | string;
		size?: number;
		animated?: boolean;
	} = $props();
</script>

{#if group === 'light'}
	<Sun {size} class={animated ? 'motion-safe:animate-[spin_8s_linear_infinite]' : ''} />
{:else if group === 'air'}
	<Wind {size} class={animated ? 'motion-safe:animate-wind-blow' : ''} />
{:else if group === 'acoustic'}
	<AudioWaveform {size} class={animated ? 'motion-safe:animate-bounce' : ''} />
{:else if group === 'biophilic'}
	<Leaf {size} class={animated ? 'motion-safe:animate-pulse' : ''} />
{:else if group === 'wellness'}
	<HeartPulse {size} class={animated ? 'motion-safe:animate-pulse' : ''} />
{:else if group === 'tech'}
	<Monitor {size} class={animated ? 'motion-safe:animate-pulse' : ''} />
{:else if group === 'social'}
	<Users {size} class={animated ? 'motion-safe:animate-bounce' : ''} />
{:else if group === 'furniture'}
	<Armchair {size} class={animated ? 'motion-safe:animate-pulse' : ''} />
{:else}
	<CircleDashed {size} />
{/if}
