export type PlayerColor = "w" | "b";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface Piece {
  type: PieceType;
  color: PlayerColor;
}

// Card hand system - like Clash Royale
export interface CardHand {
  cards: PieceType[]; // 4 cards in hand
  nextCard: PieceType; // The card that will cycle in next
  deck: PieceType[]; // Remaining cards in deck (shuffled)
}

export interface GameState {
  fen: string;
  turn: PlayerColor;
  elixir: {
    w: number;
    b: number;
  };
  hands: {
    w: CardHand;
    b: CardHand;
  };
  status: "playing" | "checkmate" | "draw" | "stalemate" | "insufficient";
  winner?: PlayerColor;
  history: string[]; // History of moves in SAN
}

export const PIECE_COSTS: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0, // King cannot be bought
};

// Weighted rarity for card draws (higher = more common)
// Total weights = 100 for easy percentage calculation
export const CARD_WEIGHTS: Record<Exclude<PieceType, "k">, number> = {
  p: 40, // 40% chance - very common
  n: 20, // 20% chance - uncommon
  b: 20, // 20% chance - uncommon
  r: 12, // 12% chance - rare
  q: 8, // 8% chance - legendary
};

export const STARTING_ELIXIR = 1;
export const MAX_ELIXIR = 10;
export const HAND_SIZE = 4;
