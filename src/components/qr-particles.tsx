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
  let rng = 42;
  const pseudoRandom = () => {
    rng = (rng * 16807 + 0) % 2147483647;
    return rng / 2147483647;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) continue;
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
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 17);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // QR grid
    const QR_SIZE = 21;
    const grid = generateQrGrid(QR_SIZE);

    // Create small cubes using InstancedMesh for performance
    const cubeSize = 0.22;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize * 0.3);
    const cubeMaterial = new THREE.MeshPhongMaterial({
      emissive: 0xa5b4fc,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9,
      shininess: 100,
    });

    // Count active cells
    const cells: { row: number; col: number }[] = [];
    for (let row = 0; row < QR_SIZE; row++) {
      for (let col = 0; col < QR_SIZE; col++) {
        if (grid[row][col]) cells.push({ row, col });
      }
    }

    const count = cells.length;
    const mesh = new THREE.InstancedMesh(cubeGeometry, cubeMaterial, count);
    mesh.position.set(5, 3.5, 0); // Top-right
    scene.add(mesh);


    // Lighting
    const ambientLight = new THREE.AmbientLight(0x6366f1, 0.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x818cf8, 1, 30);
    pointLight.position.set(3, 3, 8);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xa78bfa, 0.6, 25);
    pointLight2.position.set(-3, -2, 6);
    scene.add(pointLight2);

    // Calculate positions
    const spacing = 0.27;
    const offset = (QR_SIZE * spacing) / 2;
    const dummy = new THREE.Object3D();

    // Gradient colors for each cube
    const gradientColors: THREE.Color[] = [];

    interface ParticleData {
      targetX: number;
      targetY: number;
      targetZ: number;
      startX: number;
      startY: number;
      startZ: number;
      delay: number;
    }

    const particles: ParticleData[] = [];

    for (let i = 0; i < count; i++) {
      const { row, col } = cells[i];
      const tx = col * spacing - offset;
      const ty = -(row * spacing - offset);

      // Gradient: blue to lavender
      const t = (col + row) / (QR_SIZE * 2);
      const color = new THREE.Color().setHSL(0.6 + t * 0.1, 0.8, 0.85 + t * 0.08);
      gradientColors.push(color);

      // Random scattered start position
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 7;
      const sx = Math.cos(angle) * radius;
      const sy = Math.sin(angle) * radius;
      const sz = (Math.random() - 0.5) * 8;

      const dist = Math.sqrt(tx * tx + ty * ty);
      const delay = dist * 0.1 + Math.random() * 0.25;

      particles.push({
        targetX: tx, targetY: ty, targetZ: 0,
        startX: sx, startY: sy, startZ: sz, delay,
      });
    }

    // Apply gradient colors
    for (let i = 0; i < count; i++) {
      mesh.setColorAt(i, gradientColors[i]);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // Scan laser planes — enfants du mesh pour suivre sa rotation/position
    const qrHalfSize = (QR_SIZE * spacing) / 2; // ~2.835
    const exactQrWidth = QR_SIZE * spacing;      // largeur exacte cubes

    const makeLine = (height: number, opacity: number) => {
      const geo = new THREE.PlaneGeometry(exactQrWidth, height);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const plane = new THREE.Mesh(geo, mat);
      plane.visible = false;
      scene.add(plane); // dans la scène, rotation toujours 0 (ligne droite)
      return { plane, mat, geo };
    };

    const line1 = makeLine(0.014, 1.0);  // ligne ultra fine centrale
    const line2 = makeLine(0.055, 0.65); // halo proche
    const line3 = makeLine(0.16,  0.30); // halo diffus

    // Animation state
    const FORM_DURATION = 4.5;
    const HOLD_DURATION = 15.0;
    const SCATTER_DURATION = 3.0;
    const SCATTER_HOLD = 2.5;
    const TOTAL_CYCLE =
      FORM_DURATION + HOLD_DURATION + SCATTER_DURATION + SCATTER_HOLD;

    const SCAN_DURATION = 2.5; // une traversée
    const TOTAL_SCAN = SCAN_DURATION * 2;

    let time = 0;
    let animationId: number;
    const clock = new THREE.Clock();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const scanColor = new THREE.Color(0xffffff);
    const tempColor = new THREE.Color();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      time += delta;

      const cycleTime = time % TOTAL_CYCLE;
      const isHolding = cycleTime >= FORM_DURATION && cycleTime < FORM_DURATION + HOLD_DURATION;
      const holdTime = isHolding ? cycleTime - FORM_DURATION : 0;

      // Scan laser position & opacity
      let scanY = 0;
      let scanVisible = false;
      if (isHolding && holdTime < TOTAL_SCAN) {
        scanVisible = true;
        const scanNorm = holdTime < SCAN_DURATION
          ? holdTime / SCAN_DURATION         // descente 0→1
          : 2 - holdTime / SCAN_DURATION;    // montée 1→0
        // map 0→1 to top→bottom: top = +qrHalfSize, bottom = -qrHalfSize
        scanY = qrHalfSize - scanNorm * qrHalfSize * 2;
      }

      // position monde : centré sur le mesh, Y suit le scan, rotation = 0 (droit)
      for (const { plane } of [line1, line2, line3]) {
        plane.visible = scanVisible;
        if (scanVisible) plane.position.set(mesh.position.x - 0.6, mesh.position.y + scanY, mesh.position.z + 0.3);
      }

      for (let i = 0; i < count; i++) {
        const p = particles[i];

        let progress: number;

        if (cycleTime < FORM_DURATION) {
          const t = Math.max(
            0,
            (cycleTime - p.delay) / (FORM_DURATION - p.delay - 0.2),
          );
          progress = easeInOutCubic(Math.min(1, Math.max(0, t)));
        } else if (cycleTime < FORM_DURATION + HOLD_DURATION) {
          progress = 1;
        } else if (
          cycleTime <
          FORM_DURATION + HOLD_DURATION + SCATTER_DURATION
        ) {
          const t =
            (cycleTime - FORM_DURATION - HOLD_DURATION) / SCATTER_DURATION;
          const delayed = Math.max(0, t - p.delay * 0.08);
          progress = 1 - easeInOutCubic(Math.min(1, delayed * 1.5));
        } else {
          progress = 0;
        }

        const x = p.startX + (p.targetX - p.startX) * progress;
        const y = p.startY + (p.targetY - p.startY) * progress;
        const z = p.startZ + (p.targetZ - p.startZ) * progress;

        dummy.position.set(x, y, z);

        // Slight rotation when scattered, aligned when formed
        dummy.rotation.set(
          (1 - progress) * Math.sin(time + i) * 0.5,
          (1 - progress) * Math.cos(time + i * 0.7) * 0.5,
          0,
        );
        dummy.scale.setScalar(0.7 + progress * 0.3);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        // Glow des particules proches du scan (coordonnées locales du mesh)
        if (scanVisible && progress > 0.8) {
          const dist = Math.abs(p.targetY - scanY);
          const scanRange = 0.5;
          if (dist < scanRange) {
            const intensity = 1 - dist / scanRange;
            tempColor.lerpColors(gradientColors[i], scanColor, intensity * 0.7);
            mesh.setColorAt(i, tempColor);
          } else {
            mesh.setColorAt(i, gradientColors[i]);
          }
        } else {
          mesh.setColorAt(i, gradientColors[i]);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

      // Gentle rotation of the whole QR when formed
      const formProgress =
        cycleTime < FORM_DURATION + HOLD_DURATION
          ? Math.min(1, cycleTime / FORM_DURATION)
          : Math.max(
              0,
              1 -
                (cycleTime - FORM_DURATION - HOLD_DURATION) / SCATTER_DURATION,
            );

      mesh.rotation.y = 0;
      mesh.rotation.x = 0;

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
      cubeGeometry.dispose();
      cubeMaterial.dispose();
      for (const { geo, mat } of [line1, line2, line3]) {
        geo.dispose();
        mat.dispose();
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0" aria-hidden="true" />
  );
}
