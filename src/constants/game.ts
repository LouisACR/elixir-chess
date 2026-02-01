import type { PieceType } from "../types/game";

// Initial board setup - Kings only
export const INITIAL_FEN = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";

// Elixir settings
export const STARTING_ELIXIR = 1;
export const MAX_ELIXIR = 10;

// Card hand settings
export const HAND_SIZE = 4;
export const DECK_SIZE = 20;

// Piece costs for placement
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
  p: 40, // 40% chance - Common
  n: 20, // 20% chance - Uncommon
  b: 20, // 20% chance - Uncommon
  r: 12, // 12% chance - Rare
  q: 8, // 8% chance - Legendary
};

// Display names for pieces
export const PIECE_NAMES: Record<PieceType, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

// Rarity colors for UI
export const RARITY_COLORS: Record<Exclude<PieceType, "k">, string> = {
  p: "#6b7280", // Gray - Common
  n: "#22c55e", // Green - Uncommon
  b: "#22c55e", // Green - Uncommon
  r: "#a855f7", // Purple - Rare
  q: "#f59e0b", // Gold - Legendary
};

// Placement zone ranks for each color
export const PLACEMENT_ZONES = {
  w: [1, 2, 3], // White places on ranks 1-3
  b: [6, 7, 8], // Black places on ranks 6-8
} as const;
