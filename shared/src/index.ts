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
  cards: PieceType[];
  nextCard: PieceType;
  deck: PieceType[];
}

// ============================================
// Game State
// ============================================

export type GameStatus =
  | "waiting"
  | "playing"
  | "checkmate"
  | "draw"
  | "stalemate"
  | "insufficient"
  | "timeout"
  | "disconnected"
  | "resigned";

export interface LastMove {
  from?: string; // undefined for piece placements
  to: string;
}

export interface GameState {
  fen: string;
  turn: PlayerColor;
  elixir: Record<PlayerColor, number>;
  hands: Record<PlayerColor, CardHand>;
  timers: Record<PlayerColor, number>;
  status: GameStatus;
  winner?: PlayerColor;
  history: string[];
}

// ============================================
// Drag & Drop Types (client-side)
// ============================================

export interface DragData {
  type: PieceType;
  color: PlayerColor;
  source: "shop" | "board";
  from?: string;
  cost?: number;
}

// ============================================
// Multiplayer Types
// ============================================

export interface RoomState {
  roomId: string;
  players: {
    w?: string;
    b?: string;
  };
  gameState: GameState;
  createdAt: number;
}

export interface PlayerView {
  roomId: string;
  playerColor: PlayerColor;
  gameState: {
    fen: string;
    turn: PlayerColor;
    elixir: Record<PlayerColor, number>;
    timers: Record<PlayerColor, number>;
    status: GameStatus;
    winner?: PlayerColor;
    history: string[];
    myHand: CardHand;
    opponentCardCount: number;
    premoves: Premove[];
    lastMove?: LastMove;
  };
}

// ============================================
// Animation Events
// ============================================

export interface ElixirGainEvent {
  player: PlayerColor;
  amount: number;
  timestamp: number;
}

// ============================================
// Premove Types
// ============================================

export interface Premove {
  from: string;
  to: string;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  sender: PlayerColor;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

// Quick chat messages like Chess.com
export const QUICK_CHAT_MESSAGES = [
  "Bien joué !",
  "Bonne chance !",
  "Merci !",
  "Oups...",
  "Wow !",
  "GG",
] as const;

export type QuickChatMessage = (typeof QUICK_CHAT_MESSAGES)[number];

// ============================================
// Socket Events - Client to Server
// ============================================

export interface ClientToServerEvents {
  CREATE_ROOM: (data: { timeControl: TimeControlType }) => void;
  JOIN_ROOM: (data: { roomId: string }) => void;
  PLACE_PIECE: (data: { type: PieceType; square: string }) => void;
  MOVE_PIECE: (data: { from: string; to: string }) => void;
  SET_PREMOVES: (data: { premoves: Premove[] }) => void;
  CLEAR_PREMOVES: () => void;
  RESTART_GAME: () => void;
  LEAVE_ROOM: () => void;
  RESIGN: () => void;
  OFFER_DRAW: () => void;
  RESPOND_DRAW: (data: { accept: boolean }) => void;
  SEND_CHAT_MESSAGE: (data: { text: string }) => void;
}

// ============================================
// Socket Events - Server to Client
// ============================================

export interface ServerToClientEvents {
  ROOM_CREATED: (data: {
    roomId: string;
    playerColor: PlayerColor;
    timeControl: TimeControlType;
  }) => void;
  ROOM_JOINED: (data: {
    roomId: string;
    playerColor: PlayerColor;
    timeControl: TimeControlType;
  }) => void;
  GAME_START: (data: PlayerView) => void;
  GAME_STATE_UPDATE: (
    data: PlayerView & { gainEvent?: ElixirGainEvent },
  ) => void;
  TIMER_TICK: (data: { timers: Record<PlayerColor, number> }) => void;
  ELIXIR_UPDATE: (data: {
    elixir: Record<PlayerColor, number>;
    gainEvent?: ElixirGainEvent;
  }) => void;
  ACTION_REJECTED: (data: { action: string; reason: string }) => void;
  GAME_OVER: (data: { status: GameStatus; winner?: PlayerColor }) => void;
  PLAYER_DISCONNECTED: (data: { playerColor: PlayerColor }) => void;
  PLAYER_RECONNECTED: (data: { playerColor: PlayerColor }) => void;
  PREMOVES_CLEARED: (data: { reason: string }) => void;
  DRAW_OFFERED: (data: { from: PlayerColor }) => void;
  DRAW_DECLINED: () => void;
  CHAT_MESSAGE: (data: ChatMessage) => void;
  ERROR: (data: { message: string }) => void;
}

// ============================================
// Game Constants
// ============================================

export const INITIAL_FEN = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";

export const PIECE_COSTS: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export const CARD_WEIGHTS: Record<Exclude<PieceType, "k">, number> = {
  p: 40,
  n: 20,
  b: 20,
  r: 12,
  q: 8,
};

export const PIECE_NAMES: Record<PieceType, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

export const RARITY_COLORS: Record<Exclude<PieceType, "k">, string> = {
  p: "#6b7280",
  n: "#22c55e",
  b: "#22c55e",
  r: "#a855f7",
  q: "#f59e0b",
};

export const PLACEMENT_ZONES: Record<PlayerColor, number[]> = {
  w: [1, 2, 3],
  b: [6, 7, 8],
};

export const STARTING_ELIXIR = 5;
export const MAX_ELIXIR = 10;
export const HAND_SIZE = 4;
export const DECK_SIZE = 20;
export const INITIAL_TIME = 180;
export const TIMER_TICK_MS = 100;
export const RECONNECT_TIMEOUT_MS = 30000;

// ============================================
// Time Control Types
// ============================================

export type TimeControlType = "bullet" | "blitz" | "rapid";

export interface TimeControl {
  type: TimeControlType;
  time: number; // in seconds
  label: string;
  color: string;
  icon: string; // emoji or icon name
}

export const TIME_CONTROLS: Record<TimeControlType, TimeControl> = {
  bullet: {
    type: "bullet",
    time: 60, // 1 minute
    label: "Bullet",
    color: "#eab308", // yellow
    icon: "⚡",
  },
  blitz: {
    type: "blitz",
    time: 180, // 3 minutes
    label: "Blitz",
    color: "#f97316", // orange
    icon: "🔥",
  },
  rapid: {
    type: "rapid",
    time: 600, // 10 minutes
    label: "Rapide",
    color: "#22c55e", // green
    icon: "🐢",
  },
};

// Re-export card utilities
export { drawCard, generateDeck, initializeHand, cycleCard } from "./cards.js";

// Re-export elixir utilities
export { deductElixir, canAfford, addElixir } from "./elixir.js";
