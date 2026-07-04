import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameState, Building } from '../game/schema';
import { TILE_WIDTH } from '../game/grid';

const ENEMY_BASE: Building[] = [
  { id: 'eth1', type: 'TownHall', level: 5, q: 5, r: 5, isUpgrading: false },
  { id: 'eg1', type: 'GoldMine', level: 5, q: 4, r: 6, isUpgrading: false },
  { id: 'ec1', type: 'ElixirCollector', level: 5, q: 6, r: 4, isUpgrading: false },
  { id: 'ew1', type: 'Wall', level: 1, q: 5, r: 6, isUpgrading: false },
  { id: 'ew2', type: 'Wall', level: 1, q: 6, r: 5, isUpgrading: false }
];

interface Troop {
  id: string;
  type: string;
  q: number;
  r: number;
  targetId?: string;
}

export const Battle = () => {
  const navigate = useNavigate();
  const [playerTroops, setPlayerTroops] = useState(0);
  const [enemyBuildings, setEnemyBuildings] = useState<Building[]>(ENEMY_BASE);
  const [activeTroops, setActiveTroops] = useState<Troop[]>([]);
  
  // Panning State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('siegecraft_state');
    if (saved) {
      const state: GameState = JSON.parse(saved);
      setPlayerTroops(state.troops.barbarians);
    }
  }, []);

  // The Deterministic ECS Combat Loop (Simplified for React State)
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTroops(currentTroops => {
        let updatedBuildings = [...enemyBuildings];
        
        const newTroops = currentTroops.map(troop => {
          // 1. Find nearest building (Targeting logic)
          let target = updatedBuildings.find(b => b.id === troop.targetId);
          if (!target && updatedBuildings.length > 0) {
            target = updatedBuildings.sort((a, b) => {
              const distA = Math.abs(a.q - troop.q) + Math.abs(a.r - troop.r);
              const distB = Math.abs(b.q - troop.q) + Math.abs(b.r - troop.r);
              return distA - distB;
            })[0];
          }

          if (target) {
            // 2. Move towards target (Pathfinding logic)
            const dist = Math.abs(target.q - troop.q) + Math.abs(target.r - troop.r);
            if (dist > 1.5) { // Needs to be adjacent
              const dq = target.q > troop.q ? 0.2 : target.q < troop.q ? -0.2 : 0;
              const dr = target.r > troop.r ? 0.2 : target.r < troop.r ? -0.2 : 0;
              return { ...troop, q: troop.q + dq, r: troop.r + dr, targetId: target.id };
            } else {
              // 3. Attack logic (Damage building)
              target.level -= 0.1; // Using level as health hack for prototype
              if (target.level <= 0) {
                updatedBuildings = updatedBuildings.filter(b => b.id !== target!.id);
              }
              return { ...troop, targetId: target.id };
            }
          }
          return troop;
        });

        if (updatedBuildings.length !== enemyBuildings.length) {
          setEnemyBuildings(updatedBuildings);
        }

        return newTroops;
      });
    }, 100); // 10 ticks per second
    return () => clearInterval(interval);
  }, [enemyBuildings]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
  };
  const handlePointerUp = () => setIsDragging(false);

  const handleDeploy = () => {
    if (playerTroops <= 0) return;
    setPlayerTroops(prev => prev - 1);
    
    // Deploy roughly at edges (q: 0-9, r: 9)
    const deployQ = Math.floor(Math.random() * 10);
    setActiveTroops(prev => [...prev, {
      id: Math.random().toString(),
      type: 'Barbarian',
      q: deployQ,
      r: 9
    }]);

    // Save deducted troop
    const saved = localStorage.getItem('siegecraft_state');
    if (saved) {
      const state: GameState = JSON.parse(saved);
      state.troops.barbarians -= 1;
      localStorage.setItem('siegecraft_state', JSON.stringify(state));
    }
  };

  return (
    <div 
      style={{ width: '100vw', height: '100vh', backgroundColor: '#1a0505', overflow: 'hidden', position: 'relative', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* HEADER */}
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 100, pointerEvents: 'none' }}>
        <button onClick={() => navigate('/village')} style={{ background: '#B85025', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: 4, pointerEvents: 'auto', fontWeight: 'bold', cursor: 'pointer' }}>SURRENDER</button>
        <div style={{ color: '#FF4100', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 18 }}>ENEMY BASE</div>
      </div>

      <div style={{ 
        position: 'absolute', top: `calc(50% + ${pan.y}px)`, left: `calc(50% + ${pan.x}px)`, 
        width: 0, height: 0, transformStyle: 'preserve-3d', transform: 'rotateX(60deg) rotateZ(-45deg)' 
      }}>
        {/* DIRT FLOOR */}
        <div style={{
          position: 'absolute', width: TILE_WIDTH * 20, height: TILE_WIDTH * 20, left: -TILE_WIDTH * 10, top: -TILE_WIDTH * 10,
          backgroundImage: 'linear-gradient(rgba(255, 65, 0, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 65, 0, 0.2) 1px, transparent 1px)',
          backgroundSize: `${TILE_WIDTH}px ${TILE_WIDTH}px`, backgroundColor: '#1a0a0a', border: '2px solid rgba(255, 65, 0, 0.5)'
        }} />

        {/* BUILDINGS */}
        {enemyBuildings.map((b) => {
          const x = (b.q - 5) * TILE_WIDTH;
          const y = (b.r - 5) * TILE_WIDTH; 
          let bgImage = 'none';
          if (b.type === 'TownHall') bgImage = 'url(/assets/th.jpg)';
          if (b.type === 'GoldMine') bgImage = 'url(/assets/gm.jpg)';
          if (b.type === 'ElixirCollector') bgImage = 'url(/assets/ec.jpg)';
          if (b.type === 'Wall') bgImage = 'linear-gradient(45deg, #FF4100, #441100)';

          return (
            <div key={b.id} style={{
              position: 'absolute', left: x, top: y, width: TILE_WIDTH * 2, height: TILE_WIDTH * 2, 
              backgroundImage: bgImage, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: bgImage === 'none' ? '#555' : 'transparent',
              mixBlendMode: b.type === 'Wall' ? 'normal' : 'screen', border: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transform: 'translateZ(1px)', paddingBottom: 4
            }}>
              {b.type !== 'Wall' && (
                <div style={{ transform: 'rotateZ(45deg) rotateX(-60deg)', color: '#FF4100', fontWeight: 'bold', fontSize: 10, background: 'rgba(0,0,0,0.8)', padding: '2px 4px' }}>
                  HP {Math.ceil(b.level * 100)}
                </div>
              )}
            </div>
          );
        })}

        {/* TROOPS */}
        {activeTroops.map(t => {
          const x = (t.q - 5) * TILE_WIDTH;
          const y = (t.r - 5) * TILE_WIDTH; 
          return (
            <div key={t.id} style={{
              position: 'absolute', left: x + (TILE_WIDTH/2), top: y + (TILE_WIDTH/2), width: 16, height: 16,
              background: '#FF4100', borderRadius: '50%', boxShadow: '0 0 10px #FF4100',
              transform: 'translateZ(5px)', transition: 'left 0.1s linear, top 0.1s linear'
            }} />
          )
        })}
      </div>

      {/* DEPLOYMENT BAR */}
      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 20, zIndex: 100 }}>
        <button onClick={handleDeploy} style={{ background: '#111', color: '#FF4100', border: '2px solid #FF4100', padding: '16px 32px', borderRadius: 8, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          DEPLOY BARBARIAN ({playerTroops} LEFT)
        </button>
      </div>
    </div>
  );
};
