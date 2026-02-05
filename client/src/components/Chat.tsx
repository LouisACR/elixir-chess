import { useState, useEffect, useRef, useCallback } from "react";
import type { ChatMessage, PlayerColor } from "@elixir-chess/shared";
import { QUICK_CHAT_MESSAGES } from "@elixir-chess/shared";
import { getSocket } from "../services/socket";

interface ChatProps {
  playerColor: PlayerColor | null;
  isOpen: boolean;
  onToggle: () => void;
  onNewMessage?: () => void;
}

export function Chat({
  playerColor,
  isOpen,
  onToggle,
  onNewMessage,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Listen for incoming chat messages
  useEffect(() => {
    const socket = getSocket();

    const handleChatMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);

      // If chat is closed and message is from opponent, increment unread
      if (!isOpen && message.sender !== playerColor) {
        setUnreadCount((prev) => prev + 1);
        onNewMessage?.();
      }
    };

    socket.on("CHAT_MESSAGE", handleChatMessage);

    return () => {
      socket.off("CHAT_MESSAGE", handleChatMessage);
    };
  }, [isOpen, playerColor, onNewMessage]);

  // Reset unread count when chat opens
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || !playerColor) return;

      const socket = getSocket();
      socket.emit("SEND_CHAT_MESSAGE", { text: trimmedText });
      setInputValue("");
      setShowQuickMessages(false);
    },
    [playerColor],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleQuickMessage = (message: string) => {
    sendMessage(message);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlayerName = (color: PlayerColor) => {
    if (color === playerColor) return "Vous";
    return color === "w" ? "Blancs" : "Noirs";
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-20 right-4 z-50 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
        title={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {/* Chat icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-20 right-4 z-40 w-80 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-white/10 transition-all duration-300 transform ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        style={{ maxHeight: "400px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
            Chat
          </h3>
          <button
            onClick={onToggle}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="h-56 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="text-white/40 text-center text-sm py-8">
              Aucun message. Dites bonjour ! 👋
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender === playerColor;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span
                      className={`text-xs font-medium ${
                        isOwnMessage ? "text-indigo-400" : "text-amber-400"
                      }`}
                    >
                      {getPlayerName(msg.sender)}
                    </span>
                    <span className="text-white/30 text-xs">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      isOwnMessage
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white/10 text-white rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Messages */}
        {showQuickMessages && (
          <div className="px-3 py-2 border-t border-white/10 grid grid-cols-2 gap-1.5">
            {QUICK_CHAT_MESSAGES.map((msg) => (
              <button
                key={msg}
                onClick={() => handleQuickMessage(msg)}
                className="px-2 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors truncate"
              >
                {msg}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-3 border-t border-white/10"
        >
          <button
            type="button"
            onClick={() => setShowQuickMessages(!showQuickMessages)}
            className={`p-2 rounded-lg transition-colors ${
              showQuickMessages
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
            }`}
            title="Messages rapides"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            className="flex-1 bg-white/10 text-white placeholder-white/40 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            maxLength={200}
          />

          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg transition-colors"
            title="Envoyer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
