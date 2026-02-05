import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@elixir-chess/shared";

// In production, connect to same origin (nginx proxies /socket.io to server)
// In development, connect to localhost:3001
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD ? "" : "http://localhost:3001");

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

// Generate or retrieve a persistent session ID for reconnection
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("elixir-chess-session-id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("elixir-chess-session-id", sessionId);
  }
  return sessionId;
}

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        sessionId: getSessionId(),
      },
    });
  }
  return socket;
}

export function connectSocket(): Promise<void> {
  const s = getSocket();

  return new Promise((resolve, reject) => {
    if (s.connected) {
      resolve();
      return;
    }

    const onConnect = () => {
      s.off("connect", onConnect);
      s.off("connect_error", onError);
      resolve();
    };

    const onError = (err: Error) => {
      s.off("connect", onConnect);
      s.off("connect_error", onError);
      reject(err);
    };

    s.on("connect", onConnect);
    s.on("connect_error", onError);
    s.connect();
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}
