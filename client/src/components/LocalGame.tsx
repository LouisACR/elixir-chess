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

import { useElixirChess } from "../hooks/useElixirChess";
import { Board } from "./Board";
import { Shop } from "./Shop";
import { TopHUD, BottomHUD } from "./GameHUD";
import { PieceIcon } from "./PieceIcons";
import { getValidPlacementSquares } from "../utils/chess";
import type { DragData, PieceType } from "@elixir-chess/shared";

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
// Local Game Component
// ============================================

interface LocalGameProps {
  onBack: () => void;
}

export function LocalGame({ onBack }: LocalGameProps) {
  const {
    gameState,
    timers,
    chess,
    placePiece,
    makeMove,
    resetGame,
    selectedSquare,
    validMoves,
    selectSquare,
    isInCheck,
    lastElixirGain,
  } = useElixirChess();

  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE_SENSOR_CONFIG),
    useSensor(TouchSensor, TOUCH_SENSOR_CONFIG),
  );

  const dragValidMoves = useMemo(() => {
    if (!activeDragData) return [];

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
  }, [activeDragData, chess]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (event.active.data.current) {
        setActiveDragData(event.active.data.current as DragData);
        selectSquare(null);
      }
    },
    [selectSquare],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveDragData(null);

      if (!over || !active.data.current) return;

      const dragData = active.data.current as DragData;
      const targetSquare = over.data.current?.square as Square | undefined;

      if (!targetSquare) return;

      if (dragData.source === "shop") {
        placePiece(dragData.type, targetSquare);
      } else if (dragData.source === "board" && dragData.from) {
        makeMove(dragData.from as Square, targetSquare);
      }
    },
    [placePiece, makeMove],
  );

  const handleSquareClick = useCallback(
    (square: string) => {
      const piece = chess.get(square as Square);
      const turn = chess.turn();

      if (selectedSquare && validMoves.includes(square)) {
        makeMove(selectedSquare as Square, square as Square);
        return;
      }

      if (piece && piece.color === turn) {
        if (selectedSquare === square) {
          selectSquare(null);
        } else {
          selectSquare(square);
        }
      } else {
        selectSquare(null);
      }
    },
    [chess, selectedSquare, validMoves, makeMove, selectSquare],
  );

  const currentHand = gameState.hands[gameState.turn];
  const currentElixir = gameState.elixir[gameState.turn];
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
          onClick={onBack}
          className="absolute top-2 left-2 z-10 px-3 py-1 bg-black/30 hover:bg-black/50 rounded text-white/70 hover:text-white text-sm transition-colors"
        >
          ← Menu
        </button>

        <TopHUD
          gameState={gameState}
          timers={timers}
          onRestart={resetGame}
          isInCheck={isInCheck}
          elixirGain={lastElixirGain}
        />

        <div className="flex-1 flex items-center justify-center p-2 min-h-0">
          <Board
            game={chess}
            selectedSquare={selectedSquare}
            validMoves={displayedValidMoves}
            onSquareClick={handleSquareClick}
          />
        </div>

        <BottomHUD
          gameState={gameState}
          timers={timers}
          isInCheck={isInCheck}
          elixirGain={lastElixirGain}
        />

        <Shop turn={gameState.turn} elixir={currentElixir} hand={currentHand} />

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
