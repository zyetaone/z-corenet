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
	<div class="w-full max-w-md text-center">
		<!-- Badge -->
		<div
			class="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-2 text-sm text-white/70"
		>
			Powered by <strong class="text-[var(--accent)]">&nbsp;AWA × CEBMa&nbsp;</strong> Research
		</div>

		<!-- Icon -->
		<div
			class="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full text-5xl"
			style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 8px 40px rgba(0,139,139,0.4)"
		>
			🧠
		</div>

		<!-- Title -->
		<h1 class="font-display mb-3 text-4xl font-bold text-white" style="line-height: 1.12">
			{data.session.title}
		</h1>
		<p class="mx-auto mb-10 max-w-sm text-sm leading-relaxed text-white/55">
			This exercise explores what matters most for cognitive performance at work. You'll select the
			workplace features you believe have the greatest impact.
		</p>

		<!-- Form -->
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
				class="mb-6 w-full max-w-xs rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-center text-base text-white placeholder-white/30 transition-colors outline-none focus:border-[var(--accent)]"
			/>
			<br />
			<button
				type="submit"
				disabled={isSubmitting}
				class="rounded-xl px-14 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
				style="background: {isSubmitting
					? '#444'
					: 'linear-gradient(135deg, var(--teal), var(--accent))'}; box-shadow: {isSubmitting
					? 'none'
					: '0 4px 28px rgba(0,139,139,0.45)'}"
			>
				{isSubmitting ? 'Starting...' : 'Begin Exercise →'}
			</button>
		</form>
	</div>
</div>
