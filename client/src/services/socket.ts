import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@elixir-chess/shared";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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
