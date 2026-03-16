<script lang="ts">
	let {
		children,
		variant = 'default',
		class: className = ''
	}: {
		children: import('svelte').Snippet;
		variant?: 'default' | 'solid' | 'outline';
		class?: string;
	} = $props();

	const variantClasses = {
		default: 'bg-white/10 text-white border border-white/10 backdrop-blur-md',
		solid: 'bg-teal text-white',
		outline: 'border border-white/20 text-white/80'
	};
</script>

<div
	class="inline-flex items-center rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase {variantClasses[
		variant
	]} {className}"
>
	{@render children()}
</div>
