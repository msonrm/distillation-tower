"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// =============================================================================
// Types & Constants
// =============================================================================

const CellType = {
  EMPTY: 0,
  WATER: 1,
  VAPOR: 2,
  WALL: 3,
  HEAT_SOURCE: 4,
  COLD_SOURCE: 5,
} as const;

type CellTypeValue = (typeof CellType)[keyof typeof CellType];

interface Cell {
  type: CellTypeValue;
  temperature: number;
}

interface SimParams {
  gridWidth: number;
  gridHeight: number;
  gravity: number;
  boilingPoint: number;
  vaporizeRate: number;
  condenseRate: number;
  thermalConductivity: number;
  heatSourceTemp: number;
  coldSourceTemp: number;
  roomTemp: number;
  latentHeatVaporize: number;
  latentHeatCondense: number;
}

const DEFAULT_PARAMS: SimParams = {
  gridWidth: 100,
  gridHeight: 100,
  gravity: 2.0,
  boilingPoint: 100,
  vaporizeRate: 0.15,
  condenseRate: 0.08,
  thermalConductivity: 0.3,
  heatSourceTemp: 200,
  coldSourceTemp: 15,
  roomTemp: 25,
  latentHeatVaporize: 20,
  latentHeatCondense: 15,
};

// Interface tension matrix (simplified for single liquid)
const INTERFACE_TENSION: Record<number, Record<number, number>> = {
  [CellType.EMPTY]: { [CellType.EMPTY]: 0, [CellType.WATER]: 1.2, [CellType.VAPOR]: 0.2 },
  [CellType.WATER]: { [CellType.EMPTY]: 1.2, [CellType.WATER]: 0, [CellType.VAPOR]: 0.3 },
  [CellType.VAPOR]: { [CellType.EMPTY]: 0.2, [CellType.WATER]: 0.3, [CellType.VAPOR]: 0 },
};

const DENSITY: Record<number, number> = {
  [CellType.EMPTY]: 0,
  [CellType.WATER]: 1.0,
  [CellType.VAPOR]: 0.0001,
  [CellType.WALL]: Infinity,
  [CellType.HEAT_SOURCE]: Infinity,
  [CellType.COLD_SOURCE]: Infinity,
};

const COHESION: Record<number, number> = {
  [CellType.EMPTY]: 0,
  [CellType.WATER]: 0.8,
  [CellType.VAPOR]: 0.1,
};

const THERMAL_CONDUCTIVITY: Record<number, number> = {
  [CellType.EMPTY]: 0.01,
  [CellType.WATER]: 0.6,
  [CellType.VAPOR]: 0.02,
  [CellType.WALL]: 0.8,
  [CellType.HEAT_SOURCE]: 1.0,
  [CellType.COLD_SOURCE]: 1.0,
};

// =============================================================================
// Simulation Engine
// =============================================================================

function createGrid(params: SimParams): Cell[][] {
  const { gridWidth, gridHeight, heatSourceTemp, coldSourceTemp, roomTemp } = params;
  const grid: Cell[][] = [];

  for (let y = 0; y < gridHeight; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < gridWidth; x++) {
      let type: CellTypeValue = CellType.EMPTY;
      let temperature = roomTemp;

      // Top row: cold source
      if (y === 0) {
        type = CellType.COLD_SOURCE;
        temperature = coldSourceTemp;
      }
      // Bottom row: heat source in center, wall on sides
      else if (y === gridHeight - 1) {
        if (x > gridWidth * 0.3 && x < gridWidth * 0.7) {
          type = CellType.HEAT_SOURCE;
          temperature = heatSourceTemp;
        } else {
          type = CellType.WALL;
          temperature = roomTemp;
        }
      }
      // Side walls
      else if (x === 0 || x === gridWidth - 1) {
        type = CellType.WALL;
        temperature = roomTemp;
      }
      // Water pool at bottom
      else if (y > gridHeight - 15 && y < gridHeight - 1) {
        if (Math.random() < 0.7) {
          type = CellType.WATER;
          temperature = roomTemp;
        }
      }

      row.push({ type, temperature });
    }
    grid.push(row);
  }

  return grid;
}

