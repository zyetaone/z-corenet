<script lang="ts">
	let {
		progress = 0,
		message = 'Creating your workspace...',
		showCredit = true,
		dark = false
	}: {
		progress?: number;
		message?: string;
		showCredit?: boolean;
		dark?: boolean;
	} = $props();
</script>

<div class="flex flex-col items-center gap-4 p-8" class:dark-mode={dark}>
	{#if showCredit}
		<div class="flex flex-col items-center gap-1">
			<span class="credit-label">Powered by</span>
			<h3 class="brand-text">
				Zyeta<span class="bounce-i">I</span>
			</h3>
		</div>
	{/if}

	<div class="flex flex-col items-center gap-2">
		<p class="progress-pct">{progress}%</p>
		<div class="progress-track">
			<div class="progress-fill" style="width: {progress}%"></div>
		</div>
		{#if message}
			<p class="progress-msg">{message}</p>
		{/if}
	</div>
</div>

<style>
	.credit-label {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(15, 25, 35, 0.5);
	}

	.dark-mode .credit-label {
		color: rgba(255, 255, 255, 0.5);
	}

	.brand-text {
		font-size: 1.875rem;
		font-weight: 700;
		background: linear-gradient(135deg, var(--color-teal), var(--color-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.bounce-i {
		display: inline-block;
		background: linear-gradient(135deg, var(--color-teal), var(--color-accent));
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: dot-bounce 3s ease-in-out infinite;
		transform-origin: bottom;
	}

	@keyframes dot-bounce {
		0%, 100% { transform: translateY(0) scaleY(1) scaleX(1); }
		10% { transform: translateY(0) scaleY(0.3) scaleX(1.3); }
		20% { transform: translateY(-8px) scaleY(1.1) scaleX(0.9); }
		30% { transform: translateY(0) scaleY(0.95) scaleX(1.05); }
		40% { transform: translateY(-4px) scaleY(1.05) scaleX(0.95); }
		50% { transform: translateY(0) scaleY(1) scaleX(1); }
	}

	.progress-pct {
		font-size: 1.125rem;
		font-weight: 600;
		color: rgba(15, 25, 35, 0.8);
	}

	.dark-mode .progress-pct {
		color: rgba(255, 255, 255, 0.9);
	}

	.progress-track {
		width: 16rem;
		height: 0.75rem;
		border-radius: 9999px;
		background: rgba(15, 25, 35, 0.1);
		overflow: hidden;
	}

	.dark-mode .progress-track {
		background: rgba(255, 255, 255, 0.1);
	}

	.progress-fill {
		height: 100%;
		border-radius: 9999px;
		background: linear-gradient(90deg, var(--color-teal), var(--color-accent));
		transition: width 0.3s ease-out;
	}

	.progress-msg {
		font-size: 0.8125rem;
		color: rgba(15, 25, 35, 0.5);
	}

	.dark-mode .progress-msg {
		color: rgba(255, 255, 255, 0.5);
	}

	@media (prefers-reduced-motion: reduce) {
		.bounce-i {
			animation: none;
		}
	}
</style>
