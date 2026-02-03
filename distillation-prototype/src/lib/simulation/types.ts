// Cell types
export const CellType = {
  EMPTY: 0,
  WATER: 1,
  VAPOR: 2,
  WALL: 3,
  HEAT_SOURCE: 4,
  COLD_SOURCE: 5,
} as const;

export type CellTypeValue = (typeof CellType)[keyof typeof CellType];

export interface Cell {
  type: CellTypeValue;
  temperature: number;
}

export interface SimParams {
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

export interface SimStats {
  water: number;
  vapor: number;
  avgTemp: number;
}
