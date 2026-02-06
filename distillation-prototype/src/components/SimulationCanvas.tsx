"use client";

import { useRef, useEffect, useCallback } from "react";
import { Cell, SimStats } from "@/lib/simulation";
import { getCellKey, COLORS, getTemperatureColor } from "@/lib/simulation";

interface SimulationCanvasProps {
  grid: Cell[][] | null;
  cellSize: number;
  showTemp: boolean;
  frame: number;
  stats: SimStats;
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
        const cellKey = getCellKey(cell.substance, cell.phase);
        let color = COLORS[cellKey] ?? "#000";

        if (showTemp) {
          color = getTemperatureColor(color, cell.temperature);
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
    <div className="flex flex-col items-center">
      <div className="bg-black/70 px-3 py-1 rounded mb-2 text-xs font-mono">
        <span>Frame: {frame}</span>
        <span className="mx-2">|</span>
        <span>FPS: {stats.fps.toFixed(1)}</span>
        <span className="mx-2">|</span>
        <span>A: {stats.liquidA}L/{stats.gasA}G</span>
        <span className="mx-2">|</span>
        <span>B: {stats.liquidB}L/{stats.gasB}G</span>
        <span className="mx-2">|</span>
        <span>Avg Temp: {(stats.avgTemp * 100).toFixed(0)}%</span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-700 rounded"
      />
    </div>
  );
}
