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

export const Village = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
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
        <div>
          <div style={{ color: '#00FF41', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 18 }}>{gameState.player.name}</div>
          <div style={{ color: '#FFF', fontSize: 12 }}>Level 5</div>
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
        <div style={{
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
          pointerEvents: 'none'
        }} />

        {/* BUILDINGS */}
        {gameState.village.buildings.map((b: Building) => {
          const x = (b.q - 5) * TILE_WIDTH;
          const y = (b.r - 5) * TILE_WIDTH; 
          
          let color = '#FFF';
          if (b.type === 'TownHall') color = '#B85025';
          if (b.type === 'GoldMine') color = '#00FF41';
          if (b.type === 'ElixirCollector') color = '#D100FF';
          if (b.type === 'Wall') color = '#555';

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
                backgroundColor: color,
                border: isSelected ? '4px solid #FFF' : '2px solid #000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isSelected ? '0 0 20px #FFF' : 'inset 0 0 20px rgba(0,0,0,0.5)',
                transform: 'translateZ(1px)', 
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ transform: 'rotateZ(45deg) rotateX(-60deg)', color: '#000', fontWeight: 'bold', fontSize: 14 }}>
                {b.type.substring(0,2).toUpperCase()}
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
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ flex: 1, background: '#B85025', color: '#FFF', border: 'none', padding: 10, fontWeight: 'bold', cursor: 'pointer' }}>
              UPGRADE
            </button>
            <button onClick={() => setSelectedBuilding(null)} style={{ background: '#333', color: '#FFF', border: 'none', padding: 10, cursor: 'pointer' }}>
              CLOSE
            </button>
          </div>
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
