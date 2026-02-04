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

export const DEFAULT_PARAMS: SimParams = {
  gridWidth: 100,
  gridHeight: 100,
  roomTemp: 0.0,
  heatSourceTemp: 1.0,
  coolingCoefficient: 0.02,
  gravity: 2.0,
  substanceA: DEFAULT_SUBSTANCE_A,
  substanceB: DEFAULT_SUBSTANCE_B,
};
