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

	// Duplicate images for seamless looping when auto-scrolling
	let displayImages = $derived(
		needsScroll ? [...images, ...images] : images
	);
</script>

<div
	class="masonry-container"
	class:auto-scroll={needsScroll && !paused}
	role="region"
	aria-label="Workspace image gallery"
	onmouseenter={() => (paused = true)}
	onmouseleave={() => (paused = false)}
>
	<div class="masonry-track">
		{#each displayImages as image, i (needsScroll ? `${image.id}-${i}` : image.id)}
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
		overflow-y: auto;
		overflow-x: hidden;
		border-radius: 1rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
	}

	.masonry-container::-webkit-scrollbar {
		width: 4px;
	}

	.masonry-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.masonry-container::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.15);
		border-radius: 2px;
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

	/* Auto-scroll only when not hovered and enough images */
	.auto-scroll {
		overflow-y: hidden;
	}

	.auto-scroll .masonry-track {
		animation: ticker-scroll 40s linear infinite;
	}

	.auto-scroll:hover .masonry-track {
		animation-play-state: paused;
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
		break-inside: avoid;
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
		.auto-scroll .masonry-track {
			animation: none;
		}
		.auto-scroll {
			overflow-y: auto;
		}
	}
</style>
