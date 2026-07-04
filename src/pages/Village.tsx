import { useState, useEffect, useRef } from 'react';
import type { GameState, Building } from '../game/schema';
import { calculateOfflineDelta } from '../game/engine';
import { TILE_WIDTH } from '../game/grid';

const INITIAL_STATE: GameState = {
  player: { id: 'p1', name: 'Commander', lastLoginTimestamp: Date.now() - 3600000 * 4 },
  resources: { gold: 1200, elixir: 800, gems: 500 },
  village: {
    buildings: [
      { id: 'th1', type: 'TownHall', level: 2, q: 5, r: 5, isUpgrading: false },
      { id: 'gm1', type: 'GoldMine', level: 3, q: 3, r: 7, isUpgrading: false },
      { id: 'ec1', type: 'ElixirCollector', level: 1, q: 7, r: 3, isUpgrading: false },
      { id: 'b1', type: 'Barracks', level: 1, q: 3, r: 3, isUpgrading: false },
      { id: 'w1', type: 'Wall', level: 1, q: 4, r: 5, isUpgrading: false },
    ]
  },
  troops: { barbarians: 10, archers: 5, goblins: 0 },
  clanId: 'c1'
};

const MOCK_CHAT = [
  { id: '1', senderName: 'DragonSlayer', text: 'Anyone online?', timestamp: Date.now() - 50000 },
  { id: '2', senderName: 'Commander', text: 'Yeah, just upgrading my Gold Mine.', timestamp: Date.now() - 20000 },
  { id: '3', senderName: 'ArcherQueen', text: 'I need troops for war!', timestamp: Date.now() - 5000, isDonationRequest: true }
];

import { useNavigate } from 'react-router-dom';

