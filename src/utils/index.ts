// Card utilities - re-exported from shared
export {
  drawCard,
  generateDeck,
  initializeHand,
  cycleCard,
} from "@elixir-chess/shared";

// Chess utilities (use chess.js at runtime, so client-only)
export {
  isInPlacementZone,
  getPlacementZoneSquares,
  wouldBlockCheck,
  getValidPlacementSquares,
  canBlockCheckByPlacing,
  canPlaceAnyPiece,
  switchTurnInFen,
} from "./chess";

// Elixir utilities - re-exported from shared
export { deductElixir, canAfford, addElixir } from "@elixir-chess/shared";
