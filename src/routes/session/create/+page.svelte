<script lang="ts">
	import { enhance } from '$app/forms';

	let title = $state('Designing Workplaces That Think');
	let isSubmitting = $state(false);
</script>

<div
	class="flex min-h-screen items-center justify-center px-6"
	style="background: linear-gradient(160deg, var(--dark) 0%, var(--dark2) 100%)"
>
	<div class="w-full max-w-lg">
		<!-- Header -->
		<div class="mb-8 text-center">
			<div class="mb-4 text-4xl">🧠</div>
			<h1 class="font-display mb-2 text-3xl font-bold text-white">Create Session</h1>
			<p class="text-sm text-white/50">
				Set up a new cognitive workplace design exercise for your group
			</p>
		</div>

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
			class="space-y-6"
		>
			<!-- Title -->
			<div>
				<label for="title" class="mb-2 block text-sm font-medium text-white/60">
					Session Title
				</label>
				<input
					id="title"
					name="title"
					type="text"
					bind:value={title}
					class="w-full rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-white placeholder-white/30 transition-colors outline-none focus:border-[var(--accent)]"
					placeholder="Designing Workplaces That Think"
				/>
			</div>

			<!-- Info about default features -->
			<div class="rounded-xl border border-white/8 bg-white/4 p-5">
				<div class="flex items-start gap-3">
					<span class="text-xl">📋</span>
					<div>
						<p class="text-sm font-medium text-white/80">28 default features included</p>
						<p class="mt-1 text-xs text-white/40">
							The standard AWA × CEBMa evidence-based feature set will be loaded. Feature editing
							will be available in a future update.
						</p>
					</div>
				</div>
			</div>

			<!-- Submit -->
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
				{isSubmitting ? 'Creating...' : 'Create Session →'}
			</button>
		</form>

		<!-- Back link -->
		<div class="mt-6 text-center">
			<a href="/" class="text-sm text-white/40 transition-colors hover:text-white/60">
				← Back to home
			</a>
		</div>
	</div>
</div>
