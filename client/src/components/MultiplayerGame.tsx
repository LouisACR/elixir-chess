import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { Square } from "chess.js";

import { useMultiplayerGame } from "../hooks/useMultiplayerGame";
import { Board } from "./Board";
import { Shop } from "./Shop";
import { TopHUD, BottomHUD } from "./GameHUD";
import { GameOverOverlay } from "./GameOverOverlay";
import {
  GameControlButtons,
  DrawOfferPopup,
  DrawDeclinedToast,
} from "./GameControls";
import { PieceIcon } from "./PieceIcons";
import { LobbyScreen } from "./Lobby";
import { Chat } from "./Chat";
import { getValidPlacementSquares } from "../utils/chess";
import type { DragData, PieceType, CardHand } from "@elixir-chess/shared";

// ============================================
// Drag & Drop Configuration
// ============================================

const MOUSE_SENSOR_CONFIG = {
  activationConstraint: { distance: 5 },
};

const TOUCH_SENSOR_CONFIG = {
  activationConstraint: { delay: 100, tolerance: 5 },
};

const DROP_ANIMATION = {
  duration: 200,
  easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
};

// ============================================
// Drag Preview
// ============================================

const DragPreview: React.FC<{ type: PieceType; color: "w" | "b" }> = ({
  type,
  color,
}) => (
  <div className="w-14 h-14 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
    <PieceIcon type={type} color={color} className="w-full h-full" />
  </div>
);

// ============================================
// Multiplayer Game Component
// ============================================

interface MultiplayerGameProps {
  onBack: () => void;
}

