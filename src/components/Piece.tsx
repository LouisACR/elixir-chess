import React from 'react';
import { PieceIcon } from './PieceIcons';
import type { Piece as PieceModel } from '../types/game';
import { clsx } from 'clsx';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface PieceProps {
  piece: PieceModel;
  square: string; // e.g. 'e2'
  canDrag?: boolean;
  className?: string;
}

export const Piece: React.FC<PieceProps> = ({ piece, square, canDrag = true, className }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `piece-${square}`,
    data: { from: square, type: piece.type, color: piece.color, source: 'board' },
    disabled: !canDrag
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1, // Hide original when dragging (if using DragOverlay)
    zIndex: isDragging ? 50 : 'auto',
    cursor: canDrag ? 'grab' : 'default',
    touchAction: 'none', // Critical for mobile dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={clsx("w-full h-full flex items-center justify-center p-1", className)}
    >
      <PieceIcon type={piece.type} color={piece.color} className="w-full h-full drop-shadow-md" />
    </div>
  );
};
