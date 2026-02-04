import { Cell, Substance, Phase, SimParams, SimStats, SubstanceProps, CellKey } from "./types";
import { getCellKey, COHESION } from "./constants";

// =============================================================================
// Helper Functions
// =============================================================================

function getSubstanceProps(cell: Cell, params: SimParams): SubstanceProps | null {
  if (cell.substance === "A") return params.substanceA;
  if (cell.substance === "B") return params.substanceB;
  return null; // wall or air
}

function getDensity(cell: Cell, params: SimParams): number {
  if (cell.substance === "wall") return Infinity;
  if (cell.substance === "air") return 0.01; // Air density is very low, fixed
  const props = getSubstanceProps(cell, params);
  if (!props) return 0;
  return cell.phase === "liquid" ? props.liquidDensity : props.gasDensity;
}

function getThermalConductivity(cell: Cell, params: SimParams): number {
  if (cell.substance === "wall") return params.wall.thermalConductivity;
  if (cell.substance === "air") return params.air.thermalConductivity;
  const props = getSubstanceProps(cell, params);
  if (!props) return 0.1;
  return cell.phase === "liquid" ? props.liquidThermalConductivity : props.gasThermalConductivity;
}

function getHeatCapacity(cell: Cell, params: SimParams): number {
  if (cell.substance === "wall") return params.wall.heatCapacity;
  if (cell.substance === "air") return params.air.heatCapacity;
  const props = getSubstanceProps(cell, params);
  if (!props) return 0.5;
  return cell.phase === "liquid" ? props.liquidHeatCapacity : props.gasHeatCapacity;
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

// =============================================================================
// Grid Creation
// =============================================================================

export function createGrid(params: SimParams): Cell[][] {
  const { gridWidth, gridHeight, roomTemp } = params;
  const grid: Cell[][] = [];

  for (let y = 0; y < gridHeight; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < gridWidth; x++) {
      let cell: Cell = {
        substance: "air",
        phase: "gas",
        temperature: roomTemp,
        latentHeat: 0,
      };

      // Bottom row: wall (heat source is simulated by high temp wall)
      if (y === gridHeight - 1) {
        cell = {
          substance: "wall",
          phase: "liquid", // wall uses liquid phase for simplicity
          temperature: params.heatSourceTemp,
          latentHeat: 0,
        };
      }
      // Top row: wall (cold)
      else if (y === 0) {
        cell = {
          substance: "wall",
          phase: "liquid",
          temperature: roomTemp,
          latentHeat: 0,
        };
      }
      // Side walls
      else if (x === 0 || x === gridWidth - 1) {
        cell = {
          substance: "wall",
          phase: "liquid",
          temperature: roomTemp,
          latentHeat: 0,
        };
      }
      // Liquid pool at bottom (~1/3 of grid)
      // Mix of substance A and B
      else if (y > gridHeight * 0.65 && y < gridHeight - 1) {
        if (Math.random() < 0.9) {
          cell = {
            substance: Math.random() < 0.4 ? "A" : "B", // 40% A, 60% B
            phase: "liquid",
            temperature: roomTemp,
            latentHeat: 0,
          };
        }
      }

      row.push(cell);
    }
    grid.push(row);
  }

  return grid;
}

// =============================================================================
// Step 1: Heat Input + Natural Cooling
// =============================================================================

function updateHeatAndCooling(grid: Cell[][], params: SimParams): void {
  const { gridWidth, gridHeight, roomTemp, coolingCoefficient } = params;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = grid[y][x];

      // Skip walls (they maintain their temperature)
      if (cell.substance === "wall") continue;

      // Natural cooling: temperature drifts toward room temp
      const tempDiff = cell.temperature - roomTemp;
      cell.temperature -= tempDiff * coolingCoefficient;
    }
  }
}

// =============================================================================
// Step 2: Heat Conduction (Fourier's Law)
// =============================================================================

