/**
 * Deterministic Simulation Engine
 * We use integers multiplied by 1000 (fixed-point math) to prevent floating-point CPU drift.
 */
export const FIXED_MULTIPLIER = 1000;

export const toFixed = (val: number) => Math.floor(val * FIXED_MULTIPLIER);
export const fromFixed = (val: number) => val / FIXED_MULTIPLIER;

export class DeterministicSimulation {
  public tickCount: number = 0;
  // Game runs at exactly 10 ticks per second for combat
  public readonly TICK_RATE_MS = 100; 

  private systems: Array<(tick: number) => void> = [];

  public registerSystem(system: (tick: number) => void) {
    this.systems.push(system);
  }

  /**
   * Called to advance the state deterministically. 
   * In a replay, this is run in a tight loop. In live gameplay, it's called via setTimeout.
   */
  public step() {
    this.tickCount++;
    for (const system of this.systems) {
      system(this.tickCount);
    }
  }

  /**
   * Fast-forward simulation to a specific tick (used for replays or catch-up logic)
   */
  public fastForward(targetTick: number) {
    while (this.tickCount < targetTick) {
      this.step();
    }
  }
}