export const Village = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [placementMode, setPlacementMode] = useState<{type: 'GoldMine'|'ElixirCollector'|'Barracks'|'Wall'|'Cannon', cost: number} | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Panning & Zooming State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  const activePointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  const touchDist = useRef<number | null>(null);

  useEffect(() => {
    // Basic LocalStorage persistence for Web
    const saved = localStorage.getItem('siegecraft_state');
    let state = saved ? JSON.parse(saved) : INITIAL_STATE;
    state = calculateOfflineDelta(state, Date.now());
    setGameState(state);
    localStorage.setItem('siegecraft_state', JSON.stringify(state));

    // Fast Upgrade Tick Loop
    const interval = setInterval(() => {
      setGameState(curr => {
        if (!curr) return curr;
        let changed = false;
        const newBuildings = curr.village.buildings.map(b => {
          if (b.isUpgrading && b.upgradeFinishTimestamp && Date.now() >= b.upgradeFinishTimestamp) {
            changed = true;
            return { ...b, level: b.level + 1, isUpgrading: false, upgradeFinishTimestamp: undefined };
          }
          return b;
        });
        if (changed) {
          const newState = { ...curr, village: { ...curr.village, buildings: newBuildings } };
          localStorage.setItem('siegecraft_state', JSON.stringify(newState));
          return newState;
        }
        return curr;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 1) {
      setIsDragging(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointers.current.size === 2) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (touchDist.current !== null) {
        const delta = dist - touchDist.current;
        setZoom(z => Math.min(Math.max(0.3, z + delta * 0.01), 3));
      }
      touchDist.current = dist;
      setIsDragging(false);
    } else if (activePointers.current.size === 1 && isDragging) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      touchDist.current = null;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size === 0) {
      setIsDragging(false);
      touchDist.current = null;
    } else if (activePointers.current.size === 1) {
      const pts = Array.from(activePointers.current.values());
      setStartPan({ x: pts[0].x - pan.x, y: pts[0].y - pan.y });
      setIsDragging(true);
      touchDist.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    setZoom(z => Math.min(Math.max(0.3, z - e.deltaY * 0.002), 3));
  };

  const handleUpgrade = () => {
    if (!gameState || !selectedBuilding || selectedBuilding.isUpgrading) return;
    const cost = selectedBuilding.level * 500; // Mock cost scaling
    if (gameState.resources.gold >= cost) {
      const newState = { ...gameState };
      newState.resources.gold -= cost;
      const b = newState.village.buildings.find(x => x.id === selectedBuilding.id);
      if (b) {
        b.isUpgrading = true;
        b.upgradeFinishTimestamp = Date.now() + 15000; // 15 seconds for prototype
      }
      setGameState(newState);
      localStorage.setItem('siegecraft_state', JSON.stringify(newState));
    } else {
      alert("Not enough Gold!");
    }
  };

  const handleSpeedUp = () => {
    if (!gameState || !selectedBuilding || !selectedBuilding.isUpgrading) return;
    if (gameState.resources.gems >= 10) {
      const newState = { ...gameState };
      newState.resources.gems -= 10;
      const b = newState.village.buildings.find(x => x.id === selectedBuilding.id);
      if (b) {
        b.level += 1;
        b.isUpgrading = false;
        b.upgradeFinishTimestamp = undefined;
      }
      setGameState(newState);
      localStorage.setItem('siegecraft_state', JSON.stringify(newState));
    } else {
      alert("Not enough Gems!");
    }
  };

  const handleTrain = (type: 'barbarians' | 'archers') => {
    if (!gameState || selectedBuilding?.type !== 'Barracks') return;
    if (gameState.resources.elixir >= 100) {
      const newState = { ...gameState };
      newState.resources.elixir -= 100;
      newState.troops[type] += 1;
      setGameState(newState);
      localStorage.setItem('siegecraft_state', JSON.stringify(newState));
    } else {
      alert("Not enough Elixir!");
    }
  };

  const handleGridClick = () => {
    if (!placementMode || !gameState) return;
    
    // Quick hack to convert click to rough grid coords (ignoring pan for prototype simplicity, assuming center)
    const newQ = Math.floor(Math.random() * 8); 
    const newR = Math.floor(Math.random() * 8);

    if (gameState.resources.gold >= placementMode.cost) {
      const newState = { ...gameState };
      newState.resources.gold -= placementMode.cost;
      newState.village.buildings.push({
        id: Math.random().toString(),
        type: placementMode.type,
        level: 1,
        q: newQ,
        r: newR,
        isUpgrading: false
      });
      setGameState(newState);
      localStorage.setItem('siegecraft_state', JSON.stringify(newState));
      setPlacementMode(null);
    } else {
      alert("Not enough Gold!");
      setPlacementMode(null);
    }
  };

  if (!gameState) return <div style={{ color: '#fff', padding: 20 }}>Loading Village...</div>;

  return (
    <div 
      style={{ width: '100vw', height: '100vh', backgroundColor: '#050a05', overflow: 'hidden', position: 'relative', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* HUD */}
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', pointerEvents: 'auto' }}>
          <div style={{ background: 'rgba(10, 15, 10, 0.8)', backdropFilter: 'blur(10px)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(0,255,65,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <div style={{ color: '#00FF41', fontFamily: 'monospace', fontWeight: '900', fontSize: 20, textShadow: '0 0 10px #00FF41' }}>{gameState.player.name}</div>
            <div style={{ color: '#A0A0A0', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 }}>COMMANDER LVL 5</div>
          </div>
          <button onClick={() => navigate('/battle')} style={{ 
            background: 'linear-gradient(135deg, #FF4100 0%, #AA2200 100%)', color: '#FFF', border: '1px solid #FF8800', 
            padding: '12px 24px', fontWeight: '900', cursor: 'pointer', borderRadius: '8px', fontSize: 16,
            boxShadow: '0 4px 20px rgba(255, 65, 0, 0.6)', textShadow: '0 2px 4px rgba(0,0,0,0.5)', transition: 'transform 0.1s'
          }} onPointerDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            ⚔️ INITIATE ATTACK
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', pointerEvents: 'auto' }}>
          {[
            { label: 'GOLD', value: gameState.resources.gold, color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
            { label: 'ELIXIR', value: gameState.resources.elixir, color: '#D100FF', bg: 'rgba(209,0,255,0.1)' },
            { label: 'GEMS', value: gameState.resources.gems, color: '#00FFFF', bg: 'rgba(0,255,255,0.1)' }
          ].map(res => (
            <div key={res.label} style={{ 
              background: 'rgba(10, 15, 10, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 16px', 
              border: `1px solid ${res.color}`, borderRadius: '8px', display: 'flex', alignItems: 'center',
              boxShadow: `0 4px 15px ${res.bg}`, minWidth: 140, justifyContent: 'space-between'
            }}>
              <span style={{ color: res.color, marginRight: 12, fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>{res.label}</span>
              <span style={{ color: '#FFF', fontFamily: 'monospace', fontSize: 18, fontWeight: 'bold' }}>{Math.floor(res.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ISOMETRIC WORLD */}
      <div style={{ 
        position: 'absolute', top: '50%', left: '50%', 
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotateX(60deg) rotateZ(-45deg)`, 
        transformStyle: 'preserve-3d', transition: isDragging ? 'none' : 'transform 0.1s ease-out'
      }}>
        {/* GRASS FLOOR */}
        <div 
          onClick={handleGridClick}
          style={{
            position: 'absolute',
            width: TILE_WIDTH * 20,
            height: TILE_WIDTH * 20,
            left: -TILE_WIDTH * 10,
            top: -TILE_WIDTH * 10,
            backgroundImage: `
              linear-gradient(rgba(0, 255, 65, 0.15) 1px, transparent 1px), 
              linear-gradient(90deg, rgba(0, 255, 65, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: `${TILE_WIDTH}px ${TILE_WIDTH}px`,
            backgroundColor: '#050f05',
            border: '2px solid rgba(0, 255, 65, 0.5)',
            boxShadow: '0 0 150px rgba(0,255,65,0.2) inset',
            pointerEvents: placementMode ? 'auto' : 'none',
            cursor: placementMode ? 'crosshair' : 'default'
          }} 
        />

        {/* BUILDINGS */}
        {gameState.village.buildings.map((b: Building) => {
          const x = (b.q - 5) * TILE_WIDTH;
          const y = (b.r - 5) * TILE_WIDTH; 
          
          let bgImage = 'none';
          if (b.type === 'TownHall') bgImage = 'url(/assets/th.jpg)';
          if (b.type === 'GoldMine') bgImage = 'url(/assets/gm.jpg)';
          if (b.type === 'ElixirCollector') bgImage = 'url(/assets/ec.jpg)';
          if (b.type === 'Cannon') bgImage = 'url(/assets/cn.jpg)';
          if (b.type === 'Wall') bgImage = 'linear-gradient(45deg, #444, #222)';

          const isSelected = selectedBuilding?.id === b.id;

          return (
            <div 
              key={b.id}
              onClick={(e) => { e.stopPropagation(); setSelectedBuilding(b); }}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: TILE_WIDTH * 2, 
                height: TILE_WIDTH * 2, 
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: isSelected ? '2px solid #FFF' : '1px solid rgba(0,255,65,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 0 30px rgba(255,255,255,0.3) inset' : 'none',
                transform: 'translateZ(1px)', 
                cursor: 'pointer',
                transition: 'border 0.2s'
              }}
            >
              {/* COUNTER-ROTATED STANDING SPRITE */}
              <div style={{
                position: 'absolute',
                bottom: '30%',
                left: '50%',
                width: TILE_WIDTH * 3.5,
                height: TILE_WIDTH * 3.5,
                marginLeft: -TILE_WIDTH * 1.75,
                backgroundImage: bgImage,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'bottom center',
                mixBlendMode: b.type === 'Wall' ? 'normal' : 'screen',
                transform: 'rotateZ(45deg) rotateX(-60deg)',
                transformOrigin: 'bottom center',
                pointerEvents: 'none',
                filter: isSelected ? 'drop-shadow(0 0 10px #FFF)' : 'none'
              }} />

              {/* LEVEL BADGE */}
              <div style={{ position: 'absolute', bottom: 10, transform: 'rotateZ(45deg) rotateX(-60deg)', color: '#00FF41', fontWeight: '900', fontSize: 14, background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: 12, border: '1px solid #00FF41' }}>
                LVL {b.level}
              </div>
              
              {/* UPGRADE PROGRESS */}
              {b.isUpgrading && (
                <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%) rotateZ(45deg) rotateX(-60deg)', color: '#00FFFF', fontWeight: '900', fontSize: 12, background: 'rgba(0,0,0,0.9)', padding: '4px 8px', borderRadius: 4, border: '1px solid #00FFFF', whiteSpace: 'nowrap', boxShadow: '0 0 10px rgba(0,255,255,0.5)' }}>
                  ⚙️ UPGRADING
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BUILDING INSPECTOR PANEL */}
      {selectedBuilding && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10, 15, 10, 0.95)', border: '1px solid #00FF41', borderRadius: 16,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 200,
          minWidth: 320, boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(0,255,65,0.2) inset',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#00FF41', fontWeight: '900', fontSize: 22, textTransform: 'uppercase', letterSpacing: 1 }}>
              {selectedBuilding.type}
            </div>
            <div style={{ background: '#FFF', color: '#000', padding: '2px 8px', borderRadius: 10, fontWeight: '900', fontSize: 12 }}>
              LVL {selectedBuilding.level}
            </div>
          </div>
          
          {selectedBuilding.type === 'Barracks' && !selectedBuilding.isUpgrading && (
            <div style={{ color: '#FFF', fontSize: 14, background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8 }}>
              <div style={{ color: '#888', marginBottom: 4, fontSize: 12, fontWeight: 'bold' }}>GARRISON</div>
              ⚔️ <span style={{ color: '#D100FF', fontWeight: 'bold' }}>{gameState.troops.barbarians} Barbarians</span> &nbsp;|&nbsp; 
              🏹 <span style={{ color: '#D100FF', fontWeight: 'bold' }}>{gameState.troops.archers} Archers</span>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 10 }}>
            {!selectedBuilding.isUpgrading ? (
              <button onClick={handleUpgrade} style={{ flex: 1, background: 'linear-gradient(to bottom, #FFD700, #B8860B)', color: '#000', border: 'none', padding: '12px 16px', fontWeight: '900', cursor: 'pointer', borderRadius: 8, boxShadow: '0 4px 10px rgba(255,215,0,0.3)' }}>
                UPGRADE ({selectedBuilding.level * 500} G)
              </button>
            ) : (
              <button onClick={handleSpeedUp} style={{ flex: 1, background: 'linear-gradient(to bottom, #00FFFF, #008888)', color: '#000', border: 'none', padding: '12px 16px', fontWeight: '900', cursor: 'pointer', borderRadius: 8, boxShadow: '0 4px 10px rgba(0,255,255,0.3)' }}>
                FINISH NOW (10 💎)
              </button>
            )}
            
            <button onClick={() => setSelectedBuilding(null)} style={{ background: 'transparent', color: '#FFF', border: '1px solid #555', padding: '12px 16px', cursor: 'pointer', borderRadius: 8, fontWeight: 'bold' }}>
              CLOSE
            </button>
          </div>

          {selectedBuilding.type === 'Barracks' && !selectedBuilding.isUpgrading && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleTrain('barbarians')} style={{ flex: 1, background: '#111', color: '#D100FF', border: '1px solid #D100FF', padding: 10, fontWeight: 'bold', cursor: 'pointer', borderRadius: 8, fontSize: 12 }}>
                + TRAIN BARB (100 E)
              </button>
              <button onClick={() => handleTrain('archers')} style={{ flex: 1, background: '#111', color: '#D100FF', border: '1px solid #D100FF', padding: 10, fontWeight: 'bold', cursor: 'pointer', borderRadius: 8, fontSize: 12 }}>
                + TRAIN ARCH (150 E)
              </button>
            </div>
          )}
        </div>
      )}

      {/* PLACEMENT MODE INDICATOR */}
      {placementMode && (
        <div style={{ position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)', background: '#00FF41', color: '#000', padding: '10px 20px', fontWeight: 'bold', borderRadius: 20, zIndex: 100 }}>
          TAP GRID TO PLACE {placementMode.type.toUpperCase()}
        </div>
      )}

      {/* SHOP UI */}
      <div style={{ position: 'absolute', bottom: 40, left: 20, zIndex: 100 }}>
        <button 
          onClick={() => setShopOpen(!shopOpen)}
          style={{ background: '#111', color: '#FFF', border: '2px solid #FFF', padding: '12px 20px', borderRadius: 30, fontWeight: 'bold', cursor: 'pointer' }}
        >
          {shopOpen ? 'CLOSE SHOP' : 'BUILD MENU'}
        </button>
      </div>

      {shopOpen && (
        <div style={{ 
          position: 'absolute', bottom: 100, left: 20, width: 250, 
          background: 'rgba(5, 10, 5, 0.95)', border: '1px solid #FFF',
          display: 'flex', flexDirection: 'column', zIndex: 90, padding: 16
        }}>
          <div style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>RESOURCES</div>
          <button onClick={() => { setPlacementMode({type: 'GoldMine', cost: 1000}); setShopOpen(false); }} style={{ background: '#111', color: '#00FF41', border: '1px solid #00FF41', padding: 10, marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>
            + GOLD MINE (1000 G)
          </button>
          <button onClick={() => { setPlacementMode({type: 'ElixirCollector', cost: 1000}); setShopOpen(false); }} style={{ background: '#111', color: '#D100FF', border: '1px solid #D100FF', padding: 10, marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>
            + ELIXIR COLLECTOR (1000 G)
          </button>
          <button onClick={() => { setPlacementMode({type: 'Barracks', cost: 500}); setShopOpen(false); }} style={{ background: '#111', color: '#FF4100', border: '1px solid #FF4100', padding: 10, marginBottom: 8, cursor: 'pointer', textAlign: 'left' }}>
            + BARRACKS (500 G)
          </button>
          <button onClick={() => { setPlacementMode({type: 'Cannon', cost: 2000}); setShopOpen(false); }} style={{ background: '#111', color: '#FFF', border: '1px solid #FF0000', padding: 10, cursor: 'pointer', textAlign: 'left' }}>
            + DEFENSIVE CANNON (2000 G)
          </button>
        </div>
      )}

      {/* CLAN CHAT */}
      <div style={{ position: 'absolute', bottom: 40, right: 20, zIndex: 100 }}>
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          style={{ background: '#111', color: '#00FF41', border: '1px solid #00FF41', padding: '12px 20px', borderRadius: 30, fontWeight: 'bold', cursor: 'pointer' }}
        >
          {chatOpen ? 'CLOSE CHAT' : 'CLAN CHAT'}
        </button>
      </div>

      {chatOpen && (
        <div style={{ 
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 320, 
          background: 'rgba(5, 10, 5, 0.95)', borderLeft: '1px solid #00FF41',
          display: 'flex', flexDirection: 'column', zIndex: 90,
          paddingTop: 80, paddingBottom: 100
        }}>
          <div style={{ padding: 16, borderBottom: '1px solid #333', color: '#00FF41', fontWeight: 'bold', fontSize: 18 }}>
            CLAN: TITANS
          </div>
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_CHAT.map(msg => (
              <div key={msg.id} style={{ background: '#111', padding: 12, borderRadius: 8, borderLeft: `3px solid ${msg.senderName === 'Commander' ? '#00FF41' : '#B85025'}` }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{msg.senderName}</div>
                <div style={{ color: '#FFF', fontSize: 14 }}>{msg.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