export function MultiplayerGame({ onBack }: MultiplayerGameProps) {
  const {
    connectionStatus,
    connect,
    disconnect,
    error,
    roomId,
    playerColor,
    createRoom,
    joinRoom,
    leaveRoom,
    gameState,
    chess,
    isMyTurn,
    isInCheck,
    lastElixirGain,
    selectedSquare,
    validMoves,
    selectSquare,
    premoves,
    premoveValidMoves,
    premoveVisuals,
    cancelPremoves,
    placePiece,
    makeMove,
    restartGame,
    resign,
    offerDraw,
    respondToDraw,
    pendingDrawOffer,
    drawDeclined,
  } = useMultiplayerGame();

  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE_SENSOR_CONFIG),
    useSensor(TouchSensor, TOUCH_SENSOR_CONFIG),
  );

  // Convert multiplayer state to local-compatible GameState for HUD components
  const hudGameState = useMemo(
    () => ({
      fen: gameState.fen,
      turn: gameState.turn,
      elixir: gameState.elixir,
      hands: {
        w:
          playerColor === "w"
            ? gameState.myHand
            : { cards: [], nextCard: "p" as PieceType, deck: [] },
        b:
          playerColor === "b"
            ? gameState.myHand
            : { cards: [], nextCard: "p" as PieceType, deck: [] },
      } as Record<"w" | "b", CardHand>,
      timers: gameState.timers,
      status: gameState.status,
      winner: gameState.winner,
      history: gameState.history,
    }),
    [gameState, playerColor],
  );

  const dragValidMoves = useMemo(() => {
    if (!activeDragData || !isMyTurn) return [];

    if (activeDragData.source === "shop") {
      return getValidPlacementSquares(chess, activeDragData.type);
    }

    if (activeDragData.source === "board" && activeDragData.from) {
      const moves = chess.moves({
        square: activeDragData.from as Square,
        verbose: true,
      });
      return moves.map((m) => m.to);
    }

    return [];
  }, [activeDragData, chess, isMyTurn]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!isMyTurn) return;
      if (event.active.data.current) {
        setActiveDragData(event.active.data.current as DragData);
        selectSquare(null);
      }
    },
    [selectSquare, isMyTurn],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragData(null);

      if (!isMyTurn) return;
      if (!over || !active.data.current) return;

      const dragData = active.data.current as DragData;
      const targetSquare = over.data.current?.square as Square | undefined;

      if (!targetSquare) return;

      if (dragData.source === "shop") {
        if (!dragValidMoves.includes(targetSquare)) return;
        placePiece(dragData.type, targetSquare);
      } else if (dragData.source === "board" && dragData.from) {
        makeMove(dragData.from as Square, targetSquare);
      }
    },
    [placePiece, makeMove, isMyTurn, dragValidMoves],
  );

  const handleSquareClick = useCallback(
    (square: string) => {
      // All logic (normal moves and premoves) is handled by selectSquare
      selectSquare(square);
    },
    [selectSquare],
  );

  // Handle right-click to cancel premoves
  const handleBoardRightClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (premoves.length > 0) {
        cancelPremoves();
      }
    },
    [premoves, cancelPremoves],
  );

  const handleBack = useCallback(() => {
    leaveRoom();
    disconnect();
    onBack();
  }, [leaveRoom, disconnect, onBack]);

  // Show lobby if not in game
  if (gameState.status === "waiting" || !roomId) {
    return (
      <LobbyScreen
        connectionStatus={connectionStatus}
        roomId={roomId}
        playerColor={playerColor}
        error={error}
        onConnect={connect}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onBack={handleBack}
      />
    );
  }

  const myElixir = playerColor ? gameState.elixir[playerColor] : 0;
  const displayedValidMoves = activeDragData ? dragValidMoves : validMoves;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="game-bg h-full w-full flex flex-col overflow-hidden">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/30 hover:bg-black/50 rounded text-white/70 hover:text-white text-sm transition-colors"
        >
          ← Leave
        </button>

        {/* Room code and turn indicator */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {!isMyTurn && gameState.status === "playing" && (
            <div className="px-3 py-1 bg-amber-600/80 rounded text-white text-sm font-bold animate-pulse">
              Waiting...
            </div>
          )}
          <div className="px-3 py-1 bg-black/30 rounded text-white/70 text-sm font-mono">
            Room: {roomId}
          </div>
        </div>

        {/* Game Control Buttons (Resign & Draw) */}
        <GameControlButtons
          onResign={resign}
          onOfferDraw={offerDraw}
          isPlaying={gameState.status === "playing"}
        />

        {/* Draw Offer Popup */}
        {pendingDrawOffer &&
          pendingDrawOffer !== playerColor &&
          gameState.status === "playing" && (
            <DrawOfferPopup
              from={pendingDrawOffer}
              onAccept={() => respondToDraw(true)}
              onDecline={() => respondToDraw(false)}
            />
          )}

        {/* Draw Declined Toast */}
        <DrawDeclinedToast visible={drawDeclined} />

        <TopHUD
          gameState={hudGameState}
          timers={gameState.timers}
          onRestart={restartGame}
          isInCheck={isInCheck}
          elixirGain={lastElixirGain}
          playerPerspective={playerColor || "w"}
        />

        <div
          className="flex-1 flex items-center justify-center p-2 min-h-0"
          onContextMenu={handleBoardRightClick}
        >
          <Board
            game={chess}
            selectedSquare={selectedSquare}
            validMoves={displayedValidMoves}
            onSquareClick={handleSquareClick}
            flipped={playerColor === "b"}
            premoves={premoves}
            premoveValidMoves={premoveValidMoves}
            ghostPieces={premoveVisuals.ghostPieces}
            hiddenSquares={premoveVisuals.hiddenSquares}
          />
        </div>

        <BottomHUD
          gameState={hudGameState}
          timers={gameState.timers}
          isInCheck={isInCheck}
          elixirGain={lastElixirGain}
          playerPerspective={playerColor || "w"}
        />

        {/* Only show own hand in multiplayer */}
        <Shop
          turn={playerColor || "w"}
          elixir={myElixir}
          hand={gameState.myHand}
        />

        {/* Chat */}
        <Chat
          playerColor={playerColor}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />

        {/* Game Over Overlay */}
        <GameOverOverlay
          status={gameState.status}
          winner={gameState.winner}
          playerColor={playerColor || undefined}
          onRestart={restartGame}
          onBack={handleBack}
          isMultiplayer={true}
        />

        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {activeDragData && (
            <DragPreview
              type={activeDragData.type}
              color={activeDragData.color}
            />
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
