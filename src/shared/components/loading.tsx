import { useEffect, useRef, type ReactElement } from "react";

const Loading = (): ReactElement =>{
	const pathRef = useRef(null);
	const groupRef = useRef(null);
	const particlesRef = useRef([]);

	const config = {
		particleCount: 10,
		trailSpan: 0.2,
		durationMs: 9800,
		rotationDurationMs: 18500,
		pulseDurationMs: 10000,
		strokeWidth: 3.7,
		spiroR: 8.8,
		spiror: 3,
		spirorBoost: 0.45,
		spirod: 5.4,
		spirodBoost: 1.2,
		spiroScale: 4.15,
		rotate: false
	};

  	const normalizeProgress = (progress: any) => ((progress % 1) + 1) % 1;

	const getDetailScale = (time: any) => {
		const pulseProgress = (time % config.pulseDurationMs) / config.pulseDurationMs;
		const pulseAngle = pulseProgress * Math.PI * 2;

		return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
	};

	const getRotation = (time: any) => {
		if (!config.rotate) return 0;
		return -((time % config.rotationDurationMs) / config.rotationDurationMs) * 360;
	};

	const point = (progress: any, detailScale: any) => {
		const t = progress * Math.PI * 2;
		const r = config.spiror + detailScale * config.spirorBoost;
		const d = config.spirod + detailScale * config.spirodBoost;

		const x = (config.spiroR - r) * Math.cos(t) + d * Math.cos(((config.spiroR - r) / r) * t);

		const y = (config.spiroR - r) * Math.sin(t) - d * Math.sin(((config.spiroR - r) / r) * t);

		return { x: 50 + x * config.spiroScale, y: 50 + y * config.spiroScale, };
	};

	const buildPath = (detailScale: any, steps = 480) => {
		return Array.from({ length: steps + 1 }, (_, i) => {
			const p = point(i / steps, detailScale);

			return `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
		}).join(" ");
	};

	const getParticle = (index: number, progress: any, detailScale: any) => {
		const tailOffset = index / (config.particleCount - 1);
		const p = point(normalizeProgress(progress - tailOffset * config.trailSpan), detailScale);
		const fade = Math.pow(1 - tailOffset, 0.56);

		return { x: p.x, y: p.y, radius: 0.9 + fade * 2.7, opacity: 0.04 + fade * 0.96 };
	};

	useEffect(() => {
		const particles = particlesRef.current;
		const startedAt = performance.now();

		const render = (now: any) => {
			const time = now - startedAt;
			const progress = (time % config.durationMs) / config.durationMs;
			const detailScale = getDetailScale(time);

			if ( groupRef.current ) {
				(groupRef.current as any).setAttribute("transform", `rotate(${getRotation(time)} 50 50)`);
			}

			// Update path
			if ( pathRef.current ) {
				(pathRef.current as any).setAttribute("d", buildPath(detailScale));
			}

			// Update particles
			particles.forEach((node: any, index) => {
				if ( !node ) return;
				const p = getParticle(index, progress, detailScale);

				node.setAttribute("cx", p.x.toFixed(2));
				node.setAttribute("cy", p.y.toFixed(2));
				node.setAttribute("r", p.radius.toFixed(2));
				node.setAttribute("opacity", p.opacity.toFixed(3));
			});

			requestAnimationFrame(render);
		};

		requestAnimationFrame(render);
	}, []);

	return (
		<div style={{ display: "grid", placeItems: "center", height: '100%', background: "transparent", color: "#000000" }}>
			<div style={{ aspectRatio: "1" }} className="flex items-center justify-center">
				<svg viewBox="0 0 100 100" width={100} height={100}>
					<g ref={groupRef}>
						<path
							ref={pathRef}
							stroke="currentColor"
							strokeWidth={config.strokeWidth}
							fill="none"
							opacity="0.1"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
							{ Array.from({ length: config.particleCount }).map((_, i) => (
								<circle
									key={i}
									ref={(el: any) => (particlesRef.current as any)[i] = el}
									fill="currentColor"
								/>
							))}
					</g>
				</svg>
			</div>
		</div>
  	);
}

export default Loading;