function getNeighbors(
  grid: Cell[][],
  x: number,
  y: number
): { cell: Cell; x: number; y: number }[] {
  const neighbors: { cell: Cell; x: number; y: number }[] = [];
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];

  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
      neighbors.push({ cell: grid[ny][nx], x: nx, y: ny });
    }
  }

  return neighbors;
}

function calculateEnergy(
  grid: Cell[][],
  x: number,
  y: number,
  params: SimParams
): number {
  const cell = grid[y][x];
  if (cell.type === CellType.WALL || cell.type === CellType.HEAT_SOURCE || cell.type === CellType.COLD_SOURCE) {
    return Infinity;
  }

  const density = DENSITY[cell.type] ?? 0;
  const cohesion = COHESION[cell.type] ?? 0;

  // Gravity energy (heavy things want to be low)
  const gravityEnergy = density * (params.gridHeight - y) * params.gravity;

  // Cohesion energy (same types want to be together)
  const neighbors = getNeighbors(grid, x, y);
  let sameTypeCount = 0;
  let interfaceEnergy = 0;

  for (const { cell: neighbor } of neighbors) {
    if (neighbor.type === cell.type) {
      sameTypeCount++;
    }
    const tension = INTERFACE_TENSION[cell.type]?.[neighbor.type] ?? 0.5;
    interfaceEnergy += tension * 0.8;
  }

  const cohesionEnergy = -cohesion * 0.5 * sameTypeCount;

  return gravityEnergy + cohesionEnergy + interfaceEnergy;
}

function updateTemperature(grid: Cell[][], params: SimParams): void {
  const { gridWidth, gridHeight, heatSourceTemp, coldSourceTemp } = params;
  const tempChanges: number[][] = grid.map((row) => row.map(() => 0));

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = grid[y][x];

      // Fixed temperature sources
      if (cell.type === CellType.HEAT_SOURCE) {
        grid[y][x].temperature = heatSourceTemp;
        continue;
      }
      if (cell.type === CellType.COLD_SOURCE) {
        grid[y][x].temperature = coldSourceTemp;
        continue;
      }

      const neighbors = getNeighbors(grid, x, y);
      let deltaT = 0;

      for (const { cell: neighbor } of neighbors) {
        const kSelf = THERMAL_CONDUCTIVITY[cell.type] ?? 0.1;
        const kNeighbor = THERMAL_CONDUCTIVITY[neighbor.type] ?? 0.1;
        const kEffective = (kSelf + kNeighbor) / 2;
        deltaT += kEffective * (neighbor.temperature - cell.temperature) * params.thermalConductivity * 0.1;
      }

      tempChanges[y][x] = deltaT;
    }
  }

  // Apply temperature changes
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x].type !== CellType.HEAT_SOURCE && grid[y][x].type !== CellType.COLD_SOURCE) {
        grid[y][x].temperature = Math.max(0, Math.min(300, grid[y][x].temperature + tempChanges[y][x]));
      }
    }
  }
}

function updatePhaseTransition(grid: Cell[][], params: SimParams, parity: number): void {
  const { gridWidth, gridHeight, boilingPoint, vaporizeRate, condenseRate, latentHeatVaporize, latentHeatCondense } = params;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if ((x + y) % 2 !== parity) continue;

      const cell = grid[y][x];

      // Vaporization: liquid -> vapor
      if (cell.type === CellType.WATER && cell.temperature > boilingPoint) {
        const prob = Math.min(1, (cell.temperature - boilingPoint) / 50) * vaporizeRate;
        if (Math.random() < prob) {
          grid[y][x].type = CellType.VAPOR;
          grid[y][x].temperature -= latentHeatVaporize;
        }
      }

      // Condensation: vapor -> liquid
      if (cell.type === CellType.VAPOR && cell.temperature < boilingPoint) {
        const prob = Math.min(1, (boilingPoint - cell.temperature) / 30) * condenseRate;
        if (Math.random() < prob) {
          grid[y][x].type = CellType.WATER;
          grid[y][x].temperature += latentHeatCondense;
        }
      }
    }
  }
}

