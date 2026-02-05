import type { Chess, Square } from "chess.js";
import type { PieceType, PlayerColor } from "@elixir-chess/shared";
import { PLACEMENT_ZONES, PIECE_COSTS } from "@elixir-chess/shared";

/**
 * Check if a square is in the placement zone for a given player
 */
export function isInPlacementZone(square: string, color: PlayerColor): boolean {
  const rank = parseInt(square[1]);
  const zones = PLACEMENT_ZONES[color] as readonly number[];
  return zones.includes(rank);
}

/**
 * Get all squares in the placement zone for a player
 */
export function getPlacementZoneSquares(color: PlayerColor): string[] {
  const squares: string[] = [];
  const ranks = PLACEMENT_ZONES[color];

  for (let col = 0; col < 8; col++) {
    for (const rank of ranks) {
      squares.push(`${String.fromCharCode(97 + col)}${rank}`);
    }
  }

  return squares;
}

/**
 * Check if placing a piece at a square would block check
 * Returns the board to original state after checking
 */
export function wouldBlockCheck(
  game: Chess,
  type: PieceType,
  square: string,
): boolean {
  const turn = game.turn();
  if (!game.inCheck()) return false;

  const originalFen = game.fen();

  try {
    // Pawns can never be on rank 1 or 8, so they can't block check there
    const rank = parseInt(square[1]);
    if (type === "p" && (rank === 1 || rank === 8)) return false;

    const success = game.put({ type, color: turn }, square as Square);

    if (!success) {
      game.load(originalFen);
      return false;
    }

    const stillInCheck = game.inCheck();
    game.load(originalFen);

    return !stillInCheck;
  } catch {
    game.load(originalFen);
    return false;
  }
}

/**
 * Get valid placement squares for a piece
 * Considers placement zone and check status
 */
export function getValidPlacementSquares(
  game: Chess,
  pieceType: PieceType,
): string[] {
  const turn = game.turn();
  const board = game.board();
  const isInCheck = game.inCheck();
  const squares: string[] = [];

  board.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      const rank = 8 - rowIndex;
      const squareId = `${String.fromCharCode(97 + colIndex)}${rank}`;

      // Skip occupied squares
      if (piece) return;

      // Must be in placement zone
      if (!isInPlacementZone(squareId, turn)) return;

      // Pawns cannot be placed on the 1st or 8th rank
      if (pieceType === "p" && (rank === 1 || rank === 8)) return;

      if (isInCheck) {
        // When in check, must also block the check
        if (wouldBlockCheck(game, pieceType, squareId)) {
          squares.push(squareId);
        }
      } else {
        // Not in check, any placement zone square is valid
        squares.push(squareId);
      }
    });
  });

  return squares;
}

/**
 * Check if player can block check by placing any piece from their hand
 */
export function canBlockCheckByPlacing(
  game: Chess,
  hand: PieceType[],
  elixir: number,
): boolean {
  if (!game.inCheck()) return false;

  const affordablePieces = hand.filter((p) => PIECE_COSTS[p] <= elixir);
  if (affordablePieces.length === 0) return false;

  for (const pieceType of affordablePieces) {
    const validSquares = getValidPlacementSquares(game, pieceType);
    if (validSquares.length > 0) return true;
  }

  return false;
}

/**
 * Check if player can place any piece (for stalemate detection)
 */
export function canPlaceAnyPiece(
  game: Chess,
  hand: PieceType[],
  elixir: number,
): boolean {
  const affordablePieces = hand.filter((p) => PIECE_COSTS[p] <= elixir);
  if (affordablePieces.length === 0) return false;

  const turn = game.turn();
  const originalFen = game.fen();

  for (const pieceType of affordablePieces) {
    const zoneSquares = getPlacementZoneSquares(turn);

    for (const square of zoneSquares) {
      // Skip occupied squares
      if (game.get(square as Square)) continue;

      try {
        const success = game.put(
          { type: pieceType, color: turn },
          square as Square,
        );
        if (success) {
          const wouldBeInCheck = game.inCheck();
          game.load(originalFen);

          if (!wouldBeInCheck) return true;
        } else {
          game.load(originalFen);
        }
      } catch {
        game.load(originalFen);
      }
    }
  }

  return false;
}

/**
 * Switch turn in a FEN string (used after placing a piece)
 */
export function switchTurnInFen(fen: string, currentTurn: PlayerColor): string {
  const fenParts = fen.split(" ");
  fenParts[1] = currentTurn === "w" ? "b" : "w";

  // Increment full move counter when black moves
  if (currentTurn === "b") {
    fenParts[5] = String(parseInt(fenParts[5]) + 1);
  }

  return fenParts.join(" ");
}
