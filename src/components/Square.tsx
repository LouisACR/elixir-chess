import React from "react";
import { useDroppable } from "@dnd-kit/core";

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

  // Dark mode colors
  const lightColor = "#4a5568";
  const darkColor = "#2d3748";
  const selectedLight = "#805ad5";
  const selectedDark = "#6b46c1";
  const checkColor = "#e53e3e";

  let bgColor = isBlack ? darkColor : lightColor;
  if (isSelected) {
    bgColor = isBlack ? selectedDark : selectedLight;
  }
  if (isKingInCheck) {
    bgColor = checkColor;
  }

  const hasCapture = isValidDrop && children;
  const hasMove = isValidDrop && !children;

  return (
    <div
      ref={setNodeRef}
      data-testid={`square-${id}`}
      onClick={onClick}
      style={{
        backgroundColor: bgColor,
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: isKingInCheck
          ? "inset 0 0 15px rgba(255, 0, 0, 0.8)"
          : isOver
            ? "inset 0 0 0 4px #fbbf24"
            : undefined,
      }}
    >
      {/* Valid move indicator - dot for empty squares */}
      {hasMove && (
        <div
          style={{
            position: "absolute",
            width: "32%",
            height: "32%",
            backgroundColor: "rgba(0, 0, 0, 0.25)",
            borderRadius: "50%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      {/* Valid capture indicator - corner triangles */}
      {hasCapture && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 0,
              height: 0,
              borderTop: "12px solid rgba(239, 68, 68, 0.9)",
              borderRight: "12px solid transparent",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 0,
              height: 0,
              borderTop: "12px solid rgba(239, 68, 68, 0.9)",
              borderLeft: "12px solid transparent",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 0,
              height: 0,
              borderBottom: "12px solid rgba(239, 68, 68, 0.9)",
              borderRight: "12px solid transparent",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 0,
              height: 0,
              borderBottom: "12px solid rgba(239, 68, 68, 0.9)",
              borderLeft: "12px solid transparent",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        </>
      )}

      {children}
    </div>
  );
};