function updateHeatConduction(grid: Cell[][], params: SimParams): void {
  const { gridWidth, gridHeight } = params;
  const tempChanges: number[][] = grid.map((row) => row.map(() => 0));

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = grid[y][x];

      // Walls conduct heat but their source cells maintain temperature
      if (cell.substance === "wall" && (y === 0 || y === gridHeight - 1)) {
        continue; // Top/bottom walls are fixed temperature
      }

      const neighbors = getNeighbors(grid, x, y);
      const kSelf = getThermalConductivity(cell, params);
      const cSelf = getHeatCapacity(cell, params);

      let deltaT = 0;
      for (const { cell: neighbor } of neighbors) {
        const kNeighbor = getThermalConductivity(neighbor, params);
        // Effective conductivity between two cells
        const kEffective = (2 * kSelf * kNeighbor) / (kSelf + kNeighbor + 0.001);
        // Heat flow based on temperature difference
        const heatFlow = kEffective * (neighbor.temperature - cell.temperature);
        // Temperature change depends on heat capacity
        deltaT += heatFlow / (cSelf + 0.1);
      }

      tempChanges[y][x] = deltaT * 0.1; // Damping factor for stability
    }
  }

  // Apply temperature changes
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = grid[y][x];
      if (cell.substance === "wall" && (y === 0 || y === gridHeight - 1)) {
        continue;
      }
      cell.temperature = Math.max(0, Math.min(1, cell.temperature + tempChanges[y][x]));
    }
  }
}

// =============================================================================
// Step 3: Phase Transition (Latent Heat Model)
// =============================================================================

function updatePhaseTransition(grid: Cell[][], params: SimParams): void {
  const { gridWidth, gridHeight } = params;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = grid[y][x];

      // Only A and B substances undergo phase transition
      if (cell.substance !== "A" && cell.substance !== "B") continue;

      const props = getSubstanceProps(cell, params);
      if (!props) continue;

      if (cell.phase === "liquid") {
        // Vaporization: liquid above boiling point accumulates latent heat
        if (cell.temperature >= props.boilingPoint) {
          const excess = cell.temperature - props.boilingPoint;
          cell.latentHeat += excess;
          cell.temperature = props.boilingPoint; // Cap at boiling point

          // Phase change when latent heat threshold reached
          if (cell.latentHeat >= props.latentHeatThreshold) {
            cell.phase = "gas";
            cell.latentHeat = props.latentHeatThreshold; // Keep at threshold
          }
        }
      } else {
        // Condensation: gas below boiling point releases latent heat
        if (cell.temperature < props.boilingPoint) {
          const deficit = props.boilingPoint - cell.temperature;
          cell.latentHeat -= deficit;
          cell.temperature = props.boilingPoint; // Cap at boiling point

          // Phase change when latent heat depleted
          if (cell.latentHeat <= 0) {
            cell.phase = "liquid";
            cell.latentHeat = 0;
          }
        }
      }
    }
  }
}

// =============================================================================
// Step 4: Kawasaki Dynamics (Cell Exchange)
// =============================================================================

function calculateEnergy(
  grid: Cell[][],
  x: number,
  y: number,
  params: SimParams
): number {
  const cell = grid[y][x];

  // Walls don't move
  if (cell.substance === "wall") return Infinity;

  const density = getDensity(cell, params);
  const cellKey = getCellKey(cell.substance, cell.phase);
  const cohesion = COHESION[cellKey] ?? 0;

  // Gravity energy (heavy things want to be low)
  const gravityEnergy = density * (params.gridHeight - y) * params.gravity;

  // Cohesion and interface energy
  const neighbors = getNeighbors(grid, x, y);
  let sameTypeCount = 0;
  let interfaceEnergy = 0;

  for (const { cell: neighbor } of neighbors) {
    const neighborKey = getCellKey(neighbor.substance, neighbor.phase);

    if (neighbor.substance === cell.substance && neighbor.phase === cell.phase) {
      sameTypeCount++;
    }

    const tension = params.interfaceTension[cellKey as CellKey]?.[neighborKey as CellKey] ?? 0.5;
    interfaceEnergy += tension * 0.8;
  }

  const cohesionEnergy = -cohesion * 0.5 * sameTypeCount;

  return gravityEnergy + cohesionEnergy + interfaceEnergy;
}

