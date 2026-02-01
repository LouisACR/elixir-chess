import type { PlayerColor } from "../types/game";
import { MAX_ELIXIR } from "../constants/game";

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
 * Add elixir gain (capped at MAX_ELIXIR)
 */
export function addElixir(currentElixir: number, amount: number = 1): number {
  return Math.min(currentElixir + amount, MAX_ELIXIR);
}
