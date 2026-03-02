<script lang="ts">
	import { goto } from '$app/navigation';

	let joinCode = $state('');
	let joinError = $state('');

	function handleJoin() {
		const code = joinCode.trim().toUpperCase();
		if (code.length < 4) {
			joinError = 'Enter a valid session code';
			return;
		}
		joinError = '';
		goto(`/session/${code}`);
	}
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
			class="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-lg"
			style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 8px 40px rgba(0,139,139,0.4)"
		>
			🧠
		</div>

		<!-- Title -->
		<h1 class="font-display mb-2 text-4xl font-bold text-white" style="line-height: 1.12">
			Designing Workplaces That Think
		</h1>
		<p
			class="mb-10 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]"
			style="letter-spacing: 2.5px"
		>
			Cognitive Performance Exercise
		</p>

		<!-- Actions -->
		<div class="space-y-4">
			<a
				href="/session/create"
				class="block rounded-xl px-8 py-4 text-lg font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5"
				style="background: linear-gradient(135deg, var(--teal), var(--accent)); box-shadow: 0 4px 28px rgba(0,139,139,0.45)"
			>
				Create Session
			</a>

			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-white/10"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-[var(--dark)] px-4 text-white/40">or join an existing session</span>
				</div>
			</div>

			<form
				class="flex gap-3"
				onsubmit={(e) => {
					e.preventDefault();
					handleJoin();
				}}
			>
				<input
					type="text"
					bind:value={joinCode}
					placeholder="Enter code"
					maxlength="8"
					class="flex-1 rounded-xl border border-white/12 bg-white/6 px-5 py-3.5 text-center text-lg font-semibold uppercase tracking-widest text-white placeholder-white/30 outline-none transition-colors focus:border-[var(--accent)]"
				/>
				<button
					type="submit"
					class="rounded-xl border border-white/12 bg-white/6 px-6 py-3.5 font-bold text-white transition-colors hover:bg-white/10"
				>
					Join
				</button>
			</form>
			{#if joinError}
				<p class="text-sm text-[var(--red)]">{joinError}</p>
			{/if}
		</div>
	</div>
</div>
