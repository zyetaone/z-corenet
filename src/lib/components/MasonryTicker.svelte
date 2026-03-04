<script lang="ts">
	type GalleryImage = {
		id: string;
		participantName: string;
		imageData: string;
		featureNames: string[];
		createdAt: string;
	};

	let {
		images,
		onselect
	}: {
		images: GalleryImage[];
		onselect: (image: GalleryImage) => void;
	} = $props();

	let paused = $state(false);
	let needsScroll = $derived(images.length > 6);
</script>

<div
	class="masonry-container"
	class:scrolling={needsScroll && !paused}
	role="region"
	aria-label="Workspace image gallery"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
>
	<div class="masonry-track">
		{#each images as image (image.id)}
			<button
				type="button"
				class="masonry-card"
				onclick={() => onselect(image)}
			>
				<img src={image.imageData} alt="{image.participantName}'s workspace" loading="lazy" />
				<span class="card-name">{image.participantName}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.masonry-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		border-radius: 1rem;
	}

	.masonry-track {
		columns: 3;
		column-gap: 0.5rem;
		padding: 0.25rem;
	}

	@media (max-width: 768px) {
		.masonry-track {
			columns: 2;
		}
	}

	.scrolling .masonry-track {
		animation: ticker-scroll 30s linear infinite;
	}

	@keyframes ticker-scroll {
		0% { transform: translateY(0); }
		100% { transform: translateY(-50%); }
	}

	.masonry-card {
		display: inline-block;
		width: 100%;
		margin-bottom: 0.5rem;
		border-radius: 0.75rem;
		overflow: hidden;
		position: relative;
		cursor: pointer;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: none;
		padding: 0;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.masonry-card:hover {
		transform: scale(1.02);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.masonry-card img {
		width: 100%;
		display: block;
		border-radius: 0.75rem;
	}

	.card-name {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.5rem 0.625rem;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		color: white;
		font-size: 0.6875rem;
		font-weight: 700;
		border-radius: 0 0 0.75rem 0.75rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.scrolling .masonry-track {
			animation: none;
		}
	}
</style>
