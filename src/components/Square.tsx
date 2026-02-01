import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { clsx } from "clsx";

interface SquareProps {
  id: string;
  isBlack: boolean;
  children?: React.ReactNode;
  isValidDrop?: boolean;
  isSelected?: boolean;
  isKingInCheck?: boolean;
  onClick?: () => void;
}

export const Square = ({
  id,
  isBlack,
  children,
  isValidDrop,
  isSelected,
  isKingInCheck,
  onClick,
}: SquareProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { square: id },
  });

  const hasCapture = isValidDrop && children;
  const hasMove = isValidDrop && !children;

  // Determine background color class
  const bgColorClass = isKingInCheck
    ? "bg-red-600"
    : isSelected
      ? isBlack
        ? "bg-purple-700"
        : "bg-purple-500"
      : isBlack
        ? "bg-gray-700"
        : "bg-gray-600";

  return (
    <div
      ref={setNodeRef}
      data-testid={`square-${id}`}
      onClick={onClick}
      className={clsx(
        "relative w-full h-full flex items-center justify-center cursor-pointer",
        bgColorClass,
        isKingInCheck && "shadow-[inset_0_0_15px_rgba(255,0,0,0.8)]",
        isOver && "shadow-[inset_0_0_0_4px_#fbbf24]",
      )}
    >
      {/* Valid move indicator - dot for empty squares */}
      {hasMove && (
        <div className="absolute w-[32%] h-[32%] bg-black/25 rounded-full pointer-events-none z-[1]" />
      )}

      {/* Valid capture indicator - corner triangles */}
      {hasCapture && (
        <>
          <div className="absolute top-0 left-0 w-0 h-0 border-t-[12px] border-t-red-500/90 border-r-[12px] border-r-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 w-0 h-0 border-t-[12px] border-t-red-500/90 border-l-[12px] border-l-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 w-0 h-0 border-b-[12px] border-b-red-500/90 border-r-[12px] border-r-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 right-0 w-0 h-0 border-b-[12px] border-b-red-500/90 border-l-[12px] border-l-transparent pointer-events-none z-10" />
        </>
      )}

      {children}
    </div>
  );
};
