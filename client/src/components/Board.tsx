import React, { useMemo } from "react";
import { Square } from "./Square";
import { Piece } from "./Piece";
import { Chess } from "chess.js";
import type { Premove, GhostPiece } from "../hooks/useMultiplayerGame";

interface BoardProps {
  game: Chess;
  selectedSquare?: string | null;
  validMoves?: string[];
  premoveValidMoves?: string[];
  premoves?: Premove[];
  ghostPieces?: GhostPiece[];
  onSquareClick?: (square: string) => void;
  flipped?: boolean;
  allowPremoveDrag?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  game,
  selectedSquare,
  validMoves = [],
  premoveValidMoves = [],
  premoves = [],
  ghostPieces = [],
  onSquareClick,
  flipped = false,
  allowPremoveDrag = false,
}) => {
  const board = game.board();
  const turn = game.turn();
  const isInCheck = game.inCheck();

  // Find the king's square if in check
  let kingInCheckSquare: string | null = null;
  if (isInCheck) {
    board.forEach((row, rowIndex) => {
      row.forEach((piece, colIndex) => {
        if (piece && piece.type === "k" && piece.color === turn) {
          kingInCheckSquare = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
        }
      });
    });
  }

  // Create a set of premove source/destination squares for quick lookup
  const premoveSquares = useMemo(() => {
    const fromSquares = new Set(premoves.map((pm) => pm.from));
    const toSquares = new Set(premoves.map((pm) => pm.to));
    return { fromSquares, toSquares };
  }, [premoves]);

  // Create a map of ghost pieces by square
  const ghostPieceMap = useMemo(() => {
    const map = new Map<string, GhostPiece>();
    for (const ghost of ghostPieces) {
      map.set(ghost.square, ghost);
    }
    return map;
  }, [ghostPieces]);

  // Create flipped board view if needed
  const displayBoard = useMemo(() => {
    if (!flipped) return board;
    return [...board].reverse().map((row) => [...row].reverse());
  }, [board, flipped]);

  return (
    <div className="w-[min(88vw,380px)] lg:w-[min(70vh,600px)] xl:w-[min(75vh,700px)] 2xl:w-[min(80vh,800px)] aspect-square grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden touch-none shadow-[0_0_0_3px_#4a5568,0_0_0_6px_#1a202c,0_0_30px_rgba(124,58,237,0.3),0_10px_40px_rgba(0,0,0,0.6)]">
      {displayBoard.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          // Calculate actual square ID (accounting for flip)
          const actualRow = flipped ? rowIndex : 7 - rowIndex;
          const actualCol = flipped ? 7 - colIndex : colIndex;
          const squareId = `${String.fromCharCode(97 + actualCol)}${actualRow + 1}`;

          // Visual coloring based on display position
          const displayRow = flipped ? 7 - rowIndex : rowIndex;
          const displayCol = flipped ? 7 - colIndex : colIndex;
          const isBlack = (displayRow + displayCol) % 2 === 1;

          const isSelected = selectedSquare === squareId;
          const isValidMove = validMoves.includes(squareId);
          const isKingInCheck = kingInCheckSquare === squareId;
          const isPremoveFrom = premoveSquares.fromSquares.has(squareId);
          const isPremoveTo = premoveSquares.toSquares.has(squareId);
          const isPremoveValid = premoveValidMoves.includes(squareId);

          // Check if piece has been premoved away (show as transparent)
          const isPiecePremoved = isPremoveFrom && piece;

          // Check for ghost piece at this square
          const ghostPiece = ghostPieceMap.get(squareId);

          // Allow dragging own pieces, or during premove selection
          const canDrag =
            piece?.color === turn ||
            (allowPremoveDrag && piece?.color !== turn);

          return (
            <Square
              key={squareId}
              id={squareId}
              isBlack={isBlack}
              isSelected={isSelected}
              isValidDrop={isValidMove}
              isKingInCheck={isKingInCheck}
              isPremoveFrom={isPremoveFrom}
              isPremoveTo={isPremoveTo}
              isPremoveValid={isPremoveValid}
              onClick={() => onSquareClick?.(squareId)}
            >
              {/* Original piece (transparent if premoved) */}
              {piece && (
                <Piece
                  piece={piece}
                  square={squareId}
                  canDrag={canDrag && !isPiecePremoved}
                  isGhost={!!isPiecePremoved}
                />
              )}
              {/* Ghost piece at premove destination */}
              {ghostPiece && !piece && (
                <Piece
                  piece={ghostPiece.piece}
                  square={squareId}
                  canDrag={false}
                  isGhost={true}
                />
              )}
            </Square>
          );
        }),
      )}
    </div>
  );
};
