import { useState, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { PIECE_COSTS, STARTING_ELIXIR, MAX_ELIXIR } from '../types/game';
import type { GameState, PlayerColor, PieceType } from '../types/game';

const INITIAL_FEN = '4k3/8/8/8/8/8/8/4K3 w - - 0 1'; // Kings only

export function useElixirChess() {
  const chessRef = useRef(new Chess(INITIAL_FEN));

  const [gameState, setGameState] = useState<GameState>({
    fen: INITIAL_FEN,
    turn: 'w',
    elixir: { w: STARTING_ELIXIR, b: STARTING_ELIXIR },
    status: 'playing',
    history: []
  });

  const updateGameState = useCallback(() => {
    const game = chessRef.current;

    let status: GameState['status'] = 'playing';
    let winner: PlayerColor | undefined;

    if (game.isCheckmate()) {
      status = 'checkmate';
      winner = game.turn() === 'w' ? 'b' : 'w';
    } else if (game.isDraw()) {
      status = 'draw';
    } else if (game.isStalemate()) {
      status = 'stalemate';
    } else if (game.isInsufficientMaterial()) {
      status = 'insufficient';
    }

    setGameState(prev => ({
      ...prev,
      fen: game.fen(),
      turn: game.turn(),
      status,
      winner,
      history: game.history()
    }));
  }, []);

  const resetGame = useCallback(() => {
    chessRef.current = new Chess(INITIAL_FEN);
    setGameState({
      fen: INITIAL_FEN,
      turn: 'w',
      elixir: { w: STARTING_ELIXIR, b: STARTING_ELIXIR },
      status: 'playing',
      history: []
    });
  }, []);

  const placePiece = useCallback((type: PieceType, square: Square) => {
    const game = chessRef.current;
    const turn = game.turn();
    const cost = PIECE_COSTS[type];
    const currentElixir = gameState.elixir[turn];

    // 1. Validation
    if (currentElixir < cost) return false;
    if (game.get(square)) return false; // Occupied

    // Zone Check
    const rank = parseInt(square[1]);
    if (turn === 'w') {
      if (rank > 3) return false;
    } else {
      if (rank < 6) return false;
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
      newElixir[turn] = Math.min(newElixir[turn] + 1, MAX_ELIXIR); // Gain +1 for ending turn

      // Switch turn manually
      const fenParts = game.fen().split(' ');
      fenParts[1] = turn === 'w' ? 'b' : 'w';
      if (turn === 'b') {
        fenParts[5] = String(parseInt(fenParts[5]) + 1);
      }
      const newFen = fenParts.join(' ');
      game.load(newFen);

      setGameState(prev => ({
        ...prev,
        fen: newFen,
        turn: turn === 'w' ? 'b' : 'w',
        elixir: newElixir,
      }));

      updateGameState();
      return true;

    } catch (e) {
      game.load(originalFen);
      console.error(e);
      return false;
    }
  }, [gameState.elixir, updateGameState]);

  const makeMove = useCallback((from: Square, to: Square) => {
    const game = chessRef.current;
    const turn = game.turn();

    try {
      const move = game.move({ from, to, promotion: 'q' });
      if (!move) return false;

      // Update Elixir
      const newElixir = { ...gameState.elixir };
      newElixir[turn] = Math.min(newElixir[turn] + 1, MAX_ELIXIR);

      setGameState(prev => ({
        ...prev,
        elixir: newElixir
      }));

      updateGameState();
      return true;
    } catch (e) {
      return false;
    }
  }, [gameState.elixir, updateGameState]);

  return {
    gameState,
    chess: chessRef.current,
    resetGame,
    placePiece,
    makeMove,
    setGameState
  };
}