function updateKawasaki(grid: Cell[][], params: SimParams, parity: number): void {
  const { gridWidth, gridHeight } = params;
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  // Randomize scan direction
  const startDir = Math.floor(Math.random() * 4);

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if ((x + y) % 2 !== parity) continue;

      const cell = grid[y][x];
      if (
        cell.type === CellType.WALL ||
        cell.type === CellType.HEAT_SOURCE ||
        cell.type === CellType.COLD_SOURCE
      ) {
        continue;
      }

      // Try exchange with random neighbor
      for (let i = 0; i < 4; i++) {
        const [dx, dy] = directions[(startDir + i) % 4];
        const nx = x + dx;
        const ny = y + dy;

        if (ny < 0 || ny >= gridHeight || nx < 0 || nx >= gridWidth) continue;

        const neighbor = grid[ny][nx];
        if (
          neighbor.type === CellType.WALL ||
          neighbor.type === CellType.HEAT_SOURCE ||
          neighbor.type === CellType.COLD_SOURCE
        ) {
          continue;
        }

        if (cell.type === neighbor.type) continue;

        // Calculate energy before exchange
        const energyBefore =
          calculateEnergy(grid, x, y, params) + calculateEnergy(grid, nx, ny, params);

        // Temporarily swap
        [grid[y][x].type, grid[ny][nx].type] = [grid[ny][nx].type, grid[y][x].type];

        // Calculate energy after exchange
        const energyAfter =
          calculateEnergy(grid, x, y, params) + calculateEnergy(grid, nx, ny, params);

        const deltaE = energyAfter - energyBefore;
        const localTemp = (cell.temperature + neighbor.temperature) / 2;
        const beta = 1 / (localTemp * 0.1 + 1);

        let accept = false;
        if (deltaE < 0) {
          accept = true;
        } else {
          accept = Math.random() < Math.exp(-beta * deltaE);
        }

        if (!accept) {
          // Revert swap
          [grid[y][x].type, grid[ny][nx].type] = [grid[ny][nx].type, grid[y][x].type];
        } else {
          break; // Successful exchange, move to next cell
        }
      }
    }
  }
}

// =============================================================================
// React Component
// =============================================================================

const COLORS: Record<number, string> = {
  [CellType.EMPTY]: "#0d1117",
  [CellType.WATER]: "#3b82f6",
  [CellType.VAPOR]: "#93c5fd",
  [CellType.WALL]: "#374151",
  [CellType.HEAT_SOURCE]: "#ef4444",
  [CellType.COLD_SOURCE]: "#06b6d4",
};

function temperatureToColor(temp: number, baseColor: string): string {
  // Blend towards red for hot, blue for cold
  const normalized = Math.max(0, Math.min(1, (temp - 20) / 180));
  
  if (baseColor === COLORS[CellType.WATER] || baseColor === COLORS[CellType.VAPOR]) {
    const r = Math.floor(59 + normalized * 180);
    const g = Math.floor(130 - normalized * 80);
    const b = Math.floor(246 - normalized * 150);
    return `rgb(${r},${g},${b})`;
  }
  
  return baseColor;
}

