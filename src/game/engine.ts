import type { GameState, Building } from './schema';

// Master configuration for resource generation rates (per hour)
const CONFIG = {
  GoldMine: { baseRate: 1000, multiplierPerLevel: 1.5, maxStorage: 10000 },
  ElixirCollector: { baseRate: 1000, multiplierPerLevel: 1.5, maxStorage: 10000 },
};

/**
 * Calculates offline progress purely mathematically using timestamp deltas.
 * This guarantees deterministic server-authoritative state without ticking in the background.
 */
export const calculateOfflineDelta = (state: GameState, currentTimestamp: number): GameState => {
  const offlineMs = currentTimestamp - state.player.lastLoginTimestamp;
  if (offlineMs <= 0) return state;

  const offlineHours = offlineMs / (1000 * 60 * 60);

  // Deep clone state to ensure pure function
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  // 1. Process Building Upgrades that finished while offline
  newState.village.buildings.forEach((building: Building) => {
    if (building.isUpgrading && building.upgradeFinishTimestamp) {
      if (currentTimestamp >= building.upgradeFinishTimestamp) {
        // Upgrade complete!
        building.isUpgrading = false;
        building.level += 1;
        building.upgradeFinishTimestamp = undefined;
      }
    }
  });

  // 2. Process Resource Generation
  let generatedGold = 0;
  let generatedElixir = 0;

  newState.village.buildings.forEach((building: Building) => {
    // Only generate if it's not upgrading
    if (!building.isUpgrading) {
      if (building.type === 'GoldMine') {
        const rate = CONFIG.GoldMine.baseRate * Math.pow(CONFIG.GoldMine.multiplierPerLevel, building.level - 1);
        generatedGold += rate * offlineHours;
      } else if (building.type === 'ElixirCollector') {
        const rate = CONFIG.ElixirCollector.baseRate * Math.pow(CONFIG.ElixirCollector.multiplierPerLevel, building.level - 1);
        generatedElixir += rate * offlineHours;
      }
    }
  });

  // 3. Update Resources (Capping at a mock max storage for now)
  newState.resources.gold = Math.min(newState.resources.gold + Math.floor(generatedGold), 500000);
  newState.resources.elixir = Math.min(newState.resources.elixir + Math.floor(generatedElixir), 500000);

  // 4. Update Timestamp
  newState.player.lastLoginTimestamp = currentTimestamp;

  return newState;
};
