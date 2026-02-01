export type PlayerColor = 'w' | 'b';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export interface Piece {
  type: PieceType;
  color: PlayerColor;
}

export interface GameState {
  fen: string;
  turn: PlayerColor;
  elixir: {
    w: number;
    b: number;
  };
  status: 'playing' | 'checkmate' | 'draw' | 'stalemate' | 'insufficient';
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

export const STARTING_ELIXIR = 1;
export const MAX_ELIXIR = 10;
