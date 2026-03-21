"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Generate a simple QR-like grid pattern (21x21 like QR Version 1)
function generateQrGrid(size: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  // Finder patterns (3 corners)
  const drawFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = x === 0 || x === 6 || y === 0 || y === 6;
        const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        grid[oy + y][ox + x] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Random data modules
  const seed = 42;
  let rng = seed;
  const pseudoRandom = () => {
    rng = (rng * 16807 + 0) % 2147483647;
    return rng / 2147483647;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) continue;
      // Skip finder pattern areas + separators
      const inFinder1 = x <= 7 && y <= 7;
      const inFinder2 = x >= size - 8 && y <= 7;
      const inFinder3 = x <= 7 && y >= size - 8;
      if (inFinder1 || inFinder2 || inFinder3) continue;
      grid[y][x] = pseudoRandom() > 0.52;
    }
  }

  return grid;
}

export function QrParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // QR grid
    const QR_SIZE = 21;
    const grid = generateQrGrid(QR_SIZE);

    // Create particles
    const particles: {
      targetX: number;
      targetY: number;
      targetZ: number;
      startX: number;
      startY: number;
      startZ: number;
      delay: number;
    }[] = [];

    const spacing = 0.38;
    const offset = (QR_SIZE * spacing) / 2;

    for (let row = 0; row < QR_SIZE; row++) {
      for (let col = 0; col < QR_SIZE; col++) {
        if (!grid[row][col]) continue;
        const tx = col * spacing - offset;
        const ty = -(row * spacing - offset);
        const tz = 0;

        // Random start position (scattered)
        const angle = Math.random() * Math.PI * 2;
        const radius = 6 + Math.random() * 8;
        const sx = Math.cos(angle) * radius;
        const sy = Math.sin(angle) * radius;
        const sz = (Math.random() - 0.5) * 10;

        // Distance from center for staggered delay
        const dist = Math.sqrt(tx * tx + ty * ty);
        const delay = dist * 0.12 + Math.random() * 0.3;

        particles.push({ targetX: tx, targetY: ty, targetZ: tz, startX: sx, startY: sy, startZ: sz, delay });
      }
    }

    // Geometry
    const count = particles.length;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Initial positions (scattered)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = particles[i].startX;
      positions[i * 3 + 1] = particles[i].startY;
      positions[i * 3 + 2] = particles[i].startZ;

      // Indigo/violet color palette
      const hue = 0.7 + Math.random() * 0.1; // 0.7-0.8 range (indigo to violet)
      const color = new THREE.Color().setHSL(hue, 0.8, 0.65);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 2.5 + Math.random() * 1.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Shader material for round glowing particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (8.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.2, 0.5, d);
          gl_FragColor = vec4(vColor, alpha * 0.9);
        }
      `,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animation state
    const FORM_DURATION = 3.0; // seconds to form QR
    const HOLD_DURATION = 4.0; // seconds to hold formed
    const SCATTER_DURATION = 2.0; // seconds to scatter
    const SCATTER_HOLD = 1.5; // seconds to stay scattered
    const TOTAL_CYCLE = FORM_DURATION + HOLD_DURATION + SCATTER_DURATION + SCATTER_HOLD;

    let time = 0;
    let animationId: number;

    const clock = new THREE.Clock();

    // Easing
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta;

      const cycleTime = time % TOTAL_CYCLE;
      const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        let progress: number;

        if (cycleTime < FORM_DURATION) {
          // Forming phase
          const t = Math.max(0, (cycleTime - p.delay) / (FORM_DURATION - p.delay - 0.2));
          progress = easeInOutCubic(Math.min(1, Math.max(0, t)));
        } else if (cycleTime < FORM_DURATION + HOLD_DURATION) {
          // Hold formed
          progress = 1;
        } else if (cycleTime < FORM_DURATION + HOLD_DURATION + SCATTER_DURATION) {
          // Scattering phase
          const t = (cycleTime - FORM_DURATION - HOLD_DURATION) / SCATTER_DURATION;
          const delayed = Math.max(0, (t - p.delay * 0.08));
          progress = 1 - easeInOutCubic(Math.min(1, delayed * 1.5));
        } else {
          // Hold scattered
          progress = 0;
        }

        posAttr.setXYZ(
          i,
          p.startX + (p.targetX - p.startX) * progress,
          p.startY + (p.targetY - p.startY) * progress,
          p.startZ + (p.targetZ - p.startZ) * progress,
        );
      }

      posAttr.needsUpdate = true;

      // Slow gentle rotation when formed
      const formProgress = cycleTime < FORM_DURATION + HOLD_DURATION
        ? Math.min(1, cycleTime / FORM_DURATION)
        : Math.max(0, 1 - (cycleTime - FORM_DURATION - HOLD_DURATION) / SCATTER_DURATION);

      points.rotation.y = Math.sin(time * 0.15) * 0.15 * formProgress;
      points.rotation.x = Math.sin(time * 0.1) * 0.08 * formProgress;

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}
