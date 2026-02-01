import type { PlayerColor } from "../types/game";
import { MAX_ELIXIR } from "../constants/game";

/**
 * Calculate elixir gain based on check status
 * Implements "Mutual Freeze" rule: no elixir gain if check is involved
 */
export function calculateElixirGain(
  currentElixir: number,
  wasInCheck: boolean,
  opponentNowInCheck: boolean,
): number {
  // No elixir gain if there was a check or we're delivering check
  if (wasInCheck || opponentNowInCheck) {
    return currentElixir;
  }

  return Math.min(currentElixir + 1, MAX_ELIXIR);
}

/**
 * Deduct elixir cost from player's total
 */
export function deductElixir(currentElixir: number, cost: number): number {
  return Math.max(0, currentElixir - cost);
}

/**
 * Check if player can afford a piece
 */
export function canAfford(elixir: number, cost: number): boolean {
  return elixir >= cost;
}

/**
 * Create new elixir state after a turn
 */
export function updateElixirState(
  elixir: Record<PlayerColor, number>,
  turn: PlayerColor,
  cost: number,
  wasInCheck: boolean,
  opponentNowInCheck: boolean,
): Record<PlayerColor, number> {
  const newElixir = { ...elixir };

  // Deduct cost
  newElixir[turn] = deductElixir(newElixir[turn], cost);

  // Add gain (if applicable)
  newElixir[turn] = calculateElixirGain(
    newElixir[turn],
    wasInCheck,
    opponentNowInCheck,
  );

  return newElixir;
}
