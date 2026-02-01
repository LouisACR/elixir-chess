import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PieceIcon } from "./PieceIcons";
import { ElixirCostBadge } from "./ClashAssets";
import { PIECE_COSTS, PIECE_NAMES } from "@elixir-chess/shared";
import type { PieceType, PlayerColor, CardHand } from "@elixir-chess/shared";
import { clsx } from "clsx";

// ============================================
// Clash Royale Style Card Component
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

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      data-testid={`card-${type}-${index}`}
      className={clsx(
        "relative w-[76px] h-[100px] touch-none transition-all duration-150",
        isDragging && "opacity-0",
        canAfford
          ? "cursor-grab hover:scale-105 hover:-translate-y-2"
          : "cursor-not-allowed",
      )}
    >
      {/* Card SVG Background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 76 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Card gradient - Clash Royale green */}
          <linearGradient
            id={`cardGrad-${index}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            {canAfford ? (
              <>
                <stop offset="0%" stopColor="#5a7f4a" />
                <stop offset="20%" stopColor="#4a6f3c" />
                <stop offset="80%" stopColor="#3a5f2e" />
                <stop offset="100%" stopColor="#2a4f20" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#4a4a4a" />
                <stop offset="100%" stopColor="#2a2a2a" />
              </>
            )}
          </linearGradient>

          {/* Border gradient */}
          <linearGradient
            id={`borderGrad-${index}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            {canAfford ? (
              <>
                <stop offset="0%" stopColor="#a8d89a" />
                <stop offset="50%" stopColor="#7ab868" />
                <stop offset="100%" stopColor="#5a9848" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#666" />
                <stop offset="100%" stopColor="#444" />
              </>
            )}
          </linearGradient>

          {/* Drop shadow */}
          <filter
            id={`cardShadow-${index}`}
            x="-20%"
            y="-10%"
            width="140%"
            height="130%"
          >
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="3"
              floodColor="#000"
              floodOpacity="0.5"
            />
          </filter>
        </defs>

        {/* Card body */}
        <rect
          x="3"
          y="3"
          width="70"
          height="94"
          rx="8"
          fill={`url(#cardGrad-${index})`}
          filter={`url(#cardShadow-${index})`}
        />

        {/* Card border */}
        <rect
          x="3"
          y="3"
          width="70"
          height="94"
          rx="8"
          fill="none"
          stroke={`url(#borderGrad-${index})`}
          strokeWidth="3"
        />

        {/* Top highlight */}
        <rect
          x="8"
          y="6"
          width="60"
          height="3"
          rx="1.5"
          fill="rgba(255,255,255,0.25)"
        />

        {/* Inner card area */}
        <rect
          x="8"
          y="12"
          width="60"
          height="60"
          rx="4"
          fill="rgba(0,0,0,0.2)"
        />

        {/* Name plate */}
        <rect
          x="6"
          y="76"
          width="64"
          height="18"
          rx="4"
          fill="rgba(0,0,0,0.4)"
        />
      </svg>

      {/* Elixir Cost Badge - Top Left */}
      <div className="absolute -top-2 -left-2 z-20">
        <ElixirCostBadge cost={cost} canAfford={canAfford} size="md" />
      </div>

      {/* Piece Icon */}
      <div
        className={clsx(
          "absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12",
          canAfford
            ? "drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]"
            : "grayscale opacity-50",
        )}
      >
        <PieceIcon type={type} color={color} className="w-full h-full" />
      </div>

      {/* Piece Name */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span
          className={clsx(
            "text-[10px] font-bold uppercase tracking-wide",
            canAfford
              ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              : "text-gray-400",
          )}
        >
          {PIECE_NAMES[type]}
        </span>
      </div>
    </div>
  );
};

// ============================================
// Next Card Preview Component
// ============================================

interface NextCardPreviewProps {
  type: PieceType;
  color: PlayerColor;
}

const NextCardPreview: React.FC<NextCardPreviewProps> = ({ type, color }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* "Next" Label */}
      <span className="text-[#7ab868] text-[9px] font-bold uppercase tracking-wider">
        Next
      </span>

      {/* Mini Card */}
      <div className="relative w-[54px] h-[70px]">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 54 70"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="nextCardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3a5f2e" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1a3f10" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          <rect
            x="2"
            y="2"
            width="50"
            height="66"
            rx="6"
            fill="url(#nextCardGrad)"
            stroke="#5a9848"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        </svg>

        {/* Piece */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 opacity-60">
            <PieceIcon type={type} color={color} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Shop Component (Card Hand)
// ============================================

interface ShopProps {
  turn: PlayerColor;
  elixir: number;
  hand: CardHand;
}

export const Shop: React.FC<ShopProps> = ({ turn, elixir, hand }) => {
  return (
    <div className="w-full bg-gradient-to-t from-[#0a0a14] via-[#12121f] to-transparent pt-3 pb-5 px-2">
      {/* Cards Row */}
      <div className="flex justify-center items-end gap-1 lg:gap-2 max-w-[420px] lg:max-w-[620px] xl:max-w-[720px] 2xl:max-w-[820px] mx-auto">
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
        <div className="mx-2 h-[80px] w-px bg-gradient-to-b from-transparent via-[#5a9848]/50 to-transparent" />

        {/* Next Card Preview */}
        <NextCardPreview type={hand.nextCard} color={turn} />
      </div>
    </div>
  );
};
