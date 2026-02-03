import { CellType, SimParams } from "./types";

export const DEFAULT_PARAMS: SimParams = {
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

// Interface tension matrix
export const INTERFACE_TENSION: Record<number, Record<number, number>> = {
  [CellType.EMPTY]: {
    [CellType.EMPTY]: 0,
    [CellType.WATER]: 1.2,
    [CellType.VAPOR]: 0.2,
  },
  [CellType.WATER]: {
    [CellType.EMPTY]: 1.2,
    [CellType.WATER]: 0,
    [CellType.VAPOR]: 0.3,
  },
  [CellType.VAPOR]: {
    [CellType.EMPTY]: 0.2,
    [CellType.WATER]: 0.3,
    [CellType.VAPOR]: 0,
  },
};

export const DENSITY: Record<number, number> = {
  [CellType.EMPTY]: 0,
  [CellType.WATER]: 1.0,
  [CellType.VAPOR]: 0.0001,
  [CellType.WALL]: Infinity,
  [CellType.HEAT_SOURCE]: Infinity,
  [CellType.COLD_SOURCE]: Infinity,
};

export const COHESION: Record<number, number> = {
  [CellType.EMPTY]: 0,
  [CellType.WATER]: 0.8,
  [CellType.VAPOR]: 0.1,
};

export const THERMAL_CONDUCTIVITY: Record<number, number> = {
  [CellType.EMPTY]: 0.01,
  [CellType.WATER]: 0.6,
  [CellType.VAPOR]: 0.02,
  [CellType.WALL]: 0.8,
  [CellType.HEAT_SOURCE]: 1.0,
  [CellType.COLD_SOURCE]: 1.0,
};

export const COLORS: Record<number, string> = {
  [CellType.EMPTY]: "#0d1117",
  [CellType.WATER]: "#3b82f6",
  [CellType.VAPOR]: "#93c5fd",
  [CellType.WALL]: "#374151",
  [CellType.HEAT_SOURCE]: "#ef4444",
  [CellType.COLD_SOURCE]: "#06b6d4",
};
