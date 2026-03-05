<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import AppBackground from '$lib/components/AppBackground.svelte';
	import BrandFooter from '$lib/components/BrandFooter.svelte';

	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Join — CoreNet</title>
</svelte:head>

<AppBackground theme="teal">
	<div class="flex h-full min-h-dvh flex-col items-center justify-center px-6 text-center">
		<div
			class="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl"
			style="background: rgba(255,255,255,0.15); backdrop-filter: blur(8px); box-shadow: 0 10px 40px rgba(0,0,0,0.15)"
		>
			🧠
		</div>

		<h1
			class="mb-3 font-display text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl"
			style="line-height: 1.15; text-shadow: 0 2px 20px rgba(0,0,0,0.1)"
		>
			Designing Workplaces<br />That Think
		</h1>

		<p class="mb-6 text-base text-white/80 md:whitespace-nowrap">
			Vote on workplace features that matter to you and your brain.
		</p>

		<hr class="mx-auto mb-8 w-16 border-t border-white/20" />

		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
			class="mx-auto w-full max-w-sm"
		>
			<Button
				type="submit"
				loading={isSubmitting}
				fullWidth={true}
				style="color: var(--color-teal); background: #fff; border-color: rgba(255,255,255,0.3); border-radius: 1rem; box-shadow: 0 10px 40px rgba(0,0,0,0.15)"
			>
				Begin →
			</Button>
		</form>

		<BrandFooter class="mt-6" />
	</div>
</AppBackground>
