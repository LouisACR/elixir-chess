import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PieceIcon } from "./PieceIcons";
import { PIECE_COSTS, PIECE_NAMES, RARITY_COLORS } from "../constants/game";
import type { PieceType, PlayerColor, CardHand } from "../types/game";

// ============================================
// Shop Card Component
// ============================================

interface CardProps {
  type: PieceType;
  color: PlayerColor;
  cost: number;
  canAfford: boolean;
  index: number;
}

const Card: React.FC<CardProps> = ({ type, color, cost, canAfford, index }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `shop-${type}-${index}`,
      data: { type, color, source: "shop", cost },
      disabled: !canAfford,
    });

  const rarityColor =
    RARITY_COLORS[type as Exclude<PieceType, "k">] ?? "#6b7280";

  const cardStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    cursor: canAfford ? "grab" : "not-allowed",
    touchAction: "none",
    background: canAfford
      ? "linear-gradient(180deg, #374151 0%, #1f2937 100%)"
      : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
    borderRadius: 12,
    padding: "8px 4px",
    border: canAfford ? `2px solid ${rarityColor}` : "2px solid #374151",
    filter: canAfford ? "none" : "grayscale(1)",
    minWidth: 70,
    position: "relative",
    boxShadow: canAfford
      ? `0 4px 15px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px ${rarityColor}40`
      : "none",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...listeners}
      {...attributes}
      data-testid={`card-${type}-${index}`}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Piece Icon */}
        <div
          className="w-11 h-11"
          style={{
            filter: canAfford
              ? "drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
              : "none",
          }}
        >
          <PieceIcon type={type} color={color} className="w-full h-full" />
        </div>

        {/* Piece Name */}
        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">
          {PIECE_NAMES[type]}
        </span>

        {/* Cost Badge */}
        <CostBadge cost={cost} canAfford={canAfford} />
      </div>
    </div>
  );
};

// ============================================
// Cost Badge Component
// ============================================

interface CostBadgeProps {
  cost: number;
  canAfford: boolean;
}

const CostBadge: React.FC<CostBadgeProps> = ({ cost, canAfford }) => (
  <div
    style={{
      background: canAfford
        ? "linear-gradient(135deg, #7c3aed, #ec4899)"
        : "#374151",
      padding: "3px 10px",
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      gap: 4,
      boxShadow: canAfford ? "0 0 10px rgba(236, 72, 153, 0.4)" : "none",
    }}
  >
    <span className="text-xs">💧</span>
    <span className="text-white text-[13px] font-black">{cost}</span>
  </div>
);

// ============================================
// Next Card Preview Component
// ============================================

interface NextCardPreviewProps {
  type: PieceType;
  color: PlayerColor;
}

const NextCardPreview: React.FC<NextCardPreviewProps> = ({ type, color }) => {
  const rarityColor =
    RARITY_COLORS[type as Exclude<PieceType, "k">] ?? "#6b7280";

  return (
    <div className="flex flex-col items-center gap-1 opacity-60">
      <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wide">
        Next
      </span>
      <div
        style={{
          background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
          borderRadius: 8,
          padding: 6,
          border: `2px dashed ${rarityColor}60`,
          width: 50,
        }}
      >
        <div className="w-9 h-9 mx-auto">
          <PieceIcon type={type} color={color} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Shop Component
// ============================================

interface ShopProps {
  turn: PlayerColor;
  elixir: number;
  hand: CardHand;
}

export const Shop: React.FC<ShopProps> = ({ turn, elixir, hand }) => {
  return (
    <div
      className="w-full"
      style={{
        background:
          "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)",
        padding: "12px 8px 20px",
        borderTop: "2px solid rgba(124, 58, 237, 0.4)",
      }}
    >
      {/* Cards Container */}
      <div className="flex justify-center items-end gap-2 max-w-[450px] mx-auto">
        {/* Hand Cards */}
        {hand.cards.map((type, index) => (
          <Card
            key={`${type}-${index}`}
            type={type}
            color={turn}
            cost={PIECE_COSTS[type]}
            canAfford={elixir >= PIECE_COSTS[type]}
            index={index}
          />
        ))}

        {/* Separator */}
        <div
          className="mx-1"
          style={{
            width: 1,
            height: 60,
            background:
              "linear-gradient(180deg, transparent, #4b5563, transparent)",
          }}
        />

        {/* Next Card Preview */}
        <NextCardPreview type={hand.nextCard} color={turn} />
      </div>

      {/* Hint Text */}
      <p className="text-center text-gray-500 text-[11px] mt-2 font-semibold">
        Drag a card to place it • Cards cycle after each use
      </p>
    </div>
  );
};
