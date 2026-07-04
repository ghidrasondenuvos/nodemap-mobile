export interface Player {
  id: string;
  name: string;
  lastLoginTimestamp: number;
}

export interface Resources {
  gold: number;
  elixir: number;
  gems: number;
}

export interface Building {
  id: string;
  type: 'TownHall' | 'GoldMine' | 'ElixirCollector' | 'Barracks' | 'Wall';
  level: number;
  q: number; // Isometric Grid Column
  r: number; // Isometric Grid Row
  isUpgrading: boolean;
  upgradeFinishTimestamp?: number;
}

export interface VillageState {
  buildings: Building[];
}

export interface TroopInventory {
  barbarians: number;
  archers: number;
  goblins: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
  isDonationRequest?: boolean;
}

export interface Clan {
  id: string;
  name: string;
  members: string[]; // Player IDs
  chatHistory: ChatMessage[];
}

export interface GameState {
  player: Player;
  resources: Resources;
  village: VillageState;
  troops: TroopInventory;
  clanId?: string;
}