function updateKawasaki(grid: Cell[][], params: SimParams, parity: number): void {
  const { gridWidth, gridHeight } = params;
  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  // Randomize grid scan direction to prevent bias
  const scanPattern = Math.floor(Math.random() * 4);
  const reverseY = scanPattern & 1;
  const reverseX = scanPattern & 2;

  for (let yi = 0; yi < gridHeight; yi++) {
    for (let xi = 0; xi < gridWidth; xi++) {
      const y = reverseY ? gridHeight - 1 - yi : yi;
      const x = reverseX ? gridWidth - 1 - xi : xi;
      if ((x + y) % 2 !== parity) continue;

      const cell = grid[y][x];

      // Skip walls
      if (cell.substance === "wall") continue;

      // Randomize neighbor direction per cell
      const startDir = Math.floor(Math.random() * 4);

      // Try exchange with neighbors
      for (let i = 0; i < 4; i++) {
        const [dx, dy] = directions[(startDir + i) % 4];
        const nx = x + dx;
        const ny = y + dy;

        if (ny < 0 || ny >= gridHeight || nx < 0 || nx >= gridWidth) continue;

        const neighbor = grid[ny][nx];

        // Can't swap with walls
        if (neighbor.substance === "wall") continue;

        // Skip if same type
        if (cell.substance === neighbor.substance && cell.phase === neighbor.phase) continue;

        // Calculate energy before exchange
        const energyBefore =
          calculateEnergy(grid, x, y, params) +
          calculateEnergy(grid, nx, ny, params);

        // Temporarily swap cells
        const temp = { ...grid[y][x] };
        grid[y][x] = { ...grid[ny][nx] };
        grid[ny][nx] = temp;

        // Calculate energy after exchange
        const energyAfter =
          calculateEnergy(grid, x, y, params) +
          calculateEnergy(grid, nx, ny, params);

        const deltaE = energyAfter - energyBefore;
        const localTemp = (cell.temperature + neighbor.temperature) / 2 + 0.1;
        const beta = 1 / (localTemp * 0.5 + 0.1);

        let accept = false;
        if (deltaE < 0) {
          accept = true;
        } else {
          accept = Math.random() < Math.exp(-beta * deltaE);
        }

        if (!accept) {
          // Revert swap
          const revert = { ...grid[y][x] };
          grid[y][x] = { ...grid[ny][nx] };
          grid[ny][nx] = revert;
        } else {
          break; // Successful exchange, move to next cell
        }
      }
    }
  }
}

// =============================================================================
// Main Simulation Step
// =============================================================================

export function simulateStep(grid: Cell[][], params: SimParams, frame: number): void {
  const parity = frame % 2;

  // Step 1: Heat input + natural cooling
  updateHeatAndCooling(grid, params);

  // Step 2: Heat conduction
  updateHeatConduction(grid, params);

  // Step 3: Phase transition
  updatePhaseTransition(grid, params);

  // Step 4: Kawasaki exchange (multiple iterations)
  for (let i = 0; i < 2; i++) {
    updateKawasaki(grid, params, parity);
  }
}

// =============================================================================
// Statistics
// =============================================================================

export function calculateStats(grid: Cell[][]): SimStats {
  let liquidA = 0;
  let liquidB = 0;
  let gasA = 0;
  let gasB = 0;
  let totalTemp = 0;
  let tempCount = 0;

  for (const row of grid) {
    for (const cell of row) {
      if (cell.substance === "A") {
        if (cell.phase === "liquid") liquidA++;
        else gasA++;
      }
      if (cell.substance === "B") {
        if (cell.phase === "liquid") liquidB++;
        else gasB++;
      }
      if (cell.substance !== "wall") {
        totalTemp += cell.temperature;
        tempCount++;
      }
    }
  }

  return {
    liquidA,
    liquidB,
    gasA,
    gasB,
    avgTemp: tempCount > 0 ? totalTemp / tempCount : 0,
    fps: 0, // Will be set by the UI
  };
}
