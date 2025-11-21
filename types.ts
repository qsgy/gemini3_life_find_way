export interface PlayerStats {
  wealth: number;
  connections: number;
  achievements: number;
  energy: number;
  mood: number;
}

export interface CardData {
  id: string;
  title: string;
  description: string;
  effects: Partial<PlayerStats>;
  type: 'study' | 'social' | 'work' | 'leisure' | 'event';
  emoji: string;
}

export interface GameState {
  turn: number;
  maxTurns: number;
  stats: PlayerStats;
  hand: CardData[];
  selectedCardIds: string[];
  history: string[]; // Log of actions taken
  isGameOver: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface AICommentaryResult {
  text: string;
  groundingChunks?: GroundingChunk[];
  audioData?: string; // Base64
}

export interface LiveSessionConfig {
  onOpen: () => void;
  onAudioData: (base64: string) => void;
  onClose: () => void;
  onError: (error: any) => void;
}
