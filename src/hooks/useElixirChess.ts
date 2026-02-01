import { useState, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import type { GameState, PlayerColor, PieceType } from "../types/game";
import {
  INITIAL_FEN,
  STARTING_ELIXIR,
  MAX_ELIXIR,
  PIECE_COSTS,
} from "../constants/game";
import { initializeHand, cycleCard } from "../utils/cards";
import {
  isInPlacementZone,
  canBlockCheckByPlacing,
  canPlaceAnyPiece,
  switchTurnInFen,
} from "../utils/chess";

// ============================================
// Types
// ============================================

export interface ElixirGainEvent {
  player: PlayerColor;
  amount: number;
  timestamp: number;
}

// ============================================
// Initial State Factory
// ============================================

function createInitialGameState(): GameState {
  return {
    fen: INITIAL_FEN,
    turn: "w",
    elixir: { w: STARTING_ELIXIR, b: STARTING_ELIXIR },
    hands: {
      w: initializeHand(),
      b: initializeHand(),
    },
    status: "playing",
    history: [],
  };
}

// ============================================
// Hook
// ============================================

export function useElixirChess() {
  const chessRef = useRef(new Chess(INITIAL_FEN));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [lastElixirGain, setLastElixirGain] = useState<ElixirGainEvent | null>(
    null,
  );

  // ----------------------------------------
  // Game State Updates
  // ----------------------------------------

  const updateGameState = useCallback(() => {
    const game = chessRef.current;

    let status: GameState["status"] = "playing";
    let winner: PlayerColor | undefined;

    const isCheckmateByMoves = game.isCheckmate();

    if (isCheckmateByMoves) {
      // Custom checkmate check: account for blocking with placed pieces
      setGameState((prev) => {
        const currentTurn = game.turn();
        const currentElixir = prev.elixir[currentTurn];
        const currentHand = prev.hands[currentTurn].cards;

        if (!canBlockCheckByPlacing(game, currentHand, currentElixir)) {
          status = "checkmate";
          winner = currentTurn === "w" ? "b" : "w";
        }

        return {
          ...prev,
          fen: game.fen(),
          turn: game.turn(),
          status,
          winner,
          history: game.history(),
        };
      });

      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (game.isStalemate()) {
      // Custom stalemate check: account for piece placement
      setGameState((prev) => {
        const currentTurn = game.turn();
        const currentElixir = prev.elixir[currentTurn];
        const currentHand = prev.hands[currentTurn].cards;

        if (!canPlaceAnyPiece(game, currentHand, currentElixir)) {
          status = "stalemate";
        }

        return {
          ...prev,
          fen: game.fen(),
          turn: game.turn(),
          status,
          winner,
          history: game.history(),
        };
      });

      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (game.isDraw()) {
      status = "draw";
    } else if (game.isInsufficientMaterial()) {
      status = "insufficient";
    }

    setSelectedSquare(null);
    setValidMoves([]);

    setGameState((prev) => ({
      ...prev,
      fen: game.fen(),
      turn: game.turn(),
      status,
      winner,
      history: game.history(),
    }));
  }, []);

  // ----------------------------------------
  // Game Actions
  // ----------------------------------------

  const resetGame = useCallback(() => {
    chessRef.current = new Chess(INITIAL_FEN);
    setSelectedSquare(null);
    setValidMoves([]);
    setGameState(createInitialGameState());
    setLastElixirGain(null);
  }, []);

  const selectSquare = useCallback(
    (square: string | null) => {
      const game = chessRef.current;

      if (!square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const piece = game.get(square as Square);

      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square: square as Square, verbose: true });
        setValidMoves(moves.map((m) => m.to));
      } else if (selectedSquare) {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    },
    [selectedSquare],
  );

  // ----------------------------------------
  // Piece Placement
  // ----------------------------------------

  const placePiece = useCallback(
    (type: PieceType, square: Square) => {
      const game = chessRef.current;
      const turn = game.turn();
      const cost = PIECE_COSTS[type];
      const currentElixir = gameState.elixir[turn];
      const currentHand = gameState.hands[turn];
      const wasInCheck = game.inCheck();

      // Validation
      if (currentElixir < cost) return false;
      if (game.get(square)) return false;

      const cardIndex = currentHand.cards.indexOf(type);
      if (cardIndex === -1) return false;

      if (!isInPlacementZone(square, turn)) return false;

      // Execute placement
      const originalFen = game.fen();

      try {
        const success = game.put({ type, color: turn }, square);
        if (!success) return false;

        // Verify no self-check
        if (game.inCheck()) {
          game.load(originalFen);
          return false;
        }

        // Update elixir
        const newElixir = { ...gameState.elixir };
        newElixir[turn] -= cost;

        // Cycle card
        const newHands = {
          ...gameState.hands,
          [turn]: cycleCard(currentHand, cardIndex),
        };

        // Switch turn and check for opponent check
        const newFen = switchTurnInFen(game.fen(), turn);
        game.load(newFen);
        const opponentNowInCheck = game.inCheck();

        // Mutual freeze: no elixir gain if check involved
        if (!wasInCheck && !opponentNowInCheck) {
          newElixir[turn] = Math.min(newElixir[turn] + 1, MAX_ELIXIR);
          // Trigger elixir gain animation for the player who just moved (now opponent's turn)
          setLastElixirGain({
            player: turn,
            amount: 1,
            timestamp: Date.now(),
          });
        } else {
          // No elixir gained due to check - clear any previous animation
          setLastElixirGain(null);
        }

        setGameState((prev) => ({
          ...prev,
          fen: newFen,
          turn: turn === "w" ? "b" : "w",
          elixir: newElixir,
          hands: newHands,
        }));

        updateGameState();
        return true;
      } catch (e) {
        game.load(originalFen);
        console.error("Placement error:", e);
        return false;
      }
    },
    [gameState.elixir, gameState.hands, updateGameState],
  );

  // ----------------------------------------
  // Move Execution
  // ----------------------------------------

  const makeMove = useCallback(
    (from: Square, to: Square) => {
      const game = chessRef.current;
      const turn = game.turn();
      const wasInCheck = game.inCheck();

      try {
        const move = game.move({ from, to, promotion: "q" });
        if (!move) return false;

        const opponentNowInCheck = game.inCheck();

        // Mutual freeze: no elixir gain if check involved
        const newElixir = { ...gameState.elixir };
        if (!wasInCheck && !opponentNowInCheck) {
          newElixir[turn] = Math.min(newElixir[turn] + 1, MAX_ELIXIR);
          // Trigger elixir gain animation for the player who just moved (now opponent's turn)
          setLastElixirGain({
            player: turn,
            amount: 1,
            timestamp: Date.now(),
          });
        } else {
          // No elixir gained due to check - clear any previous animation
          setLastElixirGain(null);
        }

        setGameState((prev) => ({
          ...prev,
          elixir: newElixir,
        }));

        updateGameState();
        return true;
      } catch {
        return false;
      }
    },
    [gameState.elixir, updateGameState],
  );

  // ----------------------------------------
  // Return Hook API
  // ----------------------------------------

  return {
    // State
    gameState,
    chess: chessRef.current,
    selectedSquare,
    validMoves,
    isInCheck: chessRef.current.inCheck(),
    lastElixirGain,

    // Actions
    resetGame,
    selectSquare,
    placePiece,
    makeMove,
    setGameState,
  };
}
