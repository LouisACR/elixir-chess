import React from "react";
import { Square } from "./Square";
import { Piece } from "./Piece";
import { Chess } from "chess.js";

interface BoardProps {
  game: Chess;
  selectedSquare?: string | null;
  validMoves?: string[];
  onSquareClick?: (square: string) => void;
}

export const Board: React.FC<BoardProps> = ({
  game,
  selectedSquare,
  validMoves = [],
  onSquareClick,
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

  return (
    <div
      style={{
        width: "min(88vw, 380px)",
        aspectRatio: "1",
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gridTemplateRows: "repeat(8, 1fr)",
        borderRadius: 8,
        overflow: "hidden",
        boxShadow:
          "0 0 0 3px #4a5568, 0 0 0 6px #1a202c, 0 0 30px rgba(124, 58, 237, 0.3), 0 10px 40px rgba(0,0,0,0.6)",
        touchAction: "none",
      }}
    >
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isBlack = (rowIndex + colIndex) % 2 === 1;
          const squareId = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
          const isSelected = selectedSquare === squareId;
          const isValidMove = validMoves.includes(squareId);
          const isKingInCheck = kingInCheckSquare === squareId;

          return (
            <Square
              key={squareId}
              id={squareId}
              isBlack={isBlack}
              isSelected={isSelected}
              isValidDrop={isValidMove}
              isKingInCheck={isKingInCheck}
              onClick={() => onSquareClick?.(squareId)}
            >
              {piece && (
                <Piece
                  piece={piece}
                  square={squareId}
                  canDrag={piece.color === turn}
                />
              )}
            </Square>
          );
        }),
      )}
    </div>
  );
};
