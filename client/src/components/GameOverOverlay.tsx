import React from "react";
import { RotateCcw, Home, Trophy, Skull, Handshake } from "lucide-react";
import { clsx } from "clsx";
import type { GameStatus, PlayerColor } from "@elixir-chess/shared";
import { CrownIcon } from "./ClashAssets";

// ============================================
// Game Over Overlay Component
// ============================================

interface GameOverOverlayProps {
  status: GameStatus;
  winner?: PlayerColor;
  playerColor?: PlayerColor; // For multiplayer - which color the player is
  onRestart: () => void;
  onBack: () => void;
  isMultiplayer?: boolean;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  status,
  winner,
  playerColor,
  onRestart,
  onBack,
  isMultiplayer = false,
}) => {
  // Don't show overlay if game is still in progress or waiting
  if (status === "playing" || status === "waiting") {
    return null;
  }

  // Determine result type for styling (isDraw must be calculated first)
  const isDraw =
    status === "draw" || status === "stalemate" || status === "insufficient";
  const isDisconnected = status === "disconnected";
  const isVictory =
    !isDraw &&
    !isDisconnected &&
    (isMultiplayer ? winner === playerColor : winner !== undefined);
  const isDefeat =
    !isDraw &&
    !isDisconnected &&
    isMultiplayer &&
    winner !== undefined &&
    winner !== playerColor;

  // Get result text
  const getResultText = () => {
    if (isDraw) {
      if (status === "stalemate") return "Stalemate!";
      if (status === "insufficient") return "Draw - Insufficient Material";
      return "Draw!";
    }
    if (status === "disconnected") return "Opponent Disconnected";
    if (status === "resigned") {
      if (isMultiplayer) {
        return isVictory ? "Victory!" : "You Resigned";
      }
      return `${winner === "w" ? "White" : "Black"} Wins!`;
    }
    if (status === "timeout") {
      if (isMultiplayer) {
        return isVictory ? "Victory - Time Out!" : "Defeat - Time Out!";
      }
      return `${winner === "w" ? "White" : "Black"} Wins on Time!`;
    }
    if (status === "checkmate") {
      if (isMultiplayer) {
        return isVictory ? "Victory!" : "Defeat!";
      }
      return `${winner === "w" ? "White" : "Black"} Wins!`;
    }
    return "Game Over";
  };

  // Get subtitle
  const getSubtitle = () => {
    if (isDraw) return "No winner this time";
    if (status === "disconnected") return "You win by forfeit";
    if (status === "resigned") return isVictory ? "Opponent resigned" : "Game over";
    if (status === "checkmate") return "Checkmate!";
    if (status === "timeout") return "Time ran out";
    return "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={clsx(
          "relative z-10 w-[90%] max-w-md rounded-2xl overflow-hidden",
          "shadow-[0_0_50px_rgba(0,0,0,0.5)]",
        )}
      >
        {/* Header with result */}
        <div
          className={clsx(
            "p-6 text-center",
            isVictory &&
              "bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600",
            isDefeat && "bg-gradient-to-br from-red-600 via-red-700 to-red-800",
            isDraw &&
              "bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700",
            isDisconnected &&
              "bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600",
          )}
        >
          {/* Icon */}
          <div className="flex justify-center mb-3">
            {isVictory && (
              <div className="animate-bounce">
                <CrownIcon size={64} />
              </div>
            )}
            {isDefeat && (
              <div className="text-red-200">
                <Skull size={64} strokeWidth={1.5} />
              </div>
            )}
            {isDraw && (
              <div className="text-gray-200">
                <Handshake size={64} strokeWidth={1.5} />
              </div>
            )}
            {isDisconnected && (
              <div className="animate-bounce">
                <Trophy size={64} strokeWidth={1.5} className="text-gray-800" />
              </div>
            )}
          </div>

          {/* Result Text */}
          <h1
            className={clsx(
              "text-3xl font-black uppercase tracking-wide",
              (isVictory || isDisconnected) && "text-gray-900",
              isDefeat && "text-white",
              isDraw && "text-white",
            )}
          >
            {getResultText()}
          </h1>

          {/* Subtitle */}
          <p
            className={clsx(
              "mt-1 text-lg font-medium",
              (isVictory || isDisconnected) && "text-gray-700",
              isDefeat && "text-red-200",
              isDraw && "text-gray-300",
            )}
          >
            {getSubtitle()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-[#1a1a2e] p-6 space-y-3">
          {/* Rematch Button */}
          <button
            onClick={onRestart}
            className={clsx(
              "w-full py-4 rounded-xl font-bold text-lg uppercase tracking-wide",
              "flex items-center justify-center gap-3",
              "transition-all duration-200 active:scale-[0.98]",
              "bg-gradient-to-br from-[#c026d3] via-[#a855f7] to-[#9333ea]",
              "hover:from-[#d946ef] hover:via-[#c026d3] hover:to-[#a855f7]",
              "text-white shadow-[0_4px_20px_rgba(192,38,211,0.4)]",
              "hover:shadow-[0_4px_30px_rgba(192,38,211,0.6)]",
            )}
          >
            <RotateCcw size={24} />
            <span>{isMultiplayer ? "Rematch" : "Play Again"}</span>
          </button>

          {/* Back to Menu Button */}
          <button
            onClick={onBack}
            className={clsx(
              "w-full py-3 rounded-xl font-bold text-base uppercase tracking-wide",
              "flex items-center justify-center gap-2",
              "transition-all duration-200 active:scale-[0.98]",
              "bg-[#2d2d4a] hover:bg-[#3d3d5c]",
              "text-gray-300 hover:text-white",
              "border-2 border-[#4a4a6a] hover:border-[#6a6a8a]",
            )}
          >
            <Home size={20} />
            <span>Back to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
