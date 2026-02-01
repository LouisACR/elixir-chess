import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface SquareProps {
  id: string; // The square notation e.g. 'e4'
  isBlack: boolean;
  children?: React.ReactNode;
  isValidDrop?: boolean; // For highlighting valid moves
  onClick?: () => void;
  className?: string;
}

export const Square = ({ id, isBlack, children, isValidDrop, onClick, className }: SquareProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { square: id }
  });

  return (
    <div
      ref={setNodeRef}
      data-testid={`square-${id}`}
      className={twMerge(
        clsx(
          "relative w-full h-full flex items-center justify-center select-none",
          isBlack ? "bg-stone-600" : "bg-stone-300",
          isValidDrop && !children && "after:absolute after:inset-4 after:bg-green-500/30 after:rounded-full", // Dot for empty valid
          isValidDrop && children && "after:absolute after:inset-0 after:bg-green-500/30", // Highlight for capture
          isOver && "ring-inset ring-4 ring-yellow-400", // Drop target highlight
          className
        )
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
