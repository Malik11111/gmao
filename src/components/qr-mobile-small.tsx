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

// Même couleur que le bouton "Se connecter" (--accent)
const COLOR = "#000000";

const FORM_DURATION = 4.5;
const HOLD_DURATION = 15.0;
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

    // Collecte les cellules actives
    const cells: { row: number; col: number }[] = [];
    for (let row = 0; row < QR_SIZE; row++) {
      for (let col = 0; col < QR_SIZE; col++) {
        if (grid[row][col]) cells.push({ row, col });
      }
    }

    // Génère les données de chaque particule
    const particles = cells.map(({ row, col }) => {
      const tx = col * CELL + CELL / 2;
      const ty = row * CELL + CELL / 2;

      // Position de départ éparpillée autour du canvas — vient de plus loin
      const angle = Math.random() * Math.PI * 2;
      const radius = CANVAS_PX * 1.2 + Math.random() * CANVAS_PX * 1.4;
      const sx = CANVAS_PX / 2 + Math.cos(angle) * radius;
      const sy = CANVAS_PX / 2 + Math.sin(angle) * radius;

      const dist = Math.sqrt(
        (tx - CANVAS_PX / 2) ** 2 + (ty - CANVAS_PX / 2) ** 2,
      );
      const delay = dist * 0.012 + Math.random() * 0.25;

      return { tx, ty, sx, sy, delay };
    });

    let startTime: number | null = null;
    let animId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const time = (timestamp - startTime) / 1000;
      const cycleTime = time % TOTAL_CYCLE;

      ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);

      // Calcul du progress global pour la rotation douce
      let formProgress: number;
      if (cycleTime < FORM_DURATION) {
        formProgress = Math.min(1, cycleTime / FORM_DURATION);
      } else if (cycleTime < FORM_DURATION + HOLD_DURATION) {
        formProgress = 1;
      } else {
        formProgress = Math.max(
          0,
          1 - (cycleTime - FORM_DURATION - HOLD_DURATION) / SCATTER_DURATION,
        );
      }

      // Légère rotation du QR quand formé (comme la version 3D)
      // Droit pendant la formation, oscillation douce quand formé
      let rotY: number;
      if (cycleTime < FORM_DURATION) {
        rotY = 0;
      } else if (cycleTime < FORM_DURATION + HOLD_DURATION) {
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

      for (let i = 0; i < particles.length; i++) {
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
        } else if (cycleTime < FORM_DURATION + HOLD_DURATION + SCATTER_DURATION) {
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
