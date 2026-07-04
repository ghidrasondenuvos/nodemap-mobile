import type { Building } from './schema';

export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;

/**
 * Translates an isometric Grid Coordinate (q, r) to 2D Screen Pixels (x, y).
 */
export const gridToScreen = (q: number, r: number): { x: number, y: number } => {
  const x = (q - r) * (TILE_WIDTH / 2);
  const y = (q + r) * (TILE_HEIGHT / 2);
  return { x, y };
};

/**
 * Translates 2D Screen Pixels (x, y) to an isometric Grid Coordinate (q, r).
 */
export const screenToGrid = (x: number, y: number): { q: number, r: number } => {
  const q = (x / (TILE_WIDTH / 2) + y / (TILE_HEIGHT / 2)) / 2;
  const r = (y / (TILE_HEIGHT / 2) - x / (TILE_WIDTH / 2)) / 2;
  return { q: Math.round(q), r: Math.round(r) };
};

/**
 * Validates if a new building can be placed at the target coordinates without overlapping.
 * Assuming all buildings for now are 2x2 tiles.
 */
export const canPlaceBuilding = (
  existingBuildings: Building[],
  q: number,
  r: number,
  width: number = 2,
  height: number = 2
): boolean => {
  for (const b of existingBuildings) {
    // Check rectangle overlap (AABB but in isometric grid space)
    const bWidth = 2; // Hardcoded 2x2 for this prototype
    const bHeight = 2;
    
    if (
      q < b.q + bWidth &&
      q + width > b.q &&
      r < b.r + bHeight &&
      r + height > b.r
    ) {
      return false; // Overlap detected
    }
  }
  return true;
};
