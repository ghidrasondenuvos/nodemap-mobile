import { useState, useEffect } from 'react';
import type { GameState, Building } from '../game/schema';
import { calculateOfflineDelta } from '../game/engine';
import { TILE_WIDTH, TILE_HEIGHT } from '../game/grid';

// Mock initial state representing a base loaded from filesystem
const INITIAL_STATE: GameState = {
  player: { id: 'p1', name: 'Commander', lastLoginTimestamp: Date.now() - 3600000 * 4 }, // offline for 4 hours
  resources: { gold: 1200, elixir: 800, gems: 500 },
  village: {
    buildings: [
      { id: 'th1', type: 'TownHall', level: 2, q: 5, r: 5, isUpgrading: false },
      { id: 'gm1', type: 'GoldMine', level: 3, q: 3, r: 7, isUpgrading: false },
      { id: 'ec1', type: 'ElixirCollector', level: 1, q: 7, r: 3, isUpgrading: false },
      { id: 'w1', type: 'Wall', level: 1, q: 4, r: 5, isUpgrading: false },
    ]
  },
  troops: { barbarians: 10, archers: 5, goblins: 0 }
};

export const Village = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    // Simulate login and offline progress calculation
    const processedState = calculateOfflineDelta(INITIAL_STATE, Date.now());
    setGameState(processedState);
  }, []);

  if (!gameState) return <div style={{ color: '#fff', padding: 20 }}>Loading Village...</div>;

  return (
    <div style={{ flex: 1, backgroundColor: '#000', overflow: 'hidden', position: 'relative' }}>
      {/* 📋 TASK 8: THE HUD */}
      <div style={{ position: 'absolute', top: 60, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 100 }}>
        <div>
          <div style={{ color: '#00FF41', fontFamily: 'monospace', fontWeight: 'bold' }}>{gameState.player.name}</div>
          <div style={{ color: '#FFF', fontSize: 12 }}>Level 5</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ background: '#333', padding: '4px 12px', border: '1px solid #00FF41' }}>
            <span style={{ color: '#00FF41', marginRight: 8 }}>GOLD</span>
            <span style={{ color: '#FFF', fontFamily: 'monospace' }}>{Math.floor(gameState.resources.gold)}</span>
          </div>
          <div style={{ background: '#333', padding: '4px 12px', border: '1px solid #D100FF' }}>
            <span style={{ color: '#D100FF', marginRight: 8 }}>ELIXIR</span>
            <span style={{ color: '#FFF', fontFamily: 'monospace' }}>{Math.floor(gameState.resources.elixir)}</span>
          </div>
        </div>
      </div>

      {/* 📋 TASK 2: ISOMETRIC GRID RENDERING */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', left: '50%', 
        width: 0, height: 0,
        // The magic isometric transform for standard DOM elements
        transform: 'rotateX(60deg) rotateZ(-45deg)' 
      }}>
        {gameState.village.buildings.map((b: Building) => {
          // In isometric CSS space, x is left, y is top.
          const x = b.q * TILE_WIDTH;
          const y = b.r * TILE_HEIGHT * 2; // scale factor
          
          let color = '#FFF';
          if (b.type === 'TownHall') color = '#B85025';
          if (b.type === 'GoldMine') color = '#00FF41';
          if (b.type === 'ElixirCollector') color = '#D100FF';
          if (b.type === 'Wall') color = '#888';

          return (
            <div 
              key={b.id}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: TILE_WIDTH * 2, // 2x2 building
                height: TILE_HEIGHT * 4,
                backgroundColor: color,
                border: '2px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                // Stand up the building against the isometric floor
                transform: 'translateZ(20px)', 
              }}
            >
              <div style={{ transform: 'rotateZ(45deg) rotateX(-60deg)', color: '#000', fontWeight: 'bold', fontSize: 10 }}>
                {b.type.substring(0,2).toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
