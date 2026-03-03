<script lang="ts">
	import type { GroupKey } from '$lib/data/default-features';
	import LightIcon from './icons/LightIcon.svelte';
	import AirIcon from './icons/AirIcon.svelte';
	import AcousticIcon from './icons/AcousticIcon.svelte';
	import BiophilicIcon from './icons/BiophilicIcon.svelte';
	import WellnessIcon from './icons/WellnessIcon.svelte';
	import TechIcon from './icons/TechIcon.svelte';
	import SocialIcon from './icons/SocialIcon.svelte';
	import FurnitureIcon from './icons/FurnitureIcon.svelte';

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
	<LightIcon {size} {animated} />
{:else if group === 'air'}
	<AirIcon {size} {animated} />
{:else if group === 'acoustic'}
	<AcousticIcon {size} {animated} />
{:else if group === 'biophilic'}
	<BiophilicIcon {size} {animated} />
{:else if group === 'wellness'}
	<WellnessIcon {size} {animated} />
{:else if group === 'tech'}
	<TechIcon {size} {animated} />
{:else if group === 'social'}
	<SocialIcon {size} {animated} />
{:else if group === 'furniture'}
	<FurnitureIcon {size} {animated} />
{:else}
	<svg width={size} height={size} viewBox="0 0 24 24"
		><circle cx="12" cy="12" r="4" fill="currentColor" /></svg
	>
{/if}
