import { Cell, CellType, CellTypeValue, SimParams, SimStats } from "./types";
import {
  COHESION,
  DENSITY,
  INTERFACE_TENSION,
  THERMAL_CONDUCTIVITY,
} from "./constants";

/**
 * Create initial grid with walls, heat/cold sources, and water
 */
export function createGrid(params: SimParams): Cell[][] {
  const { gridWidth, gridHeight, heatSourceTemp, coldSourceTemp, roomTemp } =
    params;
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

/**
 * Get 4-connected neighbors
 */
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

/**
 * Calculate Hamiltonian energy at a cell
 */
function calculateEnergy(
  grid: Cell[][],
  x: number,
  y: number,
  params: SimParams
): number {
  const cell = grid[y][x];
  if (
    cell.type === CellType.WALL ||
    cell.type === CellType.HEAT_SOURCE ||
    cell.type === CellType.COLD_SOURCE
  ) {
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

/**
 * Update temperature via heat diffusion
 */
export function updateTemperature(grid: Cell[][], params: SimParams): void {
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
        deltaT +=
          kEffective *
          (neighbor.temperature - cell.temperature) *
          params.thermalConductivity *
          0.1;
      }

      tempChanges[y][x] = deltaT;
    }
  }

  // Apply temperature changes
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if (
        grid[y][x].type !== CellType.HEAT_SOURCE &&
        grid[y][x].type !== CellType.COLD_SOURCE
      ) {
        grid[y][x].temperature = Math.max(
          0,
          Math.min(300, grid[y][x].temperature + tempChanges[y][x])
        );
      }
    }
  }
}

/**
 * Phase transition: vaporization and condensation
 */
export function updatePhaseTransition(
  grid: Cell[][],
  params: SimParams,
  parity: number
): void {
  const {
    gridWidth,
    gridHeight,
    boilingPoint,
    vaporizeRate,
    condenseRate,
    latentHeatVaporize,
    latentHeatCondense,
  } = params;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      if ((x + y) % 2 !== parity) continue;

      const cell = grid[y][x];

      // Vaporization: liquid -> vapor
      if (cell.type === CellType.WATER && cell.temperature > boilingPoint) {
        const prob =
          Math.min(1, (cell.temperature - boilingPoint) / 50) * vaporizeRate;
        if (Math.random() < prob) {
          grid[y][x].type = CellType.VAPOR;
          grid[y][x].temperature -= latentHeatVaporize;
        }
      }

      // Condensation: vapor -> liquid
      if (cell.type === CellType.VAPOR && cell.temperature < boilingPoint) {
        const prob =
          Math.min(1, (boilingPoint - cell.temperature) / 30) * condenseRate;
        if (Math.random() < prob) {
          grid[y][x].type = CellType.WATER;
          grid[y][x].temperature += latentHeatCondense;
        }
      }
    }
  }
}

/**
 * Kawasaki dynamics: exchange cells based on energy
 */
export function updateKawasaki(
  grid: Cell[][],
  params: SimParams,
  parity: number
): void {
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
          calculateEnergy(grid, x, y, params) +
          calculateEnergy(grid, nx, ny, params);

        // Temporarily swap
        [grid[y][x].type, grid[ny][nx].type] = [
          grid[ny][nx].type,
          grid[y][x].type,
        ];

        // Calculate energy after exchange
        const energyAfter =
          calculateEnergy(grid, x, y, params) +
          calculateEnergy(grid, nx, ny, params);

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
          [grid[y][x].type, grid[ny][nx].type] = [
            grid[ny][nx].type,
            grid[y][x].type,
          ];
        } else {
          break; // Successful exchange, move to next cell
        }
      }
    }
  }
}

/**
 * Calculate statistics from grid
 */
export function calculateStats(grid: Cell[][]): SimStats {
  let water = 0;
  let vapor = 0;
  let totalTemp = 0;
  let tempCount = 0;

  for (const row of grid) {
    for (const cell of row) {
      if (cell.type === CellType.WATER) water++;
      if (cell.type === CellType.VAPOR) vapor++;
      if (
        cell.type !== CellType.WALL &&
        cell.type !== CellType.HEAT_SOURCE &&
        cell.type !== CellType.COLD_SOURCE
      ) {
        totalTemp += cell.temperature;
        tempCount++;
      }
    }
  }

  return {
    water,
    vapor,
    avgTemp: tempCount > 0 ? Math.round(totalTemp / tempCount) : 0,
  };
}

/**
 * Run one simulation step
 */
export function simulateStep(grid: Cell[][], params: SimParams, frame: number): void {
  const parity = frame % 2;

  updateTemperature(grid, params);
  updatePhaseTransition(grid, params, parity);

  // Multiple Kawasaki iterations per frame
  for (let i = 0; i < 3; i++) {
    updateKawasaki(grid, params, parity);
  }
}
