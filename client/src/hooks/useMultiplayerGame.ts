import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Chess, type Square } from "chess.js";
import type {
  PlayerColor,
  PieceType,
  CardHand,
  GameStatus,
  PlayerView,
  ElixirGainEvent,
  Premove,
  Piece,
} from "@elixir-chess/shared";
import { STARTING_ELIXIR, INITIAL_TIME, HAND_SIZE } from "@elixir-chess/shared";
import { getSocket, connectSocket, disconnectSocket } from "../services/socket";

// Re-export for convenience
export type { Premove } from "@elixir-chess/shared";

// ============================================
// Types
// ============================================

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

// Ghost piece represents a piece shown at premove destination
export interface GhostPiece {
  square: string;
  piece: Piece;
}

// Helper to get all theoretically possible squares a piece could move to
// This is used for premoves - we show all possible targets, validation happens on execution
function getPremoveTargets(
  chess: Chess,
  square: Square,
  playerColor: PlayerColor,
): string[] {
  const piece = chess.get(square);
  if (!piece || piece.color !== playerColor) return [];

  const file = square.charCodeAt(0) - 97; // 0-7
  const rank = parseInt(square[1]) - 1; // 0-7
  const targets: Set<string> = new Set();

  const addIfValid = (f: number, r: number) => {
    if (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
      const sq = String.fromCharCode(97 + f) + (r + 1);
      // Don't include squares with own pieces
      const targetPiece = chess.get(sq as Square);
      if (!targetPiece || targetPiece.color !== playerColor) {
        targets.add(sq);
      }
    }
  };

  switch (piece.type) {
    case "p": {
      const dir = playerColor === "w" ? 1 : -1;
      // Forward moves
      addIfValid(file, rank + dir);
      if (
        (playerColor === "w" && rank === 1) ||
        (playerColor === "b" && rank === 6)
      ) {
        addIfValid(file, rank + 2 * dir);
      }
      // Captures (diagonal)
      addIfValid(file - 1, rank + dir);
      addIfValid(file + 1, rank + dir);
      break;
    }
    case "n": {
      const knightMoves = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      for (const [df, dr] of knightMoves) {
        addIfValid(file + df, rank + dr);
      }
      break;
    }
    case "b": {
      for (let i = 1; i <= 7; i++) {
        addIfValid(file + i, rank + i);
        addIfValid(file + i, rank - i);
        addIfValid(file - i, rank + i);
        addIfValid(file - i, rank - i);
      }
      break;
    }
    case "r": {
      for (let i = 1; i <= 7; i++) {
        addIfValid(file + i, rank);
        addIfValid(file - i, rank);
        addIfValid(file, rank + i);
        addIfValid(file, rank - i);
      }
      break;
    }
    case "q": {
      for (let i = 1; i <= 7; i++) {
        addIfValid(file + i, rank);
        addIfValid(file - i, rank);
        addIfValid(file, rank + i);
        addIfValid(file, rank - i);
        addIfValid(file + i, rank + i);
        addIfValid(file + i, rank - i);
        addIfValid(file - i, rank + i);
        addIfValid(file - i, rank - i);
      }
      break;
    }
    case "k": {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df !== 0 || dr !== 0) {
            addIfValid(file + df, rank + dr);
          }
        }
      }
      // Castling squares
      if (playerColor === "w") {
        addIfValid(6, 0); // g1
        addIfValid(2, 0); // c1
      } else {
        addIfValid(6, 7); // g8
        addIfValid(2, 7); // c8
      }
      break;
    }
  }

  return Array.from(targets);
}

export interface MultiplayerGameState {
  fen: string;
  turn: PlayerColor;
  elixir: Record<PlayerColor, number>;
  timers: Record<PlayerColor, number>;
  status: GameStatus;
  winner?: PlayerColor;
  history: string[];
  myHand: CardHand;
  opponentCardCount: number;
  premoves: Premove[];
}

