"use client";

import { useEffect, useRef } from "react";

function generateQrGrid(size: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

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

  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

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

const CANVAS_PX = 168;
const QR_SIZE = 21;

const COLOR = "#000000";

const FORM_DURATION = 6.0;
const HOLD_DURATION = 6.0;
const SCATTER_DURATION = 3.0;
const SCATTER_HOLD = 2.5;
const TOTAL_CYCLE = FORM_DURATION + HOLD_DURATION + SCATTER_DURATION + SCATTER_HOLD;


function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function QrMobileSmall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grid = generateQrGrid(QR_SIZE);
    const CELL = CANVAS_PX / QR_SIZE;

    const cells: { row: number; col: number }[] = [];
    for (let row = 0; row < QR_SIZE; row++) {
      for (let col = 0; col < QR_SIZE; col++) {
        if (grid[row][col]) cells.push({ row, col });
      }
    }

    const particles = cells.map(({ row, col }) => {
      const tx = col * CELL + CELL / 2;
      const ty = row * CELL + CELL / 2;
      // Position de départ aléatoire visible dans le canvas
      const sx = Math.random() * CANVAS_PX;
      const sy = Math.random() * CANVAS_PX;
      const delay = Math.random() * 0.6;

      return { tx, ty, sx, sy, delay, row, col };
    });

    let startTime: number | null = null;
    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const time = (timestamp - startTime) / 1000;
      const cycleTime = time % TOTAL_CYCLE;

      ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);

      // Phase detection
      const isForming = cycleTime < FORM_DURATION;
      const isHolding = cycleTime >= FORM_DURATION && cycleTime < FORM_DURATION + HOLD_DURATION;
      const isScattering = cycleTime >= FORM_DURATION + HOLD_DURATION && cycleTime < FORM_DURATION + HOLD_DURATION + SCATTER_DURATION;
      const holdTime = isHolding ? cycleTime - FORM_DURATION : 0;

      // Rotation douce
      let rotY: number;
      if (isForming) {
        rotY = 0;
      } else if (isHolding) {
        rotY = Math.sin(time * 0.45) * 0.14;
      } else {
        const fadeOut = Math.max(0, 1 - (cycleTime - FORM_DURATION - HOLD_DURATION) / SCATTER_DURATION);
        rotY = Math.sin(time * 0.45) * 0.14 * fadeOut;
      }
      const scaleX = Math.cos(rotY);

      ctx.save();
      ctx.translate(CANVAS_PX / 2, CANVAS_PX / 2);
      ctx.scale(scaleX, 1);
      ctx.translate(-CANVAS_PX / 2, -CANVAS_PX / 2);

      // === Dessiner les particules principales ===
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        let progress: number;
        if (isForming) {
          const t = Math.max(
            0,
            (cycleTime - p.delay) / (FORM_DURATION - p.delay - 0.2),
          );
          progress = easeInOutCubic(Math.min(1, Math.max(0, t)));
        } else if (isHolding) {
          progress = 1;
        } else if (isScattering) {
          const t =
            (cycleTime - FORM_DURATION - HOLD_DURATION) / SCATTER_DURATION;
          const delayed = Math.max(0, t - p.delay * 0.08);
          progress = 1 - easeInOutCubic(Math.min(1, delayed * 1.5));
        } else {
          progress = 0;
        }

        const x = p.sx + (p.tx - p.sx) * progress;
        const y = p.sy + (p.ty - p.sy) * progress;

        const size = CELL * 0.62 * (0.5 + progress * 0.5);

        ctx.globalAlpha = progress < 0.5 ? progress * 1.6 : 1.0;
        ctx.fillStyle = COLOR;
        const r = size * 0.18;
        ctx.beginPath();
        ctx.roundRect(x - size / 2, y - size / 2, size, size, r);
        ctx.fill();
      }

      // === EFFET 7 : Scan laser pendant le hold ===
      if (isHolding) {
        const scanSpeed = 1.8;
        const scanCycle = holdTime * scanSpeed % 2;
        // Aller-retour : 0→1 puis 1→0
        const scanNorm = scanCycle <= 1 ? scanCycle : 2 - scanCycle;
        const scanY = scanNorm * CANVAS_PX;

        const scanWidth = 24;

        // Ligne laser principale
        const laserGrad = ctx.createLinearGradient(0, scanY - scanWidth / 2, 0, scanY + scanWidth / 2);
        laserGrad.addColorStop(0, "rgba(99, 102, 241, 0)");
        laserGrad.addColorStop(0.3, "rgba(99, 102, 241, 0.06)");
        laserGrad.addColorStop(0.5, "rgba(99, 102, 241, 0.18)");
        laserGrad.addColorStop(0.7, "rgba(99, 102, 241, 0.06)");
        laserGrad.addColorStop(1, "rgba(99, 102, 241, 0)");

        ctx.globalAlpha = 1;
        ctx.fillStyle = laserGrad;
        ctx.fillRect(0, scanY - scanWidth / 2, CANVAS_PX, scanWidth);

        // Ligne fine centrale brillante
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = "rgba(99, 102, 241, 1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(CANVAS_PX, scanY);
        ctx.stroke();

        // Illumination des particules proches du scan
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dist = Math.abs(p.ty - scanY);
          if (dist < scanWidth) {
            const intensity = 1 - dist / scanWidth;
            const glowSize = CELL * 0.62 * 1.15;
            ctx.globalAlpha = intensity * 0.35;
            ctx.fillStyle = "rgba(99, 102, 241, 1)";
            ctx.beginPath();
            ctx.roundRect(
              p.tx - glowSize / 2,
              p.ty - glowSize / 2,
              glowSize,
              glowSize,
              glowSize * 0.18,
            );
            ctx.fill();
          }
        }
      }

      ctx.restore();
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_PX}
      height={CANVAS_PX}
      aria-hidden="true"
    />
  );
}
