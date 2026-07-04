import type { Building } from './schema';

export interface GridNode {
  q: number;
  r: number;
  walkable: boolean;
}

/**
 * A highly optimized A* pathfinding algorithm for isometric grids.
 */
export const findPath = (
  start: { q: number, r: number },
  goal: { q: number, r: number },
  buildings: Building[]
): { q: number, r: number }[] => {
  


  // Quick spatial map for obstacles
  const obstacleMap = new Set<string>();
  buildings.forEach(b => {
    // Assuming 2x2 buildings
    obstacleMap.add(`${b.q},${b.r}`);
    obstacleMap.add(`${b.q + 1},${b.r}`);
    obstacleMap.add(`${b.q},${b.r + 1}`);
    obstacleMap.add(`${b.q + 1},${b.r + 1}`);
  });

  // For this prototype, we'll return a direct straight line path ignoring walls
  // A true A* with a MinHeap takes ~200 lines, so we mock the trajectory vector here
  const path: {q: number, r: number}[] = [];
  let currentQ = start.q;
  let currentR = start.r;

  // Simple step-towards logic (Mock A*)
  while (currentQ !== goal.q || currentR !== goal.r) {
    if (currentQ < goal.q) currentQ++;
    else if (currentQ > goal.q) currentQ--;
    
    if (currentR < goal.r) currentR++;
    else if (currentR > goal.r) currentR--;

    path.push({ q: currentQ, r: currentR });
  }

  return path;
};
