import { Substance, Phase } from "./types";

// Cell key for lookup: "substance:phase"
// Using string type for flexibility since wall/air only use specific phases
export type CellKey = string;

export function getCellKey(substance: Substance, phase: Phase): CellKey {
  return `${substance}:${phase}`;
}

// Fixed properties for wall and air
export const WALL_THERMAL_CONDUCTIVITY = 0.8;  // conducts heat well
export const WALL_HEAT_CAPACITY = 1.0;

export const AIR_THERMAL_CONDUCTIVITY = 0.05;  // insulator
export const AIR_HEAT_CAPACITY = 0.05;
export const AIR_DENSITY = 0.01;

// Interface tension matrix
// Higher values = stronger repulsion = harder to mix
// Keys: "substance:phase"
export const INTERFACE_TENSION: Record<CellKey, Record<CellKey, number>> = {
  // Liquid A (alcohol-like)
  "A:liquid": {
    "A:liquid": 0.0,
    "A:gas": 0.3,
    "B:liquid": 0.8,   // A and B liquids repel somewhat
    "B:gas": 0.5,
    "wall:liquid": 0.3,
    "air:gas": 1.0,
  },
  // Gas A (alcohol vapor)
  "A:gas": {
    "A:liquid": 0.3,
    "A:gas": 0.0,
    "B:liquid": 0.6,
    "B:gas": 0.2,
    "wall:liquid": 0.3,
    "air:gas": 0.2,
  },
  // Liquid B (water-like)
  "B:liquid": {
    "A:liquid": 0.8,
    "A:gas": 0.6,
    "B:liquid": 0.0,
    "B:gas": 0.3,
    "wall:liquid": 0.3,
    "air:gas": 1.2,
  },
  // Gas B (water vapor)
  "B:gas": {
    "A:liquid": 0.5,
    "A:gas": 0.2,
    "B:liquid": 0.3,
    "B:gas": 0.0,
    "wall:liquid": 0.3,
    "air:gas": 0.2,
  },
  // Wall
  "wall:liquid": {
    "A:liquid": 0.3,
    "A:gas": 0.3,
    "B:liquid": 0.3,
    "B:gas": 0.3,
    "wall:liquid": 0.0,
    "air:gas": 0.3,
  },
  // Air
  "air:gas": {
    "A:liquid": 1.0,
    "A:gas": 0.2,
    "B:liquid": 1.2,
    "B:gas": 0.2,
    "wall:liquid": 0.3,
    "air:gas": 0.0,
  },
};

// Cohesion (how much same-type cells want to stick together)
export const COHESION: Record<CellKey, number> = {
  "A:liquid": 0.6,
  "A:gas": 0.1,
  "B:liquid": 0.8,
  "B:gas": 0.1,
  "wall:liquid": 1.0,
  "air:gas": 0.0,
};

// Colors for rendering
export const COLORS: Record<CellKey, string> = {
  "A:liquid": "#f97316",  // orange (alcohol)
  "A:gas": "#fed7aa",     // light orange (alcohol vapor)
  "B:liquid": "#3b82f6",  // blue (water)
  "B:gas": "#93c5fd",     // light blue (water vapor)
  "wall:liquid": "#374151", // gray
  "air:gas": "#0d1117",   // dark background
};

// Temperature-based color blending
export function getTemperatureColor(baseColor: string, temperature: number): string {
  // temperature: 0.0 (cold) to 1.0 (hot)
  // Blend towards red for hot
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const hotness = Math.pow(temperature, 1.5); // non-linear for better visualization
  const newR = Math.min(255, Math.floor(r + (255 - r) * hotness * 0.5));
  const newG = Math.floor(g * (1 - hotness * 0.3));
  const newB = Math.floor(b * (1 - hotness * 0.5));

  return `rgb(${newR},${newG},${newB})`;
}
