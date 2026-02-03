"use client";

import { useRef, useEffect, useCallback } from "react";
import { Cell, CellType, SimStats } from "@/lib/simulation";
import { COLORS } from "@/lib/simulation";

interface SimulationCanvasProps {
  grid: Cell[][] | null;
  cellSize: number;
  showTemp: boolean;
  frame: number;
  stats: SimStats;
}

function temperatureToColor(temp: number, baseColor: string): string {
  const normalized = Math.max(0, Math.min(1, (temp - 20) / 180));

  if (baseColor === COLORS[CellType.WATER] || baseColor === COLORS[CellType.VAPOR]) {
    const r = Math.floor(59 + normalized * 180);
    const g = Math.floor(130 - normalized * 80);
    const b = Math.floor(246 - normalized * 150);
    return `rgb(${r},${g},${b})`;
  }

  return baseColor;
}

export function SimulationCanvas({
  grid,
  cellSize,
  showTemp,
  frame,
  stats,
}: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        let color = COLORS[cell.type] ?? "#000";

        if (
          showTemp &&
          (cell.type === CellType.WATER ||
            cell.type === CellType.VAPOR ||
            cell.type === CellType.EMPTY)
        ) {
          color = temperatureToColor(cell.temperature, color);
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }, [grid, cellSize, showTemp]);

  useEffect(() => {
    render();
  }, [render, frame]);

  const width = grid ? grid[0].length * cellSize : 0;
  const height = grid ? grid.length * cellSize : 0;

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-700 rounded"
      />
      <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono">
        Frame: {frame} | Water: {stats.water} | Vapor: {stats.vapor} | Avg Temp:{" "}
        {stats.avgTemp}°
      </div>
    </div>
  );
}