interface OptimisticAction {
  id: string;
  type: "PLACE_PIECE" | "MOVE_PIECE";
  previousState: MultiplayerGameState;
}

// ============================================
// Initial State
// ============================================

const EMPTY_HAND: CardHand = {
  cards: [],
  nextCard: "p",
  deck: [],
};

const INITIAL_MULTIPLAYER_STATE: MultiplayerGameState = {
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  turn: "w",
  elixir: { w: STARTING_ELIXIR, b: STARTING_ELIXIR },
  timers: { w: INITIAL_TIME, b: INITIAL_TIME },
  status: "waiting",
  history: [],
  myHand: EMPTY_HAND,
  opponentCardCount: HAND_SIZE,
  premoves: [],
};

// ============================================
// Hook
// ============================================

export function useMultiplayerGame() {
  // Connection state
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<PlayerColor | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [gameState, setGameState] = useState<MultiplayerGameState>(
    INITIAL_MULTIPLAYER_STATE,
  );
  const [lastElixirGain, setLastElixirGain] = useState<ElixirGainEvent | null>(
    null,
  );

  // Chess instance for local validation and display
  const chessRef = useRef<Chess>(new Chess());

  // Optimistic updates queue
  const optimisticQueue = useRef<OptimisticAction[]>([]);

  // Selection state (for click-to-move)
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);

  // Premove selection state (for building the next premove)
  const [premoveValidMoves, setPremoveValidMoves] = useState<string[]>([]);

  // Keep chess in sync with game state
  useEffect(() => {
    try {
      chessRef.current.load(gameState.fen);
    } catch (e) {
      console.error("Failed to load FEN:", e);
    }
  }, [gameState.fen]);

  // Compute ghost pieces from premoves
  // This simulates the board state after all premoves are applied
  const ghostPieces = useMemo((): GhostPiece[] => {
    if (!playerColor || gameState.premoves.length === 0) return [];

    const ghosts: GhostPiece[] = [];
    const tempChess = new Chess(gameState.fen);

    // Track which squares have been "vacated" by premoves
    const vacatedSquares = new Set<string>();

    for (const premove of gameState.premoves) {
      const piece = tempChess.get(premove.from as Square);
      if (piece && piece.color === playerColor) {
        // Try to simulate the move
        try {
          tempChess.move({
            from: premove.from as Square,
            to: premove.to as Square,
            promotion: "q",
          });
          vacatedSquares.add(premove.from);
        } catch {
          // If move fails in simulation, still show ghost at destination
          // The server will validate and clear if invalid
          ghosts.push({
            square: premove.to,
            piece: { type: piece.type, color: piece.color },
          });
          vacatedSquares.add(premove.from);
        }
      }
    }

    // Add ghosts for the final positions after all premoves
    for (const premove of gameState.premoves) {
      const originalPiece = chessRef.current.get(premove.from as Square);
      if (originalPiece && originalPiece.color === playerColor) {
        ghosts.push({
          square: premove.to,
          piece: { type: originalPiece.type, color: originalPiece.color },
        });
      }
    }

    return ghosts;
  }, [gameState.fen, gameState.premoves, playerColor]);

  // ============================================
  // Socket Event Handlers
  // ============================================

  useEffect(() => {
    const socket = getSocket();

    const handleRoomCreated = ({
      roomId,
      playerColor,
    }: {
      roomId: string;
      playerColor: PlayerColor;
    }) => {
      setRoomId(roomId);
      setPlayerColor(playerColor);
      setError(null);
    };

    const handleRoomJoined = ({
      roomId,
      playerColor,
    }: {
      roomId: string;
      playerColor: PlayerColor;
    }) => {
      setRoomId(roomId);
      setPlayerColor(playerColor);
      setError(null);
    };

    const handleGameStart = (view: PlayerView) => {
      setGameState({
        ...view.gameState,
        myHand: view.gameState.myHand,
        opponentCardCount: view.gameState.opponentCardCount,
      });
      optimisticQueue.current = [];
    };

    const handleGameStateUpdate = (
      data: PlayerView & { gainEvent?: ElixirGainEvent },
    ) => {
      // Clear optimistic queue on server state
      optimisticQueue.current = [];

      setGameState({
        ...data.gameState,
        myHand: data.gameState.myHand,
        opponentCardCount: data.gameState.opponentCardCount,
      });

      if (data.gainEvent) {
        setLastElixirGain(data.gainEvent);
      }
    };

    const handleTimerTick = ({
      timers,
    }: {
      timers: Record<PlayerColor, number>;
    }) => {
      setGameState((prev) => ({ ...prev, timers }));
    };

    const handleElixirUpdate = ({
      elixir,
      gainEvent,
    }: {
      elixir: Record<PlayerColor, number>;
      gainEvent?: ElixirGainEvent;
    }) => {
      setGameState((prev) => ({ ...prev, elixir }));
      if (gainEvent) {
        setLastElixirGain(gainEvent);
      }
    };

    const handleActionRejected = ({
      action,
      reason,
    }: {
      action: string;
      reason: string;
    }) => {
      console.warn(`Action ${action} rejected: ${reason}`);

      // Rollback optimistic update
      const lastOptimistic = optimisticQueue.current.pop();
      if (lastOptimistic) {
        setGameState(lastOptimistic.previousState);
      }

      setError(reason);
      setTimeout(() => setError(null), 3000);
    };

    const handleGameOver = ({
      status,
      winner,
    }: {
      status: GameStatus;
      winner?: PlayerColor;
    }) => {
      setGameState((prev) => ({ ...prev, status, winner }));
    };

    const handlePlayerDisconnected = ({
      playerColor: disconnectedColor,
    }: {
      playerColor: PlayerColor;
    }) => {
      console.log(`Player ${disconnectedColor} disconnected`);
      // Could show a notification here
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    };

    const handlePremovesCleared = ({ reason }: { reason: string }) => {
      console.log(`Premoves cleared: ${reason}`);
      // Clear local selection state
      setSelectedSquare(null);
      setValidMoves([]);
      setPremoveValidMoves([]);
    };

    const handleDisconnect = () => {
      setConnectionStatus("disconnected");
    };

    const handleConnect = () => {
      setConnectionStatus("connected");
    };

    socket.on("ROOM_CREATED", handleRoomCreated);
    socket.on("ROOM_JOINED", handleRoomJoined);
    socket.on("GAME_START", handleGameStart);
    socket.on("GAME_STATE_UPDATE", handleGameStateUpdate);
    socket.on("TIMER_TICK", handleTimerTick);
    socket.on("ELIXIR_UPDATE", handleElixirUpdate);
    socket.on("ACTION_REJECTED", handleActionRejected);
    socket.on("GAME_OVER", handleGameOver);
    socket.on("PLAYER_DISCONNECTED", handlePlayerDisconnected);
    socket.on("PREMOVES_CLEARED", handlePremovesCleared);
    socket.on("ERROR", handleError);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("ROOM_CREATED", handleRoomCreated);
      socket.off("ROOM_JOINED", handleRoomJoined);
      socket.off("GAME_START", handleGameStart);
      socket.off("GAME_STATE_UPDATE", handleGameStateUpdate);
      socket.off("TIMER_TICK", handleTimerTick);
      socket.off("ELIXIR_UPDATE", handleElixirUpdate);
      socket.off("ACTION_REJECTED", handleActionRejected);
      socket.off("GAME_OVER", handleGameOver);
      socket.off("PLAYER_DISCONNECTED", handlePlayerDisconnected);
      socket.off("PREMOVES_CLEARED", handlePremovesCleared);
      socket.off("ERROR", handleError);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect", handleConnect);
    };
  }, []);

  // ============================================
  // Connection Actions
  // ============================================

  const connect = useCallback(async () => {
    setConnectionStatus("connecting");
    setError(null);
    try {
      await connectSocket();
      setConnectionStatus("connected");
    } catch (e) {
      setConnectionStatus("error");
      setError(e instanceof Error ? e.message : "Failed to connect");
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectSocket();
    setConnectionStatus("disconnected");
    setRoomId(null);
    setPlayerColor(null);
    setGameState(INITIAL_MULTIPLAYER_STATE);
  }, []);

  // ============================================
  // Room Actions
  // ============================================

  const createRoom = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("CREATE_ROOM");
    }
  }, []);

  const joinRoom = useCallback((roomCode: string) => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("JOIN_ROOM", { roomId: roomCode.toUpperCase() });
    }
  }, []);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("LEAVE_ROOM");
    }
    setRoomId(null);
    setPlayerColor(null);
    setGameState(INITIAL_MULTIPLAYER_STATE);
  }, []);

  // ============================================
  // Game Actions (with optimistic updates)
  // ============================================

  const placePiece = useCallback(
    (type: PieceType, square: Square): boolean => {
      if (!playerColor || gameState.turn !== playerColor) return false;
      if (gameState.status !== "playing") return false;

      const socket = getSocket();
      if (!socket.connected) return false;

      // Save state for potential rollback
      const previousState = { ...gameState };
      const actionId = `${Date.now()}-${Math.random()}`;

      // Optimistic update - apply locally
      const cardIndex = gameState.myHand.cards.indexOf(type);
      if (cardIndex === -1) return false;

      // Apply optimistic update
      optimisticQueue.current.push({
        id: actionId,
        type: "PLACE_PIECE",
        previousState,
      });

      // Emit to server
      socket.emit("PLACE_PIECE", { type, square });

      return true;
    },
    [playerColor, gameState],
  );

  const makeMove = useCallback(
    (from: Square, to: Square): boolean => {
      if (!playerColor || gameState.turn !== playerColor) return false;
      if (gameState.status !== "playing") return false;

      const socket = getSocket();
      if (!socket.connected) return false;

      // Save state for potential rollback
      const previousState = { ...gameState };
      const actionId = `${Date.now()}-${Math.random()}`;

      // Push optimistic action
      optimisticQueue.current.push({
        id: actionId,
        type: "MOVE_PIECE",
        previousState,
      });

      // Emit to server
      socket.emit("MOVE_PIECE", { from, to });

      return true;
    },
    [playerColor, gameState],
  );

  const restartGame = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("RESTART_GAME");
    }
  }, []);

  // ============================================
  // Selection Logic (with multiple premove support)
  // ============================================

  // Add a premove to the queue
  const addPremove = useCallback(
    (from: string, to: string) => {
      const socket = getSocket();
      if (!socket.connected || !playerColor) return;

      const newPremoves = [...gameState.premoves, { from, to }];
      socket.emit("SET_PREMOVES", { premoves: newPremoves });
    },
    [playerColor, gameState.premoves],
  );

  // Cancel all premoves
  const cancelPremoves = useCallback(() => {
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("CLEAR_PREMOVES");
    }
    setSelectedSquare(null);
    setValidMoves([]);
    setPremoveValidMoves([]);
  }, []);

  const selectSquare = useCallback(
    (square: string | null) => {
      if (!square) {
        setSelectedSquare(null);
        setValidMoves([]);
        setPremoveValidMoves([]);
        return;
      }

      if (!playerColor || gameState.status !== "playing") return;

      const isMyTurnNow = gameState.turn === playerColor;
      const piece = chessRef.current.get(square as Square);
      const isOwnPiece = piece && piece.color === playerColor;

      // Also check if there's a "ghost" piece here (from premove)
      const lastPremoveToHere = gameState.premoves.find(
        (pm) => pm.to === square,
      );
      const hasGhostPiece = lastPremoveToHere !== undefined;

      // === DURING MY TURN ===
      if (isMyTurnNow) {
        // If we have a selected square and click a valid move target, make the move
        if (selectedSquare && validMoves.includes(square)) {
          makeMove(selectedSquare as Square, square as Square);
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }

        // Click on own piece: select it and show valid moves
        if (isOwnPiece) {
          if (selectedSquare === square) {
            // Deselect
            setSelectedSquare(null);
            setValidMoves([]);
          } else {
            setSelectedSquare(square);
            const moves = chessRef.current.moves({
              square: square as Square,
              verbose: true,
            });
            setValidMoves(moves.map((m) => m.to));
          }
        } else {
          // Click on empty or opponent piece without valid move: deselect
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
      // === DURING OPPONENT'S TURN (PREMOVE MODE) ===
      else {
        // If we have a piece selected for premove and click a valid premove target
        if (selectedSquare && premoveValidMoves.includes(square)) {
          // Add the premove
          addPremove(selectedSquare, square);
          setSelectedSquare(null);
          setValidMoves([]);
          setPremoveValidMoves([]);
          return;
        }

        // Check if clicking on a ghost piece (piece at premove destination)
        if (hasGhostPiece) {
          // Select the ghost piece for chaining premoves
          const originalFrom = lastPremoveToHere.from;
          const originalPiece = chessRef.current.get(originalFrom as Square);

          if (originalPiece && originalPiece.color === playerColor) {
            if (selectedSquare === square) {
              setSelectedSquare(null);
              setValidMoves([]);
              setPremoveValidMoves([]);
            } else {
              setSelectedSquare(square);
              setValidMoves([]);
              // Show premove targets from this ghost position
              const targets = getPremoveTargets(
                chessRef.current,
                originalFrom as Square,
                playerColor,
              );
              // Filter out the current position since piece is "moving" from ghost pos
              setPremoveValidMoves(targets.filter((t) => t !== square));
            }
            return;
          }
        }

        // Click on own piece: select it for premove
        if (isOwnPiece) {
          // Check if this piece hasn't already been premoved away
          const isPremoved = gameState.premoves.some(
            (pm) => pm.from === square,
          );

          if (isPremoved) {
            // Piece already has premove, can't select original position
            setSelectedSquare(null);
            setValidMoves([]);
            setPremoveValidMoves([]);
            return;
          }

          if (selectedSquare === square) {
            // Deselect
            setSelectedSquare(null);
            setValidMoves([]);
            setPremoveValidMoves([]);
          } else {
            setSelectedSquare(square);
            setValidMoves([]);
            // For premove, show ALL theoretically possible squares
            const targets = getPremoveTargets(
              chessRef.current,
              square as Square,
              playerColor,
            );
            setPremoveValidMoves(targets);
          }
        } else {
          // Click on empty or opponent piece without premove target selected: deselect
          setSelectedSquare(null);
          setValidMoves([]);
          setPremoveValidMoves([]);
        }
      }
    },
    [
      selectedSquare,
      validMoves,
      premoveValidMoves,
      playerColor,
      gameState.turn,
      gameState.status,
      gameState.premoves,
      makeMove,
      addPremove,
    ],
  );

  // ============================================
  // Derived State
  // ============================================

  const isMyTurn = playerColor === gameState.turn;
  const isInCheck = chessRef.current.inCheck();

  return {
    // Connection
    connectionStatus,
    connect,
    disconnect,
    error,

    // Room
    roomId,
    playerColor,
    createRoom,
    joinRoom,
    leaveRoom,

    // Game state
    gameState,
    chess: chessRef.current,
    isMyTurn,
    isInCheck,
    lastElixirGain,

    // Selection
    selectedSquare,
    validMoves,
    selectSquare,

    // Premove
    premoves: gameState.premoves,
    premoveValidMoves,
    ghostPieces,
    cancelPremoves,

    // Actions
    placePiece,
    makeMove,
    restartGame,
  };
}
