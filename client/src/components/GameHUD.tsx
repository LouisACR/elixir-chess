import React, { useState, useEffect } from "react";
import { MAX_ELIXIR } from "@elixir-chess/shared";
import type {
  GameState,
  PlayerColor,
  ElixirGainEvent,
} from "@elixir-chess/shared";
import { RotateCcw, Swords } from "lucide-react";
import { ElixirDrop, CrownIcon } from "./ClashAssets";
import { clsx } from "clsx";

// ============================================
// Helper Functions
// ============================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================
// Elixir Gain Animation Component
// ============================================

interface ElixirGainAnimationProps {
  amount: number;
  onComplete: () => void;
}

const ElixirGainAnimation: React.FC<ElixirGainAnimationProps> = ({
  amount,
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="absolute -right-8 top-1/2 pointer-events-none z-10 animate-elixir-gain">
      <span className="text-[#e879f9] font-black text-xl drop-shadow-[0_0_10px_rgba(232,121,249,0.9)]">
        +{amount}
      </span>
    </div>
  );
};

// ============================================
// Clash Royale Style Elixir Bar (SVG Based)
// ============================================

interface ElixirBarProps {
  elixir: number;
  maxElixir?: number;
  isCurrentTurn: boolean;
  color: PlayerColor;
  elixirGain?: ElixirGainEvent | null;
}

