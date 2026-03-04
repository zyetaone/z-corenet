<script lang="ts">
	import { onMount } from 'svelte';

	let {
		participantCount = 0,
		phase = 'individual'
	}: {
		participantCount?: number;
		phase?: 'individual' | 'communal';
	} = $props();

	let canvas: HTMLCanvasElement;
	let animationId: number;

	let mouseX = -1000;
	let mouseY = -1000;

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		radius: number;
	}

	let particles: Particle[] = [];
	const MAX_PARTICLES = 50;
	const CONNECTION_DISTANCE = 120;

	function spawnParticle(w: number, h: number): Particle {
		return {
			x: Math.random() * w,
			y: Math.random() * h,
			vx: (Math.random() - 0.5) * 0.5,
			vy: (Math.random() - 0.5) * 0.5,
			radius: 3 + Math.random() * 4
		};
	}

	onMount(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		function resize() {
			canvas.width = canvas.offsetWidth * devicePixelRatio;
			canvas.height = canvas.offsetHeight * devicePixelRatio;
			ctx!.scale(devicePixelRatio, devicePixelRatio);
		}
		resize();
		window.addEventListener('resize', resize);

		function animate() {
			if (!ctx) return;
			const w = canvas.offsetWidth;
			const h = canvas.offsetHeight;

			// Sync particle count to participantCount
			const target = Math.min(participantCount * 3, MAX_PARTICLES);
			while (particles.length < target) {
				particles.push(spawnParticle(w, h));
			}

			ctx.clearRect(0, 0, w, h);

			// Add a subtle composite operation for glowing intersections
			ctx.globalCompositeOperation = 'screen';

			// Update and draw particles
			for (const p of particles) {
				if (!reduceMotion) {
					p.x += p.vx;
					p.y += p.vy;

					// Bounce off edges
					if (p.x < 0 || p.x > w) p.vx *= -1;
					if (p.y < 0 || p.y > h) p.vy *= -1;

					// Collective mode: gentle pull toward center
					if (phase === 'communal') {
						p.vx += (w / 2 - p.x) * 0.0001;
						p.vy += (h / 2 - p.y) * 0.0001;
					}

					// Mouse interaction (gentle repel)
					const dx = mouseX - p.x;
					const dy = mouseY - p.y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < 150) {
						const force = (150 - dist) / 1500;
						p.vx -= dx * force;
						p.vy -= dy * force;
					}

					// Friction to stop infinite acceleration
					p.vx *= 0.99;
					p.vy *= 0.99;
				}

				// Draw particle
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
				ctx.shadowBlur = 10;
				ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
				ctx.fill();
			}

			// Draw connections
			if (!reduceMotion) {
				ctx.shadowBlur = 0; // Reset shadow for lines
				const connectionColor = '255, 255, 255';

				// Optional: In individual phase, connect slightly less aggressively
				const currentConnectionDist =
					phase === 'communal' ? CONNECTION_DISTANCE : CONNECTION_DISTANCE * 0.8;
				ctx.strokeStyle = `rgba(${connectionColor}, 0.15)`;
				ctx.lineWidth = 1.5;
				for (let i = 0; i < particles.length; i++) {
					for (let j = i + 1; j < particles.length; j++) {
						const dx = particles[i].x - particles[j].x;
						const dy = particles[i].y - particles[j].y;
						const dist = Math.sqrt(dx * dx + dy * dy);
						if (dist < currentConnectionDist) {
							ctx.globalAlpha = 1 - Math.pow(dist / currentConnectionDist, 1.5);
							ctx.beginPath();
							ctx.moveTo(particles[i].x, particles[i].y);
							ctx.lineTo(particles[j].x, particles[j].y);
							ctx.stroke();
						}
					}
				}
				ctx.globalAlpha = 1;
			}

			// Reset Composite logic for next frame
			ctx.globalCompositeOperation = 'source-over';

			animationId = requestAnimationFrame(animate);
		}

		animate();

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<svelte:window
	onmousemove={(e) => {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}}
	onmouseleave={() => {
		mouseX = -1000;
		mouseY = -1000;
	}}
/>

<canvas
	bind:this={canvas}
	class="pointer-events-none fixed inset-0 z-0 h-full w-full"
	aria-hidden="true"
></canvas>
