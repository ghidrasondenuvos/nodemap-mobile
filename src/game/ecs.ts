import { fromFixed } from './simulation';

// Components
export interface Position { entityId: string; q: number; r: number; }
export interface Health { entityId: string; current: number; max: number; }
export interface Target { entityId: string; targetId: string | null; range: number; }
export interface Velocity { entityId: string; speedFixed: number; } // fixed point speed

// The lightweight ECS Database
export class ECSWorld {
  public positions = new Map<string, Position>();
  public healths = new Map<string, Health>();
  public targets = new Map<string, Target>();
  public velocities = new Map<string, Velocity>();

  public createEntity(_id: string) {
    // Initialize entity hooks if needed
  }
}

// Systems
export const createMovementSystem = (world: ECSWorld) => {
  return (_tick: number) => {
    world.velocities.forEach((vel, entityId) => {
      const pos = world.positions.get(entityId);
      const target = world.targets.get(entityId);

      if (pos && target && target.targetId) {
        const targetPos = world.positions.get(target.targetId);
        if (targetPos) {
          // Move towards target (Simplified)
          if (pos.q < targetPos.q) pos.q += fromFixed(vel.speedFixed);
          else if (pos.q > targetPos.q) pos.q -= fromFixed(vel.speedFixed);

          if (pos.r < targetPos.r) pos.r += fromFixed(vel.speedFixed);
          else if (pos.r > targetPos.r) pos.r -= fromFixed(vel.speedFixed);
        }
      }
    });
  };
};

export const createCombatSystem = (world: ECSWorld) => {
  return (tick: number) => {
    // Every 10 ticks (1 second), deal damage
    if (tick % 10 !== 0) return;

    world.targets.forEach((target, _entityId) => {
      if (target.targetId) {
        const targetHealth = world.healths.get(target.targetId);
        if (targetHealth) {
          targetHealth.current -= 10; // Fixed damage for prototype
          if (targetHealth.current <= 0) {
            world.healths.delete(target.targetId);
            // Destroy building/unit logic
          }
        }
      }
    });
  };
};
