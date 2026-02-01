import { useState } from "react";
import {
  Crown,
  Swords,
  Users,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import type { ConnectionStatus } from "../hooks/useMultiplayerGame";

// ============================================
// Types
// ============================================

export type GameMode =
  | "menu"
  | "local"
  | "multiplayer-lobby"
  | "multiplayer-game";

interface MenuScreenProps {
  onSelectLocal: () => void;
  onSelectMultiplayer: () => void;
}

interface LobbyScreenProps {
  connectionStatus: ConnectionStatus;
  roomId: string | null;
  playerColor: "w" | "b" | null;
  error: string | null;
  onConnect: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onBack: () => void;
}

// ============================================
// Menu Screen
// ============================================

export const MenuScreen: React.FC<MenuScreenProps> = ({
  onSelectLocal,
  onSelectMultiplayer,
}) => {
  return (
    <div className="game-bg h-full w-full flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Crown className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
          <h1 className="text-5xl font-bold text-white drop-shadow-lg tracking-tight">
            Elixir Chess
          </h1>
          <Crown className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
        </div>
        <p className="text-purple-300 text-lg">
          A Clash Royale inspired chess variant
        </p>
      </div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={onSelectLocal}
          className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 rounded-xl text-white font-bold text-xl shadow-lg border-b-4 border-green-900 hover:border-green-800 transition-all hover:scale-105 active:scale-95 active:border-b-2"
        >
          <Swords className="w-6 h-6" />
          Local Game
        </button>

        <button
          onClick={onSelectMultiplayer}
          className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 rounded-xl text-white font-bold text-xl shadow-lg border-b-4 border-blue-900 hover:border-blue-800 transition-all hover:scale-105 active:scale-95 active:border-b-2"
        >
          <Users className="w-6 h-6" />
          Multiplayer
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-gray-500 text-sm">
        v1.0.0 • Made with ♥
      </div>
    </div>
  );
};

// ============================================
// Lobby Screen
// ============================================

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  connectionStatus,
  roomId,
  playerColor,
  error,
  onConnect,
  onCreateRoom,
  onJoinRoom,
  onBack,
}) => {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      onJoinRoom(joinCode.trim());
    }
  };

  const isConnecting = connectionStatus === "connecting";
  const isConnected = connectionStatus === "connected";
  const isWaitingForOpponent = roomId && !playerColor;

  return (
    <div className="game-bg h-full w-full flex flex-col items-center justify-center p-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Connection Status */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isConnected ? (
          <>
            <Wifi className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm">Connected</span>
          </>
        ) : isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
            <span className="text-yellow-400 text-sm">Connecting...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">Disconnected</span>
          </>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <Users className="w-8 h-8 text-blue-400" />
        Multiplayer
      </h1>

      {/* Error Message */}
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Content based on state */}
      {!isConnected ? (
        /* Connect Button */
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-700 rounded-xl text-white font-bold text-xl shadow-lg border-b-4 border-blue-900 disabled:border-gray-900 transition-all hover:scale-105 active:scale-95 disabled:scale-100"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wifi className="w-6 h-6" />
              Connect to Server
            </>
          )}
        </button>
      ) : roomId ? (
        /* Waiting for opponent */
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <p className="text-white/70 mb-2">Room Code</p>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-mono font-bold text-white tracking-widest bg-white/10 px-6 py-3 rounded-lg">
                {roomId}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-400" />
                ) : (
                  <Copy className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {playerColor && (
            <p className="text-white/70">
              You are playing as{" "}
              <span
                className={
                  playerColor === "w"
                    ? "text-white font-bold"
                    : "text-gray-400 font-bold"
                }
              >
                {playerColor === "w" ? "White" : "Black"}
              </span>
            </p>
          )}

          {isWaitingForOpponent && (
            <div className="flex items-center gap-3 text-yellow-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Waiting for opponent...</span>
            </div>
          )}
        </div>
      ) : (
        /* Create or Join */
        <div className="flex flex-col gap-6 w-full max-w-xs">
          <button
            onClick={onCreateRoom}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 rounded-xl text-white font-bold text-xl shadow-lg border-b-4 border-green-900 hover:border-green-800 transition-all hover:scale-105 active:scale-95 active:border-b-2"
          >
            Create Room
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-sm">OR</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={6}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-xl font-mono tracking-widest placeholder:text-white/30 focus:outline-none focus:border-blue-400 transition-colors"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-700 rounded-xl text-white font-bold text-xl shadow-lg border-b-4 border-blue-900 disabled:border-gray-900 transition-all hover:scale-105 active:scale-95 disabled:scale-100"
            >
              Join Room
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
