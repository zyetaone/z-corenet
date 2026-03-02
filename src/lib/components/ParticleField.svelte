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
				}

				// Draw particle
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
				ctx.fillStyle = 'rgba(0, 191, 165, 0.15)';
				ctx.fill();
			}

			// Draw connections in collective mode
			if (phase === 'communal' && !reduceMotion) {
				ctx.strokeStyle = 'rgba(0, 191, 165, 0.06)';
				ctx.lineWidth = 1;
				for (let i = 0; i < particles.length; i++) {
					for (let j = i + 1; j < particles.length; j++) {
						const dx = particles[i].x - particles[j].x;
						const dy = particles[i].y - particles[j].y;
						const dist = Math.sqrt(dx * dx + dy * dy);
						if (dist < CONNECTION_DISTANCE) {
							ctx.globalAlpha = 1 - dist / CONNECTION_DISTANCE;
							ctx.beginPath();
							ctx.moveTo(particles[i].x, particles[i].y);
							ctx.lineTo(particles[j].x, particles[j].y);
							ctx.stroke();
						}
					}
				}
				ctx.globalAlpha = 1;
			}

			animationId = requestAnimationFrame(animate);
		}

		animate();

		return () => {
			cancelAnimationFrame(animationId);
			window.removeEventListener('resize', resize);
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="pointer-events-none fixed inset-0 z-0 h-full w-full"
	aria-hidden="true"
></canvas>
