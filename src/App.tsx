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

import { useElixirChess } from "./hooks/useElixirChess";
import { Board } from "./components/Board";
import { Shop } from "./components/Shop";
import { TopHUD, BottomHUD } from "./components/GameHUD";
import { PieceIcon } from "./components/PieceIcons";
import { getValidPlacementSquares } from "./utils/chess";
import type { DragData, PieceType } from "./types/game";

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
// Custom Hook for Drag Valid Moves
// ============================================

function useDragValidMoves(
  chess: ReturnType<typeof useElixirChess>["chess"],
  activeDragData: DragData | null,
) {
  return useMemo(() => {
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
}

// ============================================
// App Component
// ============================================

function App() {
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

  // Sensors for drag & drop
  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE_SENSOR_CONFIG),
    useSensor(TouchSensor, TOUCH_SENSOR_CONFIG),
  );

  // Calculate valid drop zones while dragging
  const dragValidMoves = useDragValidMoves(chess, activeDragData);

  // ----------------------------------------
  // Event Handlers
  // ----------------------------------------

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

      // Try to make a move if piece is selected
      if (selectedSquare && validMoves.includes(square)) {
        makeMove(selectedSquare as Square, square as Square);
        return;
      }

      // Select own piece
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

  // ----------------------------------------
  // Render
  // ----------------------------------------

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
        {/* Top HUD - Opponent Elixir + Game Status */}
        <TopHUD
          gameState={gameState}
          timers={timers}
          onRestart={resetGame}
          isInCheck={isInCheck}
          elixirGain={lastElixirGain}
        />

        {/* Board Container */}
        <div className="flex-1 flex items-center justify-center p-2 min-h-0">
          <Board
            game={chess}
            selectedSquare={selectedSquare}
            validMoves={displayedValidMoves}
            onSquareClick={handleSquareClick}
          />
        </div>

        {/* Bottom HUD - Player Elixir */}
        <BottomHUD
          gameState={gameState}
          timers={timers}
          isInCheck={isInCheck}
          elixirGain={lastElixirGain}
        />

        {/* Bottom Card Shop */}
        <Shop turn={gameState.turn} elixir={currentElixir} hand={currentHand} />

        {/* Drag Overlay */}
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

// ============================================
// Drag Preview Component
// ============================================

interface DragPreviewProps {
  type: PieceType;
  color: "w" | "b";
}

const DragPreview: React.FC<DragPreviewProps> = ({ type, color }) => (
  <div
    className="w-14 h-14"
    style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))" }}
  >
    <PieceIcon type={type} color={color} className="w-full h-full" />
  </div>
);

export default App;
