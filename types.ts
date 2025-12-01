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
  history: string[]; 
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
}

export interface AppSettings {
  autoPlayTTS: boolean;
  soundEffects: boolean;
}

export interface CommentaryTemplate {
  condition: (stats: PlayerStats, playedCards: CardData[]) => boolean;
  lines: string[];
}