import { useState, useEffect } from 'react';
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

  // Panning State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Basic LocalStorage persistence for Web
    const saved = localStorage.getItem('siegecraft_state');
    let state = saved ? JSON.parse(saved) : INITIAL_STATE;
    state = calculateOfflineDelta(state, Date.now());
    setGameState(state);
    localStorage.setItem('siegecraft_state', JSON.stringify(state));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleUpgrade = () => {
    if (!gameState || !selectedBuilding) return;
    const cost = selectedBuilding.level * 500; // Mock cost scaling
    if (gameState.resources.gold >= cost) {
      const newState = { ...gameState };
      newState.resources.gold -= cost;
      const b = newState.village.buildings.find(x => x.id === selectedBuilding.id);
      if (b) {
        b.level += 1;
        // In a real app we'd set isUpgrading = true and set upgradeFinishTimestamp
      }
      setGameState(newState);
      localStorage.setItem('siegecraft_state', JSON.stringify(newState));
    } else {
      alert("Not enough Gold!");
    }
  };

  const handleTrain = () => {
    if (!gameState || selectedBuilding?.type !== 'Barracks') return;
    if (gameState.resources.elixir >= 100) {
      const newState = { ...gameState };
      newState.resources.elixir -= 100;
      newState.troops.barbarians += 1;
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
      onPointerLeave={handlePointerUp}
    >
      {/* HUD */}
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 100, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', pointerEvents: 'auto' }}>
          <div>
            <div style={{ color: '#00FF41', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 18 }}>{gameState.player.name}</div>
            <div style={{ color: '#FFF', fontSize: 12 }}>Level 5</div>
          </div>
          <button onClick={() => navigate('/battle')} style={{ background: '#FF4100', color: '#FFF', border: 'none', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', borderRadius: 4 }}>
            ⚔️ ATTACK!
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', pointerEvents: 'auto' }}>
          <div style={{ background: '#111', padding: '6px 16px', border: '1px solid #00FF41', borderRadius: 4 }}>
            <span style={{ color: '#00FF41', marginRight: 8, fontWeight: 'bold' }}>GOLD</span>
            <span style={{ color: '#FFF', fontFamily: 'monospace', fontSize: 16 }}>{Math.floor(gameState.resources.gold)}</span>
          </div>
          <div style={{ background: '#111', padding: '6px 16px', border: '1px solid #D100FF', borderRadius: 4 }}>
            <span style={{ color: '#D100FF', marginRight: 8, fontWeight: 'bold' }}>ELIXIR</span>
            <span style={{ color: '#FFF', fontFamily: 'monospace', fontSize: 16 }}>{Math.floor(gameState.resources.elixir)}</span>
          </div>
        </div>
      </div>

      {/* ISOMETRIC GRID RENDERING WITH PANNING */}
      <div style={{ 
        position: 'absolute', 
        top: `calc(50% + ${pan.y}px)`, 
        left: `calc(50% + ${pan.x}px)`, 
        width: 0, height: 0,
        transformStyle: 'preserve-3d',
        transform: 'rotateX(60deg) rotateZ(-45deg)' 
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
            backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)',
            backgroundSize: `${TILE_WIDTH}px ${TILE_WIDTH}px`,
            backgroundColor: '#0a1a0a',
            border: '2px solid rgba(0, 255, 65, 0.3)',
            boxShadow: '0 0 100px rgba(0,255,65,0.1)',
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
                backgroundImage: bgImage,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: bgImage === 'none' ? '#555' : 'transparent',
                // This is the magic for AI-generated JPGs with black backgrounds!
                mixBlendMode: b.type === 'Wall' ? 'normal' : 'screen',
                border: isSelected ? '2px solid #FFF' : 'none',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 0 20px #FFF' : 'none',
                transform: 'translateZ(1px)', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                paddingBottom: 4
              }}
            >
              <div style={{ transform: 'rotateZ(45deg) rotateX(-60deg)', color: '#00FF41', fontWeight: 'bold', fontSize: 12, background: 'rgba(0,0,0,0.8)', padding: '2px 4px' }}>
                LVL {b.level}
              </div>
            </div>
          );
        })}
      </div>

      {/* BUILDING INSPECTOR PANEL */}
      {selectedBuilding && (
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          background: '#111', border: '1px solid #00FF41', borderRadius: 8,
          padding: 20, display: 'flex', flexDirection: 'column', gap: 12, zIndex: 200,
          minWidth: 250, boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
        }}>
          <div style={{ color: '#00FF41', fontWeight: 'bold', fontSize: 18, textTransform: 'uppercase' }}>
            {selectedBuilding.type} <span style={{ color: '#FFF' }}>LVL {selectedBuilding.level}</span>
          </div>
          {selectedBuilding.type === 'Barracks' && (
            <div style={{ color: '#FFF', fontSize: 14 }}>
              Barbarians Available: <span style={{ color: '#D100FF', fontWeight: 'bold' }}>{gameState.troops.barbarians}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleUpgrade} style={{ flex: 1, background: '#B85025', color: '#FFF', border: 'none', padding: 10, fontWeight: 'bold', cursor: 'pointer' }}>
              UPGRADE ({selectedBuilding.level * 500} G)
            </button>
            {selectedBuilding.type === 'Barracks' && (
              <button onClick={handleTrain} style={{ flex: 1, background: '#D100FF', color: '#FFF', border: 'none', padding: 10, fontWeight: 'bold', cursor: 'pointer' }}>
                TRAIN (100 E)
              </button>
            )}
            <button onClick={() => setSelectedBuilding(null)} style={{ background: '#333', color: '#FFF', border: 'none', padding: 10, cursor: 'pointer' }}>
              CLOSE
            </button>
          </div>
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
