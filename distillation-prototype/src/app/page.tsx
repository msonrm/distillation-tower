"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Cell,
  SimParams,
  SimStats,
  DEFAULT_PARAMS,
  createGrid,
  simulateStep,
  calculateStats,
} from "@/lib/simulation";
import { ControlPanel, SimulationCanvas } from "@/components";

export default function DistillationPrototype() {
  const gridRef = useRef<Cell[][] | null>(null);
  const animationRef = useRef<number>(0);
  const [frame, setFrame] = useState(0);
  const [running, setRunning] = useState(false);
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [showTemp, setShowTemp] = useState(true);
  const [stats, setStats] = useState<SimStats>({ water: 0, vapor: 0, avgTemp: 0 });

  const cellSize =
    typeof window !== "undefined"
      ? Math.min(
          (Math.min(window.innerWidth - 320, 600)) / params.gridWidth,
          (window.innerHeight - 100) / params.gridHeight
        )
      : 5;

  const initGrid = useCallback(() => {
    gridRef.current = createGrid(params);
    setFrame(0);
    if (gridRef.current) {
      setStats(calculateStats(gridRef.current));
    }
  }, [params]);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  const simulate = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;

    simulateStep(grid, params, frame);
    setFrame((f) => f + 1);
    setStats(calculateStats(grid));

    if (running) {
      animationRef.current = requestAnimationFrame(simulate);
    }
  }, [params, frame, running]);

  useEffect(() => {
    if (running) {
      animationRef.current = requestAnimationFrame(simulate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [running, simulate]);

  const handleParamChange = (key: keyof SimParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setRunning(false);
    initGrid();
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex">
      <div className="flex-1 flex items-center justify-center p-4">
        <SimulationCanvas
          grid={gridRef.current}
          cellSize={cellSize}
          showTemp={showTemp}
          frame={frame}
          stats={stats}
        />
      </div>

      <ControlPanel
        params={params}
        running={running}
        showTemp={showTemp}
        onParamChange={handleParamChange}
        onToggleRunning={() => setRunning(!running)}
        onReset={handleReset}
        onToggleShowTemp={setShowTemp}
      />
    </div>
  );
}
