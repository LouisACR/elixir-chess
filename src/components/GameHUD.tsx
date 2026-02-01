import React from "react";
import { MAX_ELIXIR } from "../types/game";
import type { GameState } from "../types/game";
import { RotateCcw } from "lucide-react";

interface GameHUDProps {
  gameState: GameState;
  onRestart: () => void;
  isInCheck?: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  onRestart,
  isInCheck,
}) => {
  const { elixir, turn, status, winner } = gameState;
  const currentElixir = elixir[turn];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 500,
        margin: "0 auto",
        padding: "8px 16px",
      }}
    >
      {/* Turn Indicator & Status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Player indicator */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                turn === "w"
                  ? "linear-gradient(135deg, #fff 0%, #d1d5db 100%)"
                  : "linear-gradient(135deg, #374151 0%, #111827 100%)",
              border: "3px solid #fbbf24",
              boxShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
            }}
          />
          <span
            style={{
              color: "#fbbf24",
              fontWeight: 900,
              fontSize: 16,
              textTransform: "uppercase",
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {turn === "w" ? "White" : "Black"}
          </span>

          {/* Check Badge */}
          {isInCheck && status === "playing" && (
            <span
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                animation: "pulse 1s infinite",
                boxShadow: "0 0 15px rgba(239, 68, 68, 0.6)",
              }}
            >
              ⚠️ CHECK!
            </span>
          )}
        </div>

        {/* Game Over Status */}
        {status !== "playing" && (
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
            }}
          >
            {status === "checkmate"
              ? `👑 ${winner === "w" ? "White" : "Black"} Wins!`
              : status.toUpperCase()}
          </div>
        )}

        {/* Restart Button */}
        <button
          onClick={onRestart}
          style={{
            background: "linear-gradient(135deg, #4b5563, #374151)",
            border: "2px solid #6b7280",
            borderRadius: 10,
            padding: 8,
            color: "#d1d5db",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Restart Game"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Elixir Bar - Clash Royale style */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          borderRadius: 12,
          padding: "8px 12px",
          border: "2px solid rgba(124, 58, 237, 0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Elixir Drop Icon */}
          <div
            style={{
              fontSize: 24,
              filter: "drop-shadow(0 0 8px rgba(236, 72, 153, 0.8))",
            }}
          >
            💧
          </div>

          {/* Elixir Bar */}
          <div
            style={{
              flex: 1,
              height: 24,
              background: "rgba(0, 0, 0, 0.5)",
              borderRadius: 12,
              overflow: "hidden",
              position: "relative",
              border: "2px solid rgba(124, 58, 237, 0.6)",
            }}
          >
            {/* Elixir Fill */}
            <div
              className="elixir-bar"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${(currentElixir / MAX_ELIXIR) * 100}%`,
                borderRadius: 10,
                transition: "width 0.3s ease-out",
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
                        ? "1px solid rgba(255,255,255,0.15)"
                        : "none",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Elixir Count */}
          <div
            style={{
              minWidth: 45,
              textAlign: "center",
              color: "#f0abfc",
              fontWeight: 900,
              fontSize: 20,
              textShadow: "0 0 10px rgba(236, 72, 153, 0.8)",
            }}
          >
            {currentElixir}
          </div>
        </div>
      </div>
    </div>
  );
};
