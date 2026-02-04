// Substance types
export type Substance = "A" | "B" | "wall" | "air";
export type Phase = "liquid" | "gas";

// Cell structure
export interface Cell {
  substance: Substance;
  phase: Phase;
  temperature: number;  // 0.0 (room temp) to 1.0 (heat source)
  latentHeat: number;   // accumulated latent heat for phase transition
}

// Substance properties (all values 0-1)
export interface SubstanceProps {
  boilingPoint: number;      // temperature at which phase transition occurs
  latentHeatThreshold: number; // latent heat needed for phase change
  density: number;           // affects gravity/buoyancy
  thermalConductivity: number; // how fast heat spreads
  heatCapacity: number;      // resistance to temperature change
}

// Cell keys for interface tension matrix
export const CELL_KEYS = ["A:liquid", "A:gas", "B:liquid", "B:gas", "wall:liquid", "air:gas"] as const;
export type CellKey = (typeof CELL_KEYS)[number];

// Interface tension matrix type
export type InterfaceTensionMatrix = Record<CellKey, Record<CellKey, number>>;

// Simulation parameters
export interface SimParams {
  gridWidth: number;
  gridHeight: number;
  roomTemp: number;          // 0.0
  heatSourceTemp: number;    // 1.0
  coolingCoefficient: number; // natural cooling rate
  gravity: number;           // strength of gravity in Kawasaki
  substanceA: SubstanceProps;
  substanceB: SubstanceProps;
  interfaceTension: InterfaceTensionMatrix;
}

// Statistics for display
export interface SimStats {
  liquidA: number;
  liquidB: number;
  gasA: number;
  gasB: number;
  avgTemp: number;
  fps: number;
}

// Default substance properties
export const DEFAULT_SUBSTANCE_A: SubstanceProps = {
  boilingPoint: 0.6,
  latentHeatThreshold: 0.3,
  density: 0.7,
  thermalConductivity: 0.5,
  heatCapacity: 0.4,
};

export const DEFAULT_SUBSTANCE_B: SubstanceProps = {
  boilingPoint: 0.85,
  latentHeatThreshold: 0.5,
  density: 0.9,
  thermalConductivity: 0.6,
  heatCapacity: 0.6,
};

// Default interface tension matrix (symmetric)
export const DEFAULT_INTERFACE_TENSION: InterfaceTensionMatrix = {
  "A:liquid": { "A:liquid": 0, "A:gas": 0.3, "B:liquid": 0.8, "B:gas": 0.5, "wall:liquid": 0.3, "air:gas": 1.0 },
  "A:gas":    { "A:liquid": 0.3, "A:gas": 0, "B:liquid": 0.6, "B:gas": 0.2, "wall:liquid": 0.3, "air:gas": 0.2 },
  "B:liquid": { "A:liquid": 0.8, "A:gas": 0.6, "B:liquid": 0, "B:gas": 0.3, "wall:liquid": 0.3, "air:gas": 1.2 },
  "B:gas":    { "A:liquid": 0.5, "A:gas": 0.2, "B:liquid": 0.3, "B:gas": 0, "wall:liquid": 0.3, "air:gas": 0.2 },
  "wall:liquid": { "A:liquid": 0.3, "A:gas": 0.3, "B:liquid": 0.3, "B:gas": 0.3, "wall:liquid": 0, "air:gas": 0.3 },
  "air:gas":  { "A:liquid": 1.0, "A:gas": 0.2, "B:liquid": 1.2, "B:gas": 0.2, "wall:liquid": 0.3, "air:gas": 0 },
};

export const DEFAULT_PARAMS: SimParams = {
  gridWidth: 100,
  gridHeight: 100,
  roomTemp: 0.0,
  heatSourceTemp: 1.0,
  coolingCoefficient: 0.02,
  gravity: 2.0,
  substanceA: DEFAULT_SUBSTANCE_A,
  substanceB: DEFAULT_SUBSTANCE_B,
  interfaceTension: DEFAULT_INTERFACE_TENSION,
};
