"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Cell,
  SimParams,
  SimStats,
  SubstanceProps,
  FixedSubstanceProps,
  CellKey,
  DEFAULT_PARAMS,
  createGrid,
  simulateStep,
  calculateStats,
} from "@/lib/simulation";
import { ControlPanel, SimulationCanvas } from "@/components";

export default function DistillationSimulator() {
  const gridRef = useRef<Cell[][] | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const fpsRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const [frame, setFrame] = useState(0);
  const [running, setRunning] = useState(false);
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [showTemp, setShowTemp] = useState(true);
  const [stats, setStats] = useState<SimStats>({
    liquidA: 0,
    liquidB: 0,
    gasA: 0,
    gasB: 0,
    avgTemp: 0,
    fps: 0,
  });

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
    frameCountRef.current = 0;
    if (gridRef.current) {
      setStats({ ...calculateStats(gridRef.current), fps: 0 });
    }
  }, [params]);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  const simulate = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Calculate FPS
    const now = performance.now();
    frameCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      fpsRef.current = frameCountRef.current;
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    simulateStep(grid, params, frame);
    setFrame((f) => f + 1);

    const newStats = calculateStats(grid);
    setStats({ ...newStats, fps: fpsRef.current });

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

  const handleSubstanceChange = (
    substance: "A" | "B",
    key: keyof SubstanceProps,
    value: number
  ) => {
    setParams((prev) => ({
      ...prev,
      [substance === "A" ? "substanceA" : "substanceB"]: {
        ...prev[substance === "A" ? "substanceA" : "substanceB"],
        [key]: value,
      },
    }));
  };

  const handleInteractionChange = (from: CellKey, to: CellKey, value: number) => {
    setParams((prev) => ({
      ...prev,
      interaction: {
        ...prev.interaction,
        [from]: {
          ...prev.interaction[from],
          [to]: value,
        },
        // Keep symmetric
        [to]: {
          ...prev.interaction[to],
          [from]: value,
        },
      },
    }));
  };

  const handleFixedSubstanceChange = (
    substance: "wall" | "air",
    key: keyof FixedSubstanceProps,
    value: number
  ) => {
    setParams((prev) => ({
      ...prev,
      [substance]: {
        ...prev[substance],
        [key]: value,
      },
    }));
  };

  const handleReset = () => {
    setRunning(false);
    initGrid();
  };

  const handleResetParams = () => {
    setParams(DEFAULT_PARAMS);
  };

  return (
    <div className="h-screen bg-[#0d1117] text-gray-100 flex overflow-hidden">
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
        onSubstanceChange={handleSubstanceChange}
        onFixedSubstanceChange={handleFixedSubstanceChange}
        onInteractionChange={handleInteractionChange}
        onToggleRunning={() => setRunning(!running)}
        onReset={handleReset}
        onResetParams={handleResetParams}
        onToggleShowTemp={setShowTemp}
      />
    </div>
  );
}
