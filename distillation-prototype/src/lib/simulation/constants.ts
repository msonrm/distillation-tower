import { Substance, Phase } from "./types";

// Cell key for lookup: "substance:phase"
export function getCellKey(substance: Substance, phase: Phase): string {
  return `${substance}:${phase}`;
}

// Fixed properties for wall and air
export const WALL_THERMAL_CONDUCTIVITY = 0.8;  // conducts heat well
export const WALL_HEAT_CAPACITY = 1.0;

export const AIR_THERMAL_CONDUCTIVITY = 0.05;  // insulator
export const AIR_HEAT_CAPACITY = 0.05;
export const AIR_DENSITY = 0.01;

// Cohesion (how much same-type cells want to stick together)
export const COHESION: Record<string, number> = {
  "A:liquid": 0.6,
  "A:gas": 0.1,
  "B:liquid": 0.8,
  "B:gas": 0.1,
  "wall:liquid": 1.0,
  "air:gas": 0.0,
};

// Colors for rendering
export const COLORS: Record<string, string> = {
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