const ElixirBar: React.FC<ElixirBarProps> = ({
  elixir,
  maxElixir = MAX_ELIXIR,
  isCurrentTurn,
  color,
  elixirGain,
}) => {
  const [showGainAnimation, setShowGainAnimation] = useState<number | null>(
    null,
  );
  const fillPercent = (elixir / maxElixir) * 100;

  useEffect(() => {
    if (!elixirGain) return;
    if (elixirGain.player === color) {
      setShowGainAnimation(elixirGain.timestamp);
    }
  }, [elixirGain, color]);

  return (
    <div className={clsx("relative", !isCurrentTurn && "opacity-50")}>
      <div className="flex items-center gap-2">
        {/* Elixir Drop Icon */}
        <div
          className={clsx(
            "transition-transform duration-300",
            isCurrentTurn && "scale-110",
          )}
        >
          <ElixirDrop
            size={28}
            className={clsx(
              "transition-all duration-300",
              isCurrentTurn && "drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]",
            )}
          />
        </div>

        {/* Elixir Bar SVG */}
        <div className="relative flex-1 h-6">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Bar background gradient */}
              <linearGradient
                id="elixirBarBg"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="50%" stopColor="#0f0f1a" />
                <stop offset="100%" stopColor="#1a1a2e" />
              </linearGradient>

              {/* Elixir fill gradient - pink/purple */}
              <linearGradient
                id="elixirFillGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#9333ea" />
                <stop offset="40%" stopColor="#c026d3" />
                <stop offset="70%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#f0abfc" />
              </linearGradient>

              {/* Shine overlay */}
              <linearGradient
                id="elixirShine"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>

              {/* Glow filter */}
              <filter
                id="elixirBarGlow"
                x="-10%"
                y="-50%"
                width="120%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer frame */}
            <rect
              x="1"
              y="1"
              width="198"
              height="22"
              rx="4"
              fill="url(#elixirBarBg)"
              stroke="#4a4a6a"
              strokeWidth="2"
            />

            {/* Inner dark area */}
            <rect x="4" y="4" width="192" height="16" rx="2" fill="#0a0a12" />

            {/* Elixir fill */}
            <rect
              x="5"
              y="5"
              width={Math.max(0, 190 * (fillPercent / 100))}
              height="14"
              rx="2"
              fill="url(#elixirFillGrad)"
              filter={isCurrentTurn ? "url(#elixirBarGlow)" : undefined}
              className="transition-[width] duration-300 ease-out"
            />

            {/* Shine on fill */}
            <rect
              x="5"
              y="5"
              width={Math.max(0, 190 * (fillPercent / 100))}
              height="7"
              rx="2"
              fill="url(#elixirShine)"
              className="transition-[width] duration-300"
            />

            {/* Segment lines */}
            {[...Array(maxElixir - 1)].map((_, i) => (
              <line
                key={i}
                x1={5 + (190 / maxElixir) * (i + 1)}
                y1="5"
                x2={5 + (190 / maxElixir) * (i + 1)}
                y2="19"
                stroke="#2a2a3e"
                strokeWidth="1"
              />
            ))}
          </svg>

          {/* Elixir Gain Animation */}
          {showGainAnimation && elixirGain && (
            <ElixirGainAnimation
              key={showGainAnimation}
              amount={elixirGain.amount}
              onComplete={() => setShowGainAnimation(null)}
            />
          )}
        </div>

        {/* Elixir Count */}
        <div className="min-w-[32px] text-center">
          <span
            className={clsx(
              "font-black text-xl tabular-nums",
              isCurrentTurn
                ? "text-[#e879f9] drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]"
                : "text-[#9333ea]",
            )}
          >
            {elixir}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Player Info Panel
// ============================================

interface PlayerPanelProps {
  color: PlayerColor;
  timer: number;
  elixir: number;
  isCurrentTurn: boolean;
  isInCheck: boolean;
  position: "top" | "bottom";
  elixirGain?: ElixirGainEvent | null;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  color,
  timer,
  elixir,
  isCurrentTurn,
  isInCheck,
  position,
  elixirGain,
}) => {
  const isWhite = color === "w";
  const playerName = isWhite ? "White" : "Black";
  const isLowTime = timer <= 30;
  const isCriticalTime = timer <= 10;

  return (
    <div
      className={clsx(
        "w-full max-w-[420px] lg:max-w-[620px] xl:max-w-[720px] 2xl:max-w-[820px] mx-auto px-3",
        position === "top" ? "pt-1 pb-2" : "pt-2 pb-1",
      )}
    >
      {/* Panel Container */}
      <div
        className={clsx(
          "relative rounded-xl overflow-hidden transition-all duration-300",
          isCurrentTurn
            ? "bg-gradient-to-br from-[#2d2d4a] via-[#252540] to-[#1a1a2e]"
            : "bg-[#1a1a2e]/70",
        )}
      >
        {/* Active Turn Glow Border */}
        {isCurrentTurn && (
          <div className="absolute inset-0 rounded-xl border-2 border-[#c026d3]/70 shadow-[inset_0_0_20px_rgba(192,38,211,0.2)] pointer-events-none" />
        )}

        <div className="p-3">
          {/* Top Row: Player Info + Timer */}
          <div className="flex items-center justify-between mb-2.5">
            {/* Player Info */}
            <div className="flex items-center gap-2.5">
              {/* Player Avatar */}
              <div
                className={clsx(
                  "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  isWhite
                    ? "bg-gradient-to-br from-gray-100 to-gray-300 border-gray-400"
                    : "bg-gradient-to-br from-gray-700 to-gray-900 border-gray-500",
                  isCurrentTurn &&
                    "shadow-[0_0_12px_rgba(192,38,211,0.6)] border-[#c026d3]",
                )}
              >
                {isCurrentTurn && (
                  <Swords
                    size={16}
                    className={clsx(
                      "transition-colors",
                      isWhite ? "text-gray-700" : "text-gray-300",
                    )}
                  />
                )}
              </div>

              {/* Player Name + Turn Badge */}
              <div className="flex flex-col">
                <span
                  className={clsx(
                    "font-bold text-sm uppercase tracking-wide transition-colors",
                    isCurrentTurn ? "text-white" : "text-gray-400",
                  )}
                >
                  {playerName}
                </span>
                {isCurrentTurn && (
                  <span className="text-[10px] font-bold text-[#e879f9] uppercase tracking-wider">
                    Your Turn
                  </span>
                )}
              </div>

              {/* Check Badge */}
              {isInCheck && (
                <div className="bg-gradient-to-br from-red-500 to-red-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]">
                  ⚠️ CHECK!
                </div>
              )}
            </div>

            {/* Timer */}
            <div
              className={clsx(
                "px-3 py-1.5 rounded-lg font-mono font-bold text-base transition-all",
                isCriticalTime
                  ? "bg-gradient-to-br from-red-600 to-red-800 border border-red-400 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                  : isLowTime
                    ? "bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-400 text-white"
                    : "bg-[#2a2a40] border border-[#4a4a6a] text-gray-200",
              )}
            >
              {formatTime(timer)}
            </div>
          </div>

          {/* Elixir Bar */}
          <ElixirBar
            elixir={elixir}
            isCurrentTurn={isCurrentTurn}
            color={color}
            elixirGain={elixirGain}
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// Top HUD (Game Status + Black Player)
// ============================================

interface TopHUDProps {
  gameState: GameState;
  timers: Record<PlayerColor, number>;
  onRestart: () => void;
  isInCheck?: boolean;
  elixirGain?: ElixirGainEvent | null;
  playerPerspective?: PlayerColor;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  gameState,
  timers,
  onRestart,
  isInCheck,
  elixirGain,
  playerPerspective,
}) => {
  const { elixir, turn, status, winner } = gameState;
  // In multiplayer, show opponent at top. If playing as black, opponent is white.
  const topColor: PlayerColor = playerPerspective === "b" ? "w" : "b";
  const topElixir = elixir[topColor];
  const topTimer = timers[topColor];
  const isTopTurn = turn === topColor;
  const isTopInCheck = Boolean(isInCheck && turn === topColor);

  return (
    <div className="w-full">
      {/* Game Header Bar */}
      <div className="w-full bg-gradient-to-b from-[#0f0f1a] via-[#1a1a2e] to-transparent">
        <div className="max-w-[420px] lg:max-w-[620px] xl:max-w-[720px] 2xl:max-w-[820px] mx-auto px-3 py-2 flex items-center justify-between">
          {/* Game Title / Status */}
          {status !== "playing" ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 px-4 py-2 rounded-xl shadow-[0_4px_15px_rgba(245,158,11,0.5)]">
              <CrownIcon size={22} />
              <span className="text-gray-900 font-black text-sm uppercase drop-shadow-sm">
                {status === "checkmate" || status === "timeout"
                  ? `${winner === "w" ? "White" : "Black"} Wins!`
                  : status.toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[#e879f9] font-black text-xl game-title drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                ⚔️ Elixir Chess
              </span>
            </div>
          )}

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className="bg-gradient-to-br from-[#3d3d5c] to-[#2d2d4a] border-2 border-[#5a5a7a] rounded-xl p-2.5 text-gray-300 transition-all hover:border-[#c026d3] hover:text-white hover:shadow-[0_0_15px_rgba(192,38,211,0.4)] active:scale-95"
            title="Restart Game"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Opponent Player Panel (top) */}
      <PlayerPanel
        color={topColor}
        timer={topTimer}
        elixir={topElixir}
        isCurrentTurn={isTopTurn}
        isInCheck={isTopInCheck}
        position="top"
        elixirGain={elixirGain}
      />
    </div>
  );
};

// ============================================
// Bottom HUD (Current Player)
// ============================================

interface BottomHUDProps {
  gameState: GameState;
  timers: Record<PlayerColor, number>;
  isInCheck?: boolean;
  elixirGain?: ElixirGainEvent | null;
  playerPerspective?: PlayerColor;
}

export const BottomHUD: React.FC<BottomHUDProps> = ({
  gameState,
  timers,
  isInCheck,
  elixirGain,
  playerPerspective,
}) => {
  const { elixir, turn } = gameState;
  // In multiplayer, show current player at bottom. If playing as black, show black.
  const bottomColor: PlayerColor = playerPerspective === "b" ? "b" : "w";
  const bottomElixir = elixir[bottomColor];
  const bottomTimer = timers[bottomColor];
  const isBottomTurn = turn === bottomColor;
  const isBottomInCheck = Boolean(isInCheck && turn === bottomColor);

  return (
    <PlayerPanel
      color={bottomColor}
      timer={bottomTimer}
      elixir={bottomElixir}
      isCurrentTurn={isBottomTurn}
      isInCheck={isBottomInCheck}
      position="bottom"
      elixirGain={elixirGain}
    />
  );
};
