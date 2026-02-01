import React, { useState, useEffect } from "react";
import { MAX_ELIXIR } from "../types/game";
import type { GameState, PlayerColor } from "../types/game";
import { RotateCcw, Crown } from "lucide-react";
import type { ElixirGainEvent } from "../hooks/useElixirChess";

// ============================================
// Elixir Gain Animation Component
// ============================================

interface ElixirGainAnimationProps {
  amount: number;
  color: PlayerColor;
  onComplete: () => void;
}

const ElixirGainAnimation: React.FC<ElixirGainAnimationProps> = ({
  amount,
  color,
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

  const isWhite = color === "w";
  const glowColor = isWhite
    ? "rgba(59, 130, 246, 0.8)"
    : "rgba(236, 72, 153, 0.8)";

  return (
    <div
      style={{
        position: "absolute",
        right: 40,
        top: "50%",
        transform: "translateY(-50%)",
        animation: "elixirGainFloat 1s ease-out forwards",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <span
        style={{
          color: "#22c55e",
          fontWeight: 900,
          fontSize: 18,
          textShadow: `0 0 10px ${glowColor}, 0 0 20px rgba(34, 197, 94, 0.8)`,
        }}
      >
        +{amount}
      </span>
    </div>
  );
};

// ============================================
// Helper Functions
// ============================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// ============================================
// Elixir Bar Component
// ============================================

interface ElixirBarProps {
  elixir: number;
  timer: number;
  color: PlayerColor;
  isCurrentTurn: boolean;
  isInCheck?: boolean;
  position: "top" | "bottom";
  elixirGain?: ElixirGainEvent | null;
}

const ElixirBar: React.FC<ElixirBarProps> = ({
  elixir,
  timer,
  color,
  isCurrentTurn,
  isInCheck,
  position,
  elixirGain,
}) => {
  const [showGainAnimation, setShowGainAnimation] = useState<number | null>(
    null,
  );

  // Show animation on the bar whose player gained elixir
  useEffect(() => {
    if (!elixirGain) return;

    // Show animation if this bar's color matches the player who gained elixir
    if (elixirGain.player === color) {
      setShowGainAnimation(elixirGain.timestamp);
    }
  }, [elixirGain, color]);

  const isWhite = color === "w";
  const playerName = isWhite ? "White" : "Black";

  // Different color schemes for each player
  const barGradient = isWhite
    ? "linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)"
    : "linear-gradient(90deg, #ec4899, #f472b6, #f9a8d4)";

  const borderColor = isWhite
    ? "rgba(59, 130, 246, 0.6)"
    : "rgba(236, 72, 153, 0.6)";

  const textColor = isWhite ? "#93c5fd" : "#f9a8d4";
  const glowColor = isWhite
    ? "rgba(59, 130, 246, 0.8)"
    : "rgba(236, 72, 153, 0.8)";

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 500,
        margin: "0 auto",
        padding: position === "top" ? "8px 16px 4px" : "4px 16px 8px",
      }}
    >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          borderRadius: 12,
          padding: "6px 12px",
          border: `2px solid ${borderColor}`,
          opacity: isCurrentTurn ? 1 : 0.6,
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexDirection: position === "top" ? "row" : "row",
          }}
        >
          {/* Player Indicator with Turn Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 100,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: isWhite
                  ? "linear-gradient(135deg, #fff 0%, #d1d5db 100%)"
                  : "linear-gradient(135deg, #374151 0%, #111827 100%)",
                border: isCurrentTurn
                  ? "2px solid #fbbf24"
                  : "2px solid #6b7280",
                boxShadow: isCurrentTurn
                  ? "0 0 8px rgba(251, 191, 36, 0.5)"
                  : "none",
              }}
            />
            <span
              style={{
                color: isCurrentTurn ? "#fbbf24" : "#9ca3af",
                fontWeight: 800,
                fontSize: 12,
                textTransform: "uppercase",
                textShadow: isCurrentTurn
                  ? "0 2px 4px rgba(0,0,0,0.5)"
                  : "none",
              }}
            >
              {playerName}
            </span>
            {/* Turn indicator - always takes space to prevent layout shift */}
            <div
              style={{
                background: isCurrentTurn
                  ? "linear-gradient(135deg, #fbbf24, #f59e0b)"
                  : "transparent",
                color: isCurrentTurn ? "#1f2937" : "transparent",
                padding: "2px 6px",
                borderRadius: 10,
                fontSize: 9,
                fontWeight: 900,
                textTransform: "uppercase",
                visibility: isCurrentTurn ? "visible" : "hidden",
              }}
            >
              TURN
            </div>
          </div>

          {/* Check Badge */}
          {isInCheck && isCurrentTurn && (
            <div
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white",
                padding: "2px 8px",
                borderRadius: 10,
                fontSize: 9,
                fontWeight: 900,
                textTransform: "uppercase",
                animation: "pulse 1s infinite",
                boxShadow: "0 0 10px rgba(239, 68, 68, 0.6)",
              }}
            >
              CHECK!
            </div>
          )}

          {/* Elixir Bar */}
          <div
            style={{
              flex: 1,
              height: 18,
              background: "rgba(0, 0, 0, 0.5)",
              borderRadius: 9,
              overflow: "hidden",
              position: "relative",
              border: `1px solid ${borderColor}`,
            }}
          >
            {/* Elixir Fill */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(elixir / MAX_ELIXIR) * 100}%`,
                background: barGradient,
                borderRadius: 8,
                transition: "width 0.3s ease-out",
                boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3)`,
              }}
            />

            {/* Segment markers */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
              }}
            >
              {[...Array(MAX_ELIXIR)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRight:
                      i < MAX_ELIXIR - 1
                        ? "1px solid rgba(255,255,255,0.1)"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Elixir Count */}
          <div
            style={{
              minWidth: 30,
              textAlign: "center",
              color: textColor,
              fontWeight: 900,
              fontSize: 16,
              textShadow: `0 0 8px ${glowColor}`,
              position: "relative",
            }}
          >
            {elixir}
            {/* Elixir Gain Animation */}
            {showGainAnimation && elixirGain && (
              <ElixirGainAnimation
                key={showGainAnimation}
                amount={elixirGain.amount}
                color={elixirGain.player}
                onComplete={() => setShowGainAnimation(null)}
              />
            )}
          </div>

          {/* Timer */}
          <div
            style={{
              minWidth: 50,
              textAlign: "center",
              padding: "2px 8px",
              borderRadius: 8,
              background:
                timer <= 30 ? "rgba(239, 68, 68, 0.3)" : "rgba(0, 0, 0, 0.4)",
              border:
                timer <= 30
                  ? "1px solid #ef4444"
                  : "1px solid rgba(255,255,255,0.1)",
              color: timer <= 30 ? "#fca5a5" : "#d1d5db",
              fontWeight: 900,
              fontSize: 14,
              fontFamily: "monospace",
              animation:
                timer <= 10 && isCurrentTurn ? "pulse 1s infinite" : "none",
            }}
          >
            {formatTime(timer)}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Top HUD (Opponent Elixir + Game Status)
// ============================================

interface TopHUDProps {
  gameState: GameState;
  timers: Record<PlayerColor, number>;
  onRestart: () => void;
  isInCheck?: boolean;
  elixirGain?: ElixirGainEvent | null;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  gameState,
  timers,
  onRestart,
  isInCheck,
  elixirGain,
}) => {
  const { elixir, turn, status, winner } = gameState;
  // Top always shows black's elixir (fixed position)
  const blackElixir = elixir.b;
  const blackTimer = timers.b;
  const isBlackTurn = turn === "b";
  const isBlackInCheck = isInCheck && turn === "b";

  return (
    <div style={{ width: "100%" }}>
      {/* Game Status Bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          margin: "0 auto",
          padding: "8px 16px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Game Over Status */}
        {status !== "playing" ? (
          <div
            style={{
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              color: "#1f2937",
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 900,
              textTransform: "uppercase",
              boxShadow: "0 4px 15px rgba(251, 191, 36, 0.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Crown size={16} />
            {status === "checkmate" || status === "timeout"
              ? `${winner === "w" ? "White" : "Black"} Wins!`
              : status.toUpperCase()}
          </div>
        ) : (
          <div
            style={{
              color: "#9ca3af",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Elixir Chess
          </div>
        )}

        {/* Restart Button */}
        <button
          onClick={onRestart}
          style={{
            background: "linear-gradient(135deg, #4b5563, #374151)",
            border: "2px solid #6b7280",
            borderRadius: 8,
            padding: 6,
            color: "#d1d5db",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          title="Restart Game"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Black Player Elixir Bar (always top) */}
      <ElixirBar
        elixir={blackElixir}
        timer={blackTimer}
        color="b"
        isCurrentTurn={isBlackTurn}
        isInCheck={isBlackInCheck}
        position="top"
        elixirGain={elixirGain}
      />
    </div>
  );
};

// ============================================
// Bottom HUD (Player Elixir)
// ============================================

interface BottomHUDProps {
  gameState: GameState;
  timers: Record<PlayerColor, number>;
  isInCheck?: boolean;
  elixirGain?: ElixirGainEvent | null;
}

export const BottomHUD: React.FC<BottomHUDProps> = ({
  gameState,
  timers,
  isInCheck,
  elixirGain,
}) => {
  const { elixir, turn } = gameState;
  // Bottom always shows white's elixir (fixed position)
  const whiteElixir = elixir.w;
  const whiteTimer = timers.w;
  const isWhiteTurn = turn === "w";
  const isWhiteInCheck = isInCheck && turn === "w";

  return (
    <ElixirBar
      elixir={whiteElixir}
      timer={whiteTimer}
      color="w"
      isCurrentTurn={isWhiteTurn}
      isInCheck={isWhiteInCheck}
      position="bottom"
      elixirGain={elixirGain}
    />
  );
};
