import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useElixirChess } from "./hooks/useElixirChess";
import { Board } from "./components/Board";
import { Shop } from "./components/Shop";
import { GameHUD } from "./components/GameHUD";
import { PieceIcon } from "./components/PieceIcons";
import type { PieceType, PlayerColor } from "./types/game";

function App() {
  const {
    gameState,
    chess,
    placePiece,
    makeMove,
    resetGame,
    selectedSquare,
    validMoves,
    selectSquare,
    isInCheck,
  } = useElixirChess();

  const [activeDragData, setActiveDragData] = useState<{
    type: PieceType;
    color: PlayerColor;
    source: "shop" | "board";
    from?: string; // If source is board
  } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Prevent accidental drags
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Slight delay to distinguish scroll vs drag
        tolerance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current) {
      setActiveDragData(event.active.data.current as any);
      // Clear selection when starting to drag
      selectSquare(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragData(null);

    if (!over || !active.data.current) return;

    const dragData = active.data.current;
    const targetSquare = over.data.current?.square;

    if (!targetSquare) return;

    if (dragData.source === "shop") {
      placePiece(dragData.type, targetSquare);
    } else if (dragData.source === "board") {
      makeMove(dragData.from, targetSquare);
    }
  };

  // Calculate valid drop zones while dragging
  const dragValidMoves = useMemo(() => {
    if (!activeDragData) return [];

    const turn = chess.turn();
    const squares: string[] = [];

    if (activeDragData.source === "shop") {
      // For shop pieces: show placement zone (ranks 1-3 for white, 6-8 for black)
      // Only show empty squares
      const board = chess.board();
      const isInCheck = chess.inCheck();

      board.forEach((row, rowIndex) => {
        row.forEach((piece, colIndex) => {
          const rank = 8 - rowIndex;
          const squareId = `${String.fromCharCode(97 + colIndex)}${rank}`;

          // Check if square is empty
          if (piece) return;

          // Normal placement zone
          const isInPlacementZone = turn === "w" ? rank <= 3 : rank >= 6;

          if (isInPlacementZone) {
            squares.push(squareId);
          } else if (isInCheck) {
            // If in check, also show squares that would block check
            // (simplified - just show all empty squares when in check)
            squares.push(squareId);
          }
        });
      });
    } else if (activeDragData.source === "board" && activeDragData.from) {
      // For board pieces: show valid moves
      const moves = chess.moves({
        square: activeDragData.from as any,
        verbose: true,
      });
      moves.forEach((move) => squares.push(move.to));
    }

    return squares;
  }, [activeDragData, chess]);

  // Handle square clicks for selection and click-to-move
  const handleSquareClick = (square: string) => {
    const piece = chess.get(square as any);
    const turn = chess.turn();

    // If we have a selected piece and clicking a valid move, make the move
    if (selectedSquare && validMoves.includes(square)) {
      makeMove(selectedSquare as any, square as any);
      return;
    }

    // If clicking on own piece, select it
    if (piece && piece.color === turn) {
      if (selectedSquare === square) {
        // Clicking same piece deselects
        selectSquare(null);
      } else {
        selectSquare(square);
      }
    } else {
      // Clicking empty or opponent piece with no selection, deselect
      selectSquare(null);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="game-bg"
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Game Status Bar */}
        <GameHUD
          gameState={gameState}
          onRestart={resetGame}
          isInCheck={isInCheck}
        />

        {/* Board Container - centered */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            minHeight: 0,
          }}
        >
          <Board
            game={chess}
            selectedSquare={selectedSquare}
            validMoves={activeDragData ? dragValidMoves : validMoves}
            onSquareClick={handleSquareClick}
          />
        </div>

        {/* Bottom Card Shop */}
        <Shop
          turn={gameState.turn}
          elixir={gameState.elixir[gameState.turn]}
          hand={gameState.hands[gameState.turn]}
        />

        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
          }}
        >
          {activeDragData ? (
            <div
              style={{
                width: 56,
                height: 56,
                filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5))",
              }}
            >
              <PieceIcon
                type={activeDragData.type}
                color={activeDragData.color}
                className="w-full h-full"
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
