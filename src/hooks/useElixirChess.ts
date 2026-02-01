import { useState, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import {
  PIECE_COSTS,
  STARTING_ELIXIR,
  MAX_ELIXIR,
  CARD_WEIGHTS,
  HAND_SIZE,
} from "../types/game";
import type {
  GameState,
  PlayerColor,
  PieceType,
  CardHand,
} from "../types/game";

const INITIAL_FEN = "4k3/8/8/8/8/8/8/4K3 w - - 0 1"; // Kings only

// Draw a random card based on weighted probabilities
function drawCard(): PieceType {
  const pieces = Object.keys(CARD_WEIGHTS) as Exclude<PieceType, "k">[];
  const totalWeight = Object.values(CARD_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const piece of pieces) {
    random -= CARD_WEIGHTS[piece];
    if (random <= 0) return piece;
  }
  return "p"; // Fallback
}

// Generate a shuffled deck of cards based on weights
function generateDeck(size: number = 20): PieceType[] {
  const deck: PieceType[] = [];
  for (let i = 0; i < size; i++) {
    deck.push(drawCard());
  }
  return deck;
}

// Initialize a player's hand with 4 cards + next card preview
function initializeHand(): CardHand {
  const deck = generateDeck(20);
  return {
    cards: [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!],
    nextCard: deck.pop()!,
    deck,
  };
}

export function useElixirChess() {
  const chessRef = useRef(new Chess(INITIAL_FEN));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);

  const [gameState, setGameState] = useState<GameState>({
    fen: INITIAL_FEN,
    turn: "w",
    elixir: { w: STARTING_ELIXIR, b: STARTING_ELIXIR },
    hands: {
      w: initializeHand(),
      b: initializeHand(),
    },
    status: "playing",
    history: [],
  });

  // Check if player can block check by placing any affordable piece from their HAND
  const canBlockCheckByPlacing = useCallback(
    (elixir: number, hand: PieceType[]): boolean => {
      const game = chessRef.current;
      const turn = game.turn();

      if (!game.inCheck()) return false;

      const originalFen = game.fen();
      // Only check pieces in hand that are affordable
      const affordablePieces = hand.filter((p) => PIECE_COSTS[p] <= elixir);

      if (affordablePieces.length === 0) return false;

      // Try placing each affordable piece from hand on each empty square
      for (const pieceType of affordablePieces) {
        for (let col = 0; col < 8; col++) {
          for (let row = 1; row <= 8; row++) {
            const square = `${String.fromCharCode(97 + col)}${row}` as Square;

            // Skip occupied squares
            if (game.get(square)) continue;

            try {
              const success = game.put(
                { type: pieceType, color: turn },
                square,
              );
              if (success) {
                const stillInCheck = game.inCheck();
                game.load(originalFen);

                if (!stillInCheck) {
                  return true; // Found a way to block check
                }
              } else {
                game.load(originalFen);
              }
            } catch {
              game.load(originalFen);
            }
          }
        }
      }

      return false;
    },
    [],
  );

  // Check if player can place any piece at all from their HAND (for stalemate check)
  const canPlaceAnyPiece = useCallback(
    (elixir: number, hand: PieceType[]): boolean => {
      const game = chessRef.current;
      const turn = game.turn();

      const originalFen = game.fen();
      // Only check pieces in hand that are affordable
      const affordablePieces = hand.filter((p) => PIECE_COSTS[p] <= elixir);

      if (affordablePieces.length === 0) return false;

      // Try placing each affordable piece on valid zone squares
      for (const pieceType of affordablePieces) {
        for (let col = 0; col < 8; col++) {
          // Check only placement zone (ranks 1-3 for white, 6-8 for black)
          const ranks = turn === "w" ? [1, 2, 3] : [6, 7, 8];
          for (const row of ranks) {
            const square = `${String.fromCharCode(97 + col)}${row}` as Square;

            // Skip occupied squares
            if (game.get(square)) continue;

            try {
              const success = game.put(
                { type: pieceType, color: turn },
                square,
              );
              if (success) {
                // Make sure placing doesn't put ourselves in check
                const inCheck = game.inCheck();
                game.load(originalFen);

                if (!inCheck) {
                  return true; // Found a valid placement
                }
              } else {
                game.load(originalFen);
              }
            } catch {
              game.load(originalFen);
            }
          }
        }
      }

      return false;
    },
    [],
  );

  const updateGameState = useCallback(() => {
    const game = chessRef.current;

    let status: GameState["status"] = "playing";
    let winner: PlayerColor | undefined;

    // Custom checkmate check: it's only checkmate if:
    // 1. chess.js says it's checkmate (no legal moves)
    // 2. AND player can't block by placing a piece from their hand
    const isCheckmateByMoves = game.isCheckmate();

    if (isCheckmateByMoves) {
      // Check if player can block by placing a piece from their hand
      setGameState((prev) => {
        const currentTurn = game.turn();
        const currentElixir = prev.elixir[currentTurn];
        const currentHand = prev.hands[currentTurn].cards;
        const canBlock = canBlockCheckByPlacing(currentElixir, currentHand);

        if (!canBlock) {
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

      // Clear selection after state update
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    } else if (game.isStalemate()) {
      // Stalemate also needs to check if player can place a piece
      // If they can place a piece, it's not stalemate (they have a "move")
      setGameState((prev) => {
        const currentTurn = game.turn();
        const currentElixir = prev.elixir[currentTurn];
        const currentHand = prev.hands[currentTurn].cards;
        const canPlace = canPlaceAnyPiece(currentElixir, currentHand);

        if (!canPlace) {
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
    } else if (game.isDraw()) {
      status = "draw";
    } else if (game.isInsufficientMaterial()) {
      status = "insufficient";
    }

    // Clear selection after state update
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
  }, [canBlockCheckByPlacing, canPlaceAnyPiece]);

  const resetGame = useCallback(() => {
    chessRef.current = new Chess(INITIAL_FEN);
    setSelectedSquare(null);
    setValidMoves([]);
    setGameState({
      fen: INITIAL_FEN,
      turn: "w",
      elixir: { w: STARTING_ELIXIR, b: STARTING_ELIXIR },
      hands: {
        w: initializeHand(),
        b: initializeHand(),
      },
      status: "playing",
      history: [],
    });
  }, []);

  // Select a piece and compute valid moves
  const selectSquare = useCallback(
    (square: string | null) => {
      const game = chessRef.current;

      if (!square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const piece = game.get(square as Square);

      // If clicking on own piece, select it
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square: square as Square, verbose: true });
        setValidMoves(moves.map((m) => m.to));
      } else if (selectedSquare) {
        // If a piece is selected and clicking elsewhere, try to move
        setSelectedSquare(null);
        setValidMoves([]);
      }
    },
    [selectedSquare],
  );

  // Check if placing a piece at a square would block check
  const wouldBlockCheck = useCallback(
    (type: PieceType, square: Square): boolean => {
      const game = chessRef.current;
      const turn = game.turn();

      if (!game.inCheck()) return false;

      const originalFen = game.fen();

      try {
        // Try placing the piece
        const success = game.put({ type, color: turn }, square);
        if (!success) {
          game.load(originalFen);
          return false;
        }

        // Check if still in check after placement
        const stillInCheck = game.inCheck();
        game.load(originalFen);

        return !stillInCheck;
      } catch {
        game.load(originalFen);
        return false;
      }
    },
    [],
  );

  const placePiece = useCallback(
    (type: PieceType, square: Square) => {
      const game = chessRef.current;
      const turn = game.turn();
      const cost = PIECE_COSTS[type];
      const currentElixir = gameState.elixir[turn];
      const currentHand = gameState.hands[turn];
      const wasInCheck = game.inCheck(); // Check if player started turn in check

      // 1. Validation
      if (currentElixir < cost) return false;
      if (game.get(square)) return false; // Occupied

      // Check if piece is in hand
      const cardIndex = currentHand.cards.indexOf(type);
      if (cardIndex === -1) return false; // Piece not in hand!

      // Zone Check - but allow placing anywhere if it blocks check
      const rank = parseInt(square[1]);
      const isInPlacementZone = turn === "w" ? rank <= 3 : rank >= 6;

      if (!isInPlacementZone) {
        // Only allow placing outside zone if in check AND it blocks the check
        if (!wasInCheck || !wouldBlockCheck(type, square)) {
          return false;
        }
      }

      // 2. Execution
      const originalFen = game.fen();

      try {
        const success = game.put({ type, color: turn }, square);
        if (!success) return false;

        // 3. Check for self-check
        if (game.inCheck()) {
          game.load(originalFen);
          return false;
        }

        // 4. Update State
        const newElixir = { ...gameState.elixir };
        newElixir[turn] -= cost; // Deduct cost

        // 5. Update Hand - remove used card, cycle in next card
        const newCards = [...currentHand.cards];
        newCards.splice(cardIndex, 1); // Remove the used card
        newCards.push(currentHand.nextCard); // Add next card to hand

        // Draw new next card from deck, or generate new one if deck empty
        const newDeck = [...currentHand.deck];
        const newNextCard = newDeck.length > 0 ? newDeck.pop()! : drawCard();

        const newHands = {
          ...gameState.hands,
          [turn]: {
            cards: newCards,
            nextCard: newNextCard,
            deck: newDeck,
          },
        };

        // Check if this placement puts opponent in check
        // We need to switch turn to see if opponent's king is attacked
        const currentFen = game.fen();
        const fenParts = currentFen.split(" ");
        fenParts[1] = turn === "w" ? "b" : "w";
        if (turn === "b") {
          fenParts[5] = String(parseInt(fenParts[5]) + 1);
        }
        const newFen = fenParts.join(" ");
        game.load(newFen);
        const opponentNowInCheck = game.inCheck();

        // MUTUAL FREEZE: No elixir gain if there was a check OR we're delivering check
        // This prevents "check farming" exploits
        if (!wasInCheck && !opponentNowInCheck) {
          newElixir[turn] = Math.min(newElixir[turn] + 1, MAX_ELIXIR);
        }

        // Turn is already switched in newFen
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
        console.error(e);
        return false;
      }
    },
    [gameState.elixir, gameState.hands, updateGameState, wouldBlockCheck],
  );

  const makeMove = useCallback(
    (from: Square, to: Square) => {
      const game = chessRef.current;
      const turn = game.turn();
      const wasInCheck = game.inCheck(); // Check if player started turn in check

      try {
        const move = game.move({ from, to, promotion: "q" });
        if (!move) return false;

        // Check if this move puts opponent in check
        const opponentNowInCheck = game.inCheck();

        // MUTUAL FREEZE: No elixir gain if there was a check OR we're delivering check
        // This prevents "check farming" exploits
        const newElixir = { ...gameState.elixir };
        if (!wasInCheck && !opponentNowInCheck) {
          newElixir[turn] = Math.min(newElixir[turn] + 1, MAX_ELIXIR);
        }

        setGameState((prev) => ({
          ...prev,
          elixir: newElixir,
        }));

        updateGameState();
        return true;
      } catch (e) {
        return false;
      }
    },
    [gameState.elixir, updateGameState],
  );

  return {
    gameState,
    chess: chessRef.current,
    resetGame,
    placePiece,
    makeMove,
    setGameState,
    selectedSquare,
    validMoves,
    selectSquare,
    isInCheck: chessRef.current.inCheck(),
  };
}
