import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GameState, Building } from '../game/schema';
import { TILE_WIDTH } from '../game/grid';

const ENEMY_BASE: Building[] = [
  { id: 'eth1', type: 'TownHall', level: 5, q: 5, r: 5, isUpgrading: false },
  { id: 'eg1', type: 'GoldMine', level: 5, q: 4, r: 6, isUpgrading: false },
  { id: 'ec1', type: 'ElixirCollector', level: 5, q: 6, r: 4, isUpgrading: false },
  { id: 'ecn1', type: 'Cannon', level: 1, q: 4, r: 4, isUpgrading: false },
  { id: 'ew1', type: 'Wall', level: 1, q: 5, r: 6, isUpgrading: false },
  { id: 'ew2', type: 'Wall', level: 1, q: 6, r: 5, isUpgrading: false }
];

interface Troop {
  id: string;
  type: string;
  q: number;
  r: number;
  hp: number;
  targetId?: string;
}

export const Battle = () => {
  const navigate = useNavigate();
  const [playerBarbs, setPlayerBarbs] = useState(0);
  const [playerArchers, setPlayerArchers] = useState(0);
  const [enemyBuildings, setEnemyBuildings] = useState<Building[]>(ENEMY_BASE);
  const [activeTroops, setActiveTroops] = useState<Troop[]>([]);
  const [lootedGold, setLootedGold] = useState(0);
  
  // Panning State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('siegecraft_state');
    if (saved) {
      const state: GameState = JSON.parse(saved);
      setPlayerBarbs(state.troops.barbarians);
      setPlayerArchers(state.troops.archers);
    }
  }, []);

  // The Deterministic ECS Combat Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTroops(currentTroops => {
        let updatedBuildings = [...enemyBuildings];
        let remainingTroops = [...currentTroops];
        let newLoot = 0;

        // 1. Defenses Fire at Troops!
        const cannons = updatedBuildings.filter(b => b.type === 'Cannon');
        cannons.forEach(cannon => {
           const closestTroop = remainingTroops.sort((a,b) => {
             const dA = Math.abs(a.q - cannon.q) + Math.abs(a.r - cannon.r);
             const dB = Math.abs(b.q - cannon.q) + Math.abs(b.r - cannon.r);
             return dA - dB;
           })[0];
           
           if (closestTroop) {
             const dist = Math.abs(closestTroop.q - cannon.q) + Math.abs(closestTroop.r - cannon.r);
             if (dist < 4) { // Range
                closestTroop.hp -= 20; // Cannon damage
             }
           }
        });

        remainingTroops = remainingTroops.filter(t => t.hp > 0);
        
        // 2. Troops Attack Buildings!
        const movedTroops = remainingTroops.map(troop => {
          let target = updatedBuildings.find(b => b.id === troop.targetId);
          if (!target && updatedBuildings.length > 0) {
            target = updatedBuildings.sort((a, b) => {
              const distA = Math.abs(a.q - troop.q) + Math.abs(a.r - troop.r);
              const distB = Math.abs(b.q - troop.q) + Math.abs(b.r - troop.r);
              return distA - distB;
            })[0];
          }

          if (target) {
            const dist = Math.abs(target.q - troop.q) + Math.abs(target.r - troop.r);
            const range = troop.type === 'Archer' ? 3.5 : 1.5;
            
            if (dist > range) {
              const dq = target.q > troop.q ? 0.2 : target.q < troop.q ? -0.2 : 0;
              const dr = target.r > troop.r ? 0.2 : target.r < troop.r ? -0.2 : 0;
              return { ...troop, q: troop.q + dq, r: troop.r + dr, targetId: target.id };
            } else {
              target.level -= troop.type === 'Archer' ? 0.05 : 0.1; // Using level as health hack for prototype
              if (target.level <= 0) {
                updatedBuildings = updatedBuildings.filter(b => b.id !== target!.id);
                // LOOT!
                if (target.type === 'GoldMine' || target.type === 'TownHall') newLoot += 500;
              }
              return { ...troop, targetId: target.id };
            }
          }
          return troop;
        });

        if (updatedBuildings.length !== enemyBuildings.length) {
          setEnemyBuildings(updatedBuildings);
        }

        if (newLoot > 0) {
          setLootedGold(prev => prev + newLoot);
        }

        return movedTroops;
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

  const handleDeploy = (type: 'barbarians' | 'archers') => {
    if (type === 'barbarians' && playerBarbs <= 0) return;
    if (type === 'archers' && playerArchers <= 0) return;
    
    if (type === 'barbarians') setPlayerBarbs(prev => prev - 1);
    if (type === 'archers') setPlayerArchers(prev => prev - 1);
    
    const deployQ = Math.floor(Math.random() * 10);
    setActiveTroops(prev => [...prev, {
      id: Math.random().toString(),
      type: type === 'barbarians' ? 'Barbarian' : 'Archer',
      q: deployQ,
      r: 9,
      hp: type === 'barbarians' ? 100 : 50
    }]);

    const saved = localStorage.getItem('siegecraft_state');
    if (saved) {
      const state: GameState = JSON.parse(saved);
      state.troops[type] -= 1;
      localStorage.setItem('siegecraft_state', JSON.stringify(state));
    }
  };

  const handleReturn = () => {
    // Commit loot to village!
    const saved = localStorage.getItem('siegecraft_state');
    if (saved) {
      const state: GameState = JSON.parse(saved);
      state.resources.gold += lootedGold;
      localStorage.setItem('siegecraft_state', JSON.stringify(state));
    }
    navigate('/village');
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
        <button onClick={handleReturn} style={{ background: '#B85025', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: 4, pointerEvents: 'auto', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>END BATTLE & RETURN</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ color: '#FF4100', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 18 }}>ENEMY BASE</div>
          <div style={{ background: '#111', padding: '4px 12px', border: '1px solid #FFD700', borderRadius: 4, marginTop: 8 }}>
            <span style={{ color: '#FFD700', marginRight: 8, fontWeight: 'bold' }}>LOOTED GOLD</span>
            <span style={{ color: '#FFF', fontFamily: 'monospace', fontSize: 16 }}>{Math.floor(lootedGold)}</span>
          </div>
        </div>
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
          if (b.type === 'Cannon') bgImage = 'url(/assets/cn.jpg)';
          if (b.type === 'Wall') bgImage = 'linear-gradient(45deg, #FF4100, #441100)';

          return (
            <div key={b.id} style={{
              position: 'absolute', left: x, top: y, width: TILE_WIDTH * 2, height: TILE_WIDTH * 2, 
              backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,65,0,0.2)', 
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', transform: 'translateZ(1px)'
            }}>
              {/* STANDING SPRITE */}
              <div style={{
                position: 'absolute', bottom: '30%', left: '50%', width: TILE_WIDTH * 3.5, height: TILE_WIDTH * 3.5, marginLeft: -TILE_WIDTH * 1.75,
                backgroundImage: bgImage, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom center',
                mixBlendMode: b.type === 'Wall' ? 'normal' : 'screen', transform: 'rotateZ(45deg) rotateX(-60deg)', transformOrigin: 'bottom center', pointerEvents: 'none'
              }} />

              {b.type !== 'Wall' && (
                <div style={{ position: 'absolute', bottom: 10, transform: 'rotateZ(45deg) rotateX(-60deg)', color: '#FF4100', fontWeight: '900', fontSize: 12, background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: 4, border: '1px solid #FF4100' }}>
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
          const sprite = t.type === 'Barbarian' ? 'url(/assets/barb.jpg)' : 'url(/assets/arch.jpg)';
          return (
            <div key={t.id} style={{
              position: 'absolute', left: x, top: y, width: TILE_WIDTH * 2, height: TILE_WIDTH * 2,
              pointerEvents: 'none', transform: 'translateZ(5px)', transition: 'left 0.1s linear, top 0.1s linear'
            }}>
              {/* COUNTER-ROTATED TROOP SPRITE */}
              <div style={{
                position: 'absolute', bottom: '20%', left: '50%', width: TILE_WIDTH * 2.5, height: TILE_WIDTH * 2.5, marginLeft: -TILE_WIDTH * 1.25,
                backgroundImage: sprite, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom center',
                mixBlendMode: 'screen', transform: 'rotateZ(45deg) rotateX(-60deg)', transformOrigin: 'bottom center', filter: 'drop-shadow(0 0 5px rgba(255,0,255,0.5))'
              }} />
              {/* HEALTH BAR */}
              <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotateZ(45deg) rotateX(-60deg)', width: 30, height: 4, background: '#333', borderRadius: 2 }}>
                <div style={{ width: `${(t.hp / (t.type === 'Barbarian' ? 100 : 50)) * 100}%`, height: '100%', background: '#00FF41', borderRadius: 2 }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* DEPLOYMENT BAR */}
      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 20, zIndex: 100 }}>
        <button onClick={() => handleDeploy('barbarians')} style={{ background: '#111', color: '#FF4100', border: '2px solid #FF4100', padding: '16px 32px', borderRadius: 8, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          DEPLOY BARBARIAN ({playerBarbs})
        </button>
        <button onClick={() => handleDeploy('archers')} style={{ background: '#111', color: '#D100FF', border: '2px solid #D100FF', padding: '16px 32px', borderRadius: 8, fontWeight: 'bold', fontSize: 18, cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          DEPLOY ARCHER ({playerArchers})
        </button>
      </div>
    </div>
  );
};
