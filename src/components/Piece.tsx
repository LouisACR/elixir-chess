import React from "react";
import { PieceIcon } from "./PieceIcons";
import type { Piece as PieceModel } from "@elixir-chess/shared";
import { clsx } from "clsx";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface PieceProps {
  piece: PieceModel;
  square: string; // e.g. 'e2'
  canDrag?: boolean;
  className?: string;
}

export const Piece: React.FC<PieceProps> = ({
  piece,
  square,
  canDrag = true,
  className,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `piece-${square}`,
      data: {
        from: square,
        type: piece.type,
        color: piece.color,
        source: "board",
      },
      disabled: !canDrag,
    });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={clsx(
        "w-full h-full flex items-center justify-center p-1 touch-none",
        isDragging ? "opacity-0 z-50" : "opacity-100 z-auto",
        canDrag ? "cursor-grab" : "cursor-default",
        className,
      )}
    >
      <PieceIcon
        type={piece.type}
        color={piece.color}
        className="w-full h-full drop-shadow-md"
      />
    </div>
  );
};
