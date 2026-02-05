import React, { useState } from "react";
import { Flag, Handshake, X, Check } from "lucide-react";
import { clsx } from "clsx";
import type { PlayerColor } from "@elixir-chess/shared";

// ============================================
// Draw Offer Popup
// ============================================

interface DrawOfferPopupProps {
  from: PlayerColor;
  onAccept: () => void;
  onDecline: () => void;
}

export const DrawOfferPopup: React.FC<DrawOfferPopupProps> = ({
  from,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-[#1a1a2e] border-2 border-[#c026d3] rounded-2xl p-6 shadow-[0_0_30px_rgba(192,38,211,0.4)] max-w-sm w-[90%]">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-full">
            <Handshake size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Draw Offered</h3>
            <p className="text-gray-400 text-sm">
              {from === "w" ? "White" : "Black"} proposes a draw
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className={clsx(
              "flex-1 py-3 rounded-xl font-bold text-base uppercase",
              "flex items-center justify-center gap-2",
              "transition-all duration-200 active:scale-[0.98]",
              "bg-gradient-to-br from-green-500 to-green-600",
              "hover:from-green-400 hover:to-green-500",
              "text-white shadow-[0_4px_15px_rgba(34,197,94,0.4)]",
            )}
          >
            <Check size={20} />
            Accept
          </button>
          <button
            onClick={onDecline}
            className={clsx(
              "flex-1 py-3 rounded-xl font-bold text-base uppercase",
              "flex items-center justify-center gap-2",
              "transition-all duration-200 active:scale-[0.98]",
              "bg-gradient-to-br from-red-500 to-red-600",
              "hover:from-red-400 hover:to-red-500",
              "text-white shadow-[0_4px_15px_rgba(239,68,68,0.4)]",
            )}
          >
            <X size={20} />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Draw Declined Toast
// ============================================

interface DrawDeclinedToastProps {
  visible: boolean;
}

export const DrawDeclinedToast: React.FC<DrawDeclinedToastProps> = ({
  visible,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 text-white px-4 py-2 rounded-lg font-medium shadow-lg animate-pulse">
      Draw offer declined
    </div>
  );
};

// ============================================
// Resign Confirmation Modal
// ============================================

interface ResignConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResignConfirmModal: React.FC<ResignConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 bg-[#1a1a2e] border-2 border-red-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.3)] max-w-sm w-[90%]">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-full">
            <Flag size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Resign Game?</h3>
            <p className="text-gray-400 text-sm">
              Your opponent will win the game
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={clsx(
              "flex-1 py-3 rounded-xl font-bold text-base uppercase",
              "flex items-center justify-center gap-2",
              "transition-all duration-200 active:scale-[0.98]",
              "bg-[#2d2d4a] hover:bg-[#3d3d5c]",
              "text-gray-300 hover:text-white",
              "border-2 border-[#4a4a6a] hover:border-[#6a6a8a]",
            )}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={clsx(
              "flex-1 py-3 rounded-xl font-bold text-base uppercase",
              "flex items-center justify-center gap-2",
              "transition-all duration-200 active:scale-[0.98]",
              "bg-gradient-to-br from-red-500 to-red-600",
              "hover:from-red-400 hover:to-red-500",
              "text-white shadow-[0_4px_15px_rgba(239,68,68,0.4)]",
            )}
          >
            Resign
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Game Control Buttons
// ============================================

interface GameControlButtonsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  isPlaying: boolean;
}

export const GameControlButtons: React.FC<GameControlButtonsProps> = ({
  onResign,
  onOfferDraw,
  isPlaying,
}) => {
  const [showResignConfirm, setShowResignConfirm] = useState(false);

  if (!isPlaying) return null;

  const handleResignClick = () => {
    setShowResignConfirm(true);
  };

  const handleResignConfirm = () => {
    setShowResignConfirm(false);
    onResign();
  };

  const handleResignCancel = () => {
    setShowResignConfirm(false);
  };

  return (
    <>
      <div className="absolute top-12 right-2 z-10 flex gap-2">
        <button
          onClick={onOfferDraw}
          className={clsx(
            "p-2 rounded-lg transition-all duration-200",
            "bg-amber-600/80 hover:bg-amber-500",
            "text-white shadow-md",
          )}
          title="Propose Draw"
        >
          <Handshake size={18} />
        </button>
        <button
          onClick={handleResignClick}
          className={clsx(
            "p-2 rounded-lg transition-all duration-200",
            "bg-red-600/80 hover:bg-red-500",
            "text-white shadow-md",
          )}
          title="Resign"
        >
          <Flag size={18} />
        </button>
      </div>

      <ResignConfirmModal
        isOpen={showResignConfirm}
        onConfirm={handleResignConfirm}
        onCancel={handleResignCancel}
      />
    </>
  );
};
