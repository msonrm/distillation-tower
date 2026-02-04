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
  boilingPoint: number;           // temperature at which phase transition occurs
  latentHeatThreshold: number;    // latent heat needed for phase change
  liquidDensity: number;          // liquid density (affects gravity)
  gasDensity: number;             // gas density (much lower than liquid)
  liquidThermalConductivity: number;  // how fast heat spreads in liquid
  gasThermalConductivity: number;     // how fast heat spreads in gas
  liquidHeatCapacity: number;     // resistance to temperature change in liquid
  gasHeatCapacity: number;        // resistance to temperature change in gas
}

// Wall and air properties
export interface FixedSubstanceProps {
  thermalConductivity: number;
  heatCapacity: number;
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
  wall: FixedSubstanceProps;
  air: FixedSubstanceProps;
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
  liquidDensity: 0.7,
  gasDensity: 0.01,
  liquidThermalConductivity: 0.5,
  gasThermalConductivity: 0.1,
  liquidHeatCapacity: 0.4,
  gasHeatCapacity: 0.2,
};

export const DEFAULT_SUBSTANCE_B: SubstanceProps = {
  boilingPoint: 0.85,
  latentHeatThreshold: 0.5,
  liquidDensity: 0.9,
  gasDensity: 0.01,
  liquidThermalConductivity: 0.6,
  gasThermalConductivity: 0.1,
  liquidHeatCapacity: 0.6,
  gasHeatCapacity: 0.3,
};

export const DEFAULT_WALL: FixedSubstanceProps = {
  thermalConductivity: 0.8,
  heatCapacity: 1.0,
};

export const DEFAULT_AIR: FixedSubstanceProps = {
  thermalConductivity: 0.05,
  heatCapacity: 0.05,
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
  wall: DEFAULT_WALL,
  air: DEFAULT_AIR,
  interfaceTension: DEFAULT_INTERFACE_TENSION,
};
