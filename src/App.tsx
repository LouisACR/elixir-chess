import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useElixirChess } from './hooks/useElixirChess';
import { Board } from './components/Board';
import { Shop } from './components/Shop';
import { GameHUD } from './components/GameHUD';
import { PieceIcon } from './components/PieceIcons';
import type { PieceType, PlayerColor } from './types/game';

function App() {
  const { gameState, chess, placePiece, makeMove, resetGame } = useElixirChess();

  const [activeDragData, setActiveDragData] = useState<{
    type: PieceType;
    color: PlayerColor;
    source: 'shop' | 'board';
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
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current) {
      setActiveDragData(event.active.data.current as any);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragData(null);

    if (!over || !active.data.current) return;

    const dragData = active.data.current;
    const targetSquare = over.data.current?.square;

    if (!targetSquare) return;

    if (dragData.source === 'shop') {
      placePiece(dragData.type, targetSquare);
    } else if (dragData.source === 'board') {
      makeMove(dragData.from, targetSquare);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-stone-100 min-h-screen py-6 px-4 flex flex-col items-center">
        <h1 className="text-3xl font-black text-stone-800 mb-6 tracking-tight">Elixir Chess ♟️</h1>

        <GameHUD gameState={gameState} onRestart={resetGame} />

        <Board game={chess} />

        <Shop turn={gameState.turn} elixir={gameState.elixir[gameState.turn]} />

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeDragData ? (
             <div className="w-12 h-12 pointer-events-none drop-shadow-xl">
                <PieceIcon type={activeDragData.type} color={activeDragData.color} className="w-full h-full" />
             </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
