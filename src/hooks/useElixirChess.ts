import { useState, useCallback, useRef, useEffect } from "react";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import type { GameState, PlayerColor, PieceType } from "../types/game";
import {
  INITIAL_FEN,
  STARTING_ELIXIR,
  PIECE_COSTS,
  INITIAL_TIME,
} from "../constants/game";
import { initializeHand, cycleCard } from "../utils/cards";
import {
  isInPlacementZone,
  canBlockCheckByPlacing,
  canPlaceAnyPiece,
  switchTurnInFen,
} from "../utils/chess";
import { addElixir } from "../utils/elixir";

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
    timers: { w: INITIAL_TIME, b: INITIAL_TIME },
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

  // Separate timer state to avoid conflicts with gameState updates
  const [timers, setTimers] = useState<Record<PlayerColor, number>>({
    w: INITIAL_TIME,
    b: INITIAL_TIME,
  });

  // Use ref to track current turn for timer (avoids stale closure)
  const currentTurnRef = useRef<PlayerColor>(gameState.turn);
  currentTurnRef.current = gameState.turn;

  const gameStatusRef = useRef(gameState.status);
  gameStatusRef.current = gameState.status;

  // ----------------------------------------
  // Timer Logic
  // ----------------------------------------

  // Timer runs continuously and reads turn from ref
  useEffect(() => {
    // Only run timer if game is playing
    if (gameState.status !== "playing") {
      return;
    }

    const intervalId = window.setInterval(() => {
      // Read from ref to get latest value
      if (gameStatusRef.current !== "playing") return;

      const currentTurn = currentTurnRef.current;

      setTimers((prev) => {
        const newTime = Math.max(0, prev[currentTurn] - 0.1);

        // Check for timeout
        if (newTime <= 0) {
          // Set game over via gameState
          setGameState((prevGame) => ({
            ...prevGame,
            status: "timeout",
            winner: currentTurn === "w" ? "b" : "w",
          }));
          return { ...prev, [currentTurn]: 0 };
        }

        return { ...prev, [currentTurn]: newTime };
      });
    }, 100); // Update every 100ms

    return () => {
      clearInterval(intervalId);
    };
  }, [gameState.status]); // Only recreate on status change, not turn change

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
    setTimers({ w: INITIAL_TIME, b: INITIAL_TIME });
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
        const newTurn: PlayerColor = turn === "w" ? "b" : "w";

        // Mutual freeze: no elixir gain if check involved
        if (!wasInCheck && !opponentNowInCheck) {
          newElixir[turn] = addElixir(newElixir[turn], 1);
          // Trigger elixir gain animation for the player who just moved
          setLastElixirGain({
            player: turn,
            amount: 1,
            timestamp: Date.now(),
          });
        } else {
          // No elixir gained due to check
          setLastElixirGain(null);
        }

        // Determine game status
        // Note: isDraw() and isInsufficientMaterial() don't apply in Elixir Chess
        // because players can always place new pieces
        let status: GameState["status"] = "playing";
        let winner: PlayerColor | undefined;

        if (game.isCheckmate()) {
          // Check if opponent can block by placing
          if (
            !canBlockCheckByPlacing(
              game,
              gameState.hands[newTurn].cards,
              gameState.elixir[newTurn],
            )
          ) {
            status = "checkmate";
            winner = turn;
          }
        } else if (game.isStalemate()) {
          if (
            !canPlaceAnyPiece(
              game,
              gameState.hands[newTurn].cards,
              gameState.elixir[newTurn],
            )
          ) {
            status = "stalemate";
          }
        }
        // Removed: isDraw() and isInsufficientMaterial() checks

        setGameState((prev) => ({
          ...prev,
          fen: newFen,
          turn: newTurn,
          elixir: newElixir,
          hands: newHands,
          status,
          winner,
          history: game.history(),
        }));

        setSelectedSquare(null);
        setValidMoves([]);
        return true;
      } catch (e) {
        game.load(originalFen);
        console.error("Placement error:", e);
        return false;
      }
    },
    [gameState.elixir, gameState.hands],
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
        const newTurn = game.turn(); // Get the new turn from chess.js

        // Mutual freeze: no elixir gain if check involved
        const newElixir = { ...gameState.elixir };
        if (!wasInCheck && !opponentNowInCheck) {
          newElixir[turn] = addElixir(newElixir[turn], 1);
          // Trigger elixir gain animation for the player who just moved
          setLastElixirGain({
            player: turn,
            amount: 1,
            timestamp: Date.now(),
          });
        } else {
          // No elixir gained due to check
          setLastElixirGain(null);
        }

        // Determine game status
        // Note: isDraw() and isInsufficientMaterial() don't apply in Elixir Chess
        // because players can always place new pieces
        let status: GameState["status"] = "playing";
        let winner: PlayerColor | undefined;

        if (game.isCheckmate()) {
          status = "checkmate";
          winner = turn; // The player who just moved wins
        } else if (game.isStalemate()) {
          status = "stalemate";
        }
        // Removed: isDraw() and isInsufficientMaterial() checks

        setGameState((prev) => ({
          ...prev,
          fen: game.fen(),
          turn: newTurn,
          elixir: newElixir,
          status,
          winner,
          history: game.history(),
        }));

        setSelectedSquare(null);
        setValidMoves([]);
        return true;
      } catch {
        return false;
      }
    },
    [gameState.elixir],
  );

  // ----------------------------------------
  // Return Hook API
  // ----------------------------------------

  return {
    // State
    gameState,
    timers, // Separate timer state
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
