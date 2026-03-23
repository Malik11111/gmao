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

export function QrMobileSmall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const grid = generateQrGrid(21);
    const SIZE = 21;
    const CELL = Math.floor(canvas.width / SIZE);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (grid[row][col]) {
          // Gradient bleu/lavande comme l'animation 3D
          const t = (col + row) / (SIZE * 2);
          const lightness = Math.round((55 + t * 12) * 100) / 100;
          ctx.fillStyle = `hsl(${Math.round(230 + t * 20)}, 70%, ${lightness}%)`;
          ctx.fillRect(col * CELL + 1, row * CELL + 1, CELL - 1, CELL - 1);
        }
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={105}
      height={105}
      className="opacity-50"
      aria-hidden="true"
    />
  );
}
