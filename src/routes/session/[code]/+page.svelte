<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let name = $state('');
	let isSubmitting = $state(false);
</script>

<div
	class="flex min-h-screen items-center justify-center px-6"
	style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
>
	<div class="w-full max-w-sm text-center">
		<div
			class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl"
			style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 8px 40px rgba(0,139,139,0.4)"
		>
			🧠
		</div>

		<h1 class="font-display mb-2 text-3xl font-bold text-white" style="line-height: 1.15">
			{data.session.title}
		</h1>
		<p class="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-white/45">
			Select the workplace features you believe have the greatest impact on cognitive performance.
		</p>

		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			<input
				name="name"
				type="text"
				bind:value={name}
				placeholder="Your name (optional)"
				class="mb-5 w-full rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-center text-base text-white placeholder-white/30 transition-colors outline-none focus:border-[var(--accent)]"
			/>
			<button
				type="submit"
				disabled={isSubmitting}
				class="w-full rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
				style="background: {isSubmitting
					? '#444'
					: 'linear-gradient(135deg, var(--teal), var(--accent))'}; box-shadow: {isSubmitting
					? 'none'
					: '0 4px 28px rgba(0,139,139,0.45)'}"
			>
				{isSubmitting ? 'Starting...' : 'Begin →'}
			</button>
		</form>
	</div>
</div>
