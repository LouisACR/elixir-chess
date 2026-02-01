// ============================================
// Core Types
// ============================================

export type PlayerColor = "w" | "b";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface Piece {
  type: PieceType;
  color: PlayerColor;
}

// ============================================
// Card System Types
// ============================================

export interface CardHand {
  cards: PieceType[]; // Cards currently in hand (4)
  nextCard: PieceType; // Preview of next card to cycle in
  deck: PieceType[]; // Remaining cards in deck
}

// ============================================
// Game State
// ============================================

export type GameStatus =
  | "playing"
  | "checkmate"
  | "draw"
  | "stalemate"
  | "insufficient"
  | "timeout";

export interface GameState {
  fen: string;
  turn: PlayerColor;
  elixir: Record<PlayerColor, number>;
  hands: Record<PlayerColor, CardHand>;
  timers: Record<PlayerColor, number>; // Time remaining in seconds
  status: GameStatus;
  winner?: PlayerColor;
  history: string[];
}

// ============================================
// Drag & Drop Types
// ============================================

export interface DragData {
  type: PieceType;
  color: PlayerColor;
  source: "shop" | "board";
  from?: string; // Square if dragging from board
  cost?: number; // Cost if from shop
}

// Re-export constants for backward compatibility
export {
  PIECE_COSTS,
  CARD_WEIGHTS,
  STARTING_ELIXIR,
  MAX_ELIXIR,
  HAND_SIZE,
  PIECE_NAMES,
  RARITY_COLORS,
} from "../constants/game";
