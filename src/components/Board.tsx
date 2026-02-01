import React from 'react';
import { Square } from './Square';
import { Piece } from './Piece';
import { Chess } from 'chess.js';

interface BoardProps {
  game: Chess;
}

export const Board: React.FC<BoardProps> = ({ game }) => {
  const board = game.board();
  const turn = game.turn();

  return (
    <div className="w-full max-w-[90vw] md:max-w-[500px] aspect-square grid grid-cols-8 grid-rows-8 border-4 border-stone-800 rounded-lg overflow-hidden shadow-xl mx-auto touch-none">
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const isBlack = (rowIndex + colIndex) % 2 === 1;
          const squareId = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`; // e.g. a8, b8...

          return (
            <Square key={squareId} id={squareId} isBlack={isBlack}>
              {piece && (
                <Piece
                  piece={piece}
                  square={squareId}
                  canDrag={piece.color === turn}
                />
              )}
            </Square>
          );
        })
      )}
    </div>
  );
};