export default function DistillationPrototype() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Cell[][] | null>(null);
  const animationRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const [running, setRunning] = useState(false);
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [showTemp, setShowTemp] = useState(true);
  const [stats, setStats] = useState({ water: 0, vapor: 0, avgTemp: 0 });

  const cellSize = Math.min(
    (typeof window !== "undefined" ? Math.min(window.innerWidth - 320, 600) : 600) / params.gridWidth,
    (typeof window !== "undefined" ? window.innerHeight - 100 : 500) / params.gridHeight
  );

  const initGrid = useCallback(() => {
    gridRef.current = createGrid(params);
    frameRef.current = 0;
  }, [params]);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas || !grid) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let waterCount = 0;
    let vaporCount = 0;
    let totalTemp = 0;
    let tempCount = 0;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        let color = COLORS[cell.type] ?? "#000";

        if (showTemp && (cell.type === CellType.WATER || cell.type === CellType.VAPOR || cell.type === CellType.EMPTY)) {
          color = temperatureToColor(cell.temperature, color);
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        if (cell.type === CellType.WATER) waterCount++;
        if (cell.type === CellType.VAPOR) vaporCount++;
        if (cell.type !== CellType.WALL && cell.type !== CellType.HEAT_SOURCE && cell.type !== CellType.COLD_SOURCE) {
          totalTemp += cell.temperature;
          tempCount++;
        }
      }
    }

    setStats({
      water: waterCount,
      vapor: vaporCount,
      avgTemp: tempCount > 0 ? Math.round(totalTemp / tempCount) : 0,
    });
  }, [cellSize, showTemp]);

  const simulate = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const parity = frameRef.current % 2;

    updateTemperature(grid, params);
    updatePhaseTransition(grid, params, parity);

    // Multiple Kawasaki iterations per frame
    for (let i = 0; i < 3; i++) {
      updateKawasaki(grid, params, parity);
    }

    frameRef.current++;
    render();

    if (running) {
      animationRef.current = requestAnimationFrame(simulate);
    }
  }, [params, render, running]);

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

  useEffect(() => {
    render();
  }, [render]);

  const handleParamChange = (key: keyof SimParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex">
      {/* Simulation Canvas */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={params.gridWidth * cellSize}
            height={params.gridHeight * cellSize}
            className="border border-gray-700 rounded"
          />
          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono">
            Frame: {frameRef.current} | Water: {stats.water} | Vapor: {stats.vapor} | Avg Temp: {stats.avgTemp}°
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-80 bg-[#161b22] border-l border-gray-800 p-4 overflow-y-auto">
        <h1 className="text-xl font-bold mb-4 text-cyan-400">蒸留プロトタイプ</h1>

        {/* Control Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setRunning(!running)}
            className={`flex-1 py-2 px-4 rounded font-medium transition ${
              running
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {running ? "停止" : "開始"}
          </button>
          <button
            onClick={() => {
              setRunning(false);
              initGrid();
              render();
            }}
            className="flex-1 py-2 px-4 rounded font-medium bg-gray-600 hover:bg-gray-700 transition"
          >
            リセット
          </button>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={showTemp}
            onChange={(e) => setShowTemp(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">温度を色で表示</span>
        </label>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-1">
            温度設定
          </h2>

          <ParamSlider
            label="熱源温度"
            value={params.heatSourceTemp}
            min={100}
            max={300}
            onChange={(v) => handleParamChange("heatSourceTemp", v)}
          />
          <ParamSlider
            label="冷却源温度"
            value={params.coldSourceTemp}
            min={0}
            max={50}
            onChange={(v) => handleParamChange("coldSourceTemp", v)}
          />
          <ParamSlider
            label="室温"
            value={params.roomTemp}
            min={10}
            max={50}
            onChange={(v) => handleParamChange("roomTemp", v)}
          />

          <h2 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-1 mt-6">
            相転移パラメータ
          </h2>

          <ParamSlider
            label="沸点"
            value={params.boilingPoint}
            min={50}
            max={150}
            onChange={(v) => handleParamChange("boilingPoint", v)}
          />
          <ParamSlider
            label="気化確率"
            value={params.vaporizeRate}
            min={0.01}
            max={0.5}
            step={0.01}
            onChange={(v) => handleParamChange("vaporizeRate", v)}
          />
          <ParamSlider
            label="凝縮確率"
            value={params.condenseRate}
            min={0.01}
            max={0.3}
            step={0.01}
            onChange={(v) => handleParamChange("condenseRate", v)}
          />
          <ParamSlider
            label="気化潜熱"
            value={params.latentHeatVaporize}
            min={0}
            max={50}
            onChange={(v) => handleParamChange("latentHeatVaporize", v)}
          />
          <ParamSlider
            label="凝縮潜熱"
            value={params.latentHeatCondense}
            min={0}
            max={50}
            onChange={(v) => handleParamChange("latentHeatCondense", v)}
          />

          <h2 className="text-sm font-semibold text-gray-400 border-b border-gray-700 pb-1 mt-6">
            物理パラメータ
          </h2>

          <ParamSlider
            label="重力"
            value={params.gravity}
            min={0.5}
            max={5}
            step={0.1}
            onChange={(v) => handleParamChange("gravity", v)}
          />
          <ParamSlider
            label="熱伝導率"
            value={params.thermalConductivity}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(v) => handleParamChange("thermalConductivity", v)}
          />
        </div>

        <div className="mt-6 p-3 bg-gray-800 rounded text-xs text-gray-400">
          <p className="mb-2">🔴 赤 = 熱源（下部中央）</p>
          <p className="mb-2">🔵 水色 = 冷却源（上部）</p>
          <p className="mb-2">💧 青 = 水（液体）</p>
          <p>☁️ 薄青 = 水蒸気</p>
        </div>
      </div>
    </div>
  );
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-cyan-400 font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
      />
    </div>
  );
}
