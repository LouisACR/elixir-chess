import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PieceIcon } from "./PieceIcons";
import { PIECE_COSTS } from "../types/game";
import type { PieceType, PlayerColor, CardHand } from "../types/game";

// Piece names for display
const PIECE_NAMES: Record<PieceType, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

// Rarity colors based on piece value
const RARITY_COLORS: Record<Exclude<PieceType, "k">, string> = {
  p: "#6b7280", // Gray - Common
  n: "#22c55e", // Green - Uncommon
  b: "#22c55e", // Green - Uncommon
  r: "#a855f7", // Purple - Rare
  q: "#f59e0b", // Gold - Legendary
};

interface ShopItemProps {
  type: PieceType;
  color: PlayerColor;
  cost: number;
  canBuy: boolean;
  index: number; // For unique drag ID
}

const ShopItem: React.FC<ShopItemProps> = ({
  type,
  color,
  cost,
  canBuy,
  index,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `shop-${type}-${index}`,
      data: { type, color, source: "shop", cost },
      disabled: !canBuy,
    });

  const rarityColor =
    RARITY_COLORS[type as Exclude<PieceType, "k">] || "#6b7280";

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
    cursor: canBuy ? "grab" : "not-allowed",
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: canBuy
          ? "linear-gradient(180deg, #374151 0%, #1f2937 100%)"
          : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
        borderRadius: 12,
        padding: "8px 4px",
        border: canBuy ? `2px solid ${rarityColor}` : "2px solid #374151",
        opacity: canBuy ? 1 : 0.5,
        filter: canBuy ? "none" : "grayscale(1)",
        minWidth: 70,
        position: "relative",
        boxShadow: canBuy
          ? `0 4px 15px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px ${rarityColor}40`
          : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      {...listeners}
      {...attributes}
      data-testid={`shop-item-${type}-${index}`}
    >
      {/* Card Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        {/* Piece Icon */}
        <div
          style={{
            width: 44,
            height: 44,
            filter: canBuy ? "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" : "none",
          }}
        >
          <PieceIcon type={type} color={color} className="w-full h-full" />
        </div>

        {/* Piece Name */}
        <span
          style={{
            color: "#9ca3af",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {PIECE_NAMES[type]}
        </span>

        {/* Cost Badge */}
        <div
          style={{
            background: canBuy
              ? "linear-gradient(135deg, #7c3aed, #ec4899)"
              : "#374151",
            padding: "3px 10px",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
            boxShadow: canBuy ? "0 0 10px rgba(236, 72, 153, 0.4)" : "none",
          }}
        >
          <span style={{ fontSize: 12 }}>💧</span>
          <span
            style={{
              color: "white",
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            {cost}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ShopProps {
  turn: PlayerColor;
  elixir: number;
  hand: CardHand;
}

// Next card preview component
const NextCardPreview: React.FC<{ type: PieceType; color: PlayerColor }> = ({
  type,
  color,
}) => {
  const rarityColor =
    RARITY_COLORS[type as Exclude<PieceType, "k">] || "#6b7280";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: 0.6,
      }}
    >
      <span
        style={{
          color: "#9ca3af",
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Next
      </span>
      <div
        style={{
          background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
          borderRadius: 8,
          padding: "6px",
          border: `2px dashed ${rarityColor}60`,
          width: 50,
        }}
      >
        <div style={{ width: 36, height: 36, margin: "0 auto" }}>
          <PieceIcon type={type} color={color} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export const Shop: React.FC<ShopProps> = ({ turn, elixir, hand }) => {
  return (
    <div
      style={{
        width: "100%",
        background:
          "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)",
        padding: "12px 8px 20px",
        borderTop: "2px solid rgba(124, 58, 237, 0.4)",
      }}
    >
      {/* Cards Container */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 8,
          maxWidth: 450,
          margin: "0 auto",
        }}
      >
        {/* 4 Cards in Hand */}
        {hand.cards.map((type, index) => (
          <ShopItem
            key={`${type}-${index}`}
            type={type}
            color={turn}
            cost={PIECE_COSTS[type]}
            canBuy={elixir >= PIECE_COSTS[type]}
            index={index}
          />
        ))}

        {/* Separator */}
        <div
          style={{
            width: 1,
            height: 60,
            background:
              "linear-gradient(180deg, transparent, #4b5563, transparent)",
            margin: "0 4px",
          }}
        />

        {/* Next Card Preview */}
        <NextCardPreview type={hand.nextCard} color={turn} />
      </div>

      {/* Hint Text */}
      <p
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: 11,
          marginTop: 8,
          fontWeight: 600,
        }}
      >
        Drag a card to place it • Cards cycle after each use
      </p>
    </div>
  );
};
