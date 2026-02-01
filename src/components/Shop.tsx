import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PieceIcon } from './PieceIcons';
import { PIECE_COSTS } from '../types/game';
import type { PieceType, PlayerColor } from '../types/game';
import { clsx } from 'clsx';

interface ShopItemProps {
  type: PieceType;
  color: PlayerColor;
  cost: number;
  canBuy: boolean;
}

const ShopItem: React.FC<ShopItemProps> = ({ type, color, cost, canBuy }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `shop-${type}`,
    data: { type, color, source: 'shop', cost },
    disabled: !canBuy
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1, // Hide when dragging (show overlay instead)
    cursor: canBuy ? 'grab' : 'not-allowed',
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      data-testid={`shop-item-${type}`}
      className={clsx(
        "flex flex-col items-center justify-center p-2 rounded-lg transition-colors border-2",
        canBuy
          ? "bg-white border-stone-300 hover:bg-stone-50 shadow-sm"
          : "bg-stone-200 border-stone-200 opacity-50 grayscale"
      )}
    >
      <div className="w-10 h-10 md:w-12 md:h-12 mb-1">
        <PieceIcon type={type} color={color} className="w-full h-full" />
      </div>
      <div className="text-xs md:text-sm font-bold text-stone-600 bg-stone-200 px-2 py-0.5 rounded-full">
        {cost} 💧
      </div>
    </div>
  );
};

interface ShopProps {
  turn: PlayerColor;
  elixir: number;
}

export const Shop: React.FC<ShopProps> = ({ turn, elixir }) => {
  const pieces: PieceType[] = ['p', 'n', 'b', 'r', 'q'];

  return (
    <div className="w-full max-w-[500px] mx-auto p-4 bg-stone-100 rounded-xl shadow-inner border border-stone-200 mt-4">
      <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2 text-center">
        Shop ({turn === 'w' ? 'White' : 'Black'})
      </h3>
      <div className="flex justify-between gap-2">
        {pieces.map((type) => (
          <ShopItem
            key={type}
            type={type}
            color={turn}
            cost={PIECE_COSTS[type]}
            canBuy={elixir >= PIECE_COSTS[type]}
          />
        ))}
      </div>
    </div>
  );
};
