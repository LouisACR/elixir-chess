import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TimeControlType,
} from "@elixir-chess/shared";
import { TIME_CONTROLS } from "@elixir-chess/shared";
import { GameRoom } from "./GameRoom.js";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());

// Health check endpoint for Docker
app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? true // Allow all origins in production (nginx handles this)
        : [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:80",
          ],
    methods: ["GET", "POST"],
  },
});

// ============================================
// Room Management
// ============================================

const rooms = new Map<string, GameRoom>();
const playerRooms = new Map<string, string>(); // socketId -> roomId

function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function createEmitter(roomId: string) {
  return {
    emitToPlayer: (socketId: string, event: string, data: unknown) => {
      io.to(socketId).emit(event as keyof ServerToClientEvents, data as never);
    },
    emitToRoom: (event: string, data: unknown) => {
      io.to(roomId).emit(event as keyof ServerToClientEvents, data as never);
    },
  };
}

function cleanupRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    room.stopTimers();
    rooms.delete(roomId);
    console.log(`Room ${roomId} cleaned up`);
  }
}

// ============================================
// Socket Event Handlers
// ============================================

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("CREATE_ROOM", ({ timeControl }) => {
    // Validate time control
    const validTimeControl: TimeControlType = TIME_CONTROLS[timeControl]
      ? timeControl
      : "blitz";

    // Leave any existing room
    const existingRoomId = playerRooms.get(socket.id);
    if (existingRoomId) {
      socket.leave(existingRoomId);
      const existingRoom = rooms.get(existingRoomId);
      if (existingRoom) {
        existingRoom.removePlayer(socket.id);
      }
      playerRooms.delete(socket.id);
    }

    // Create new room
    let roomId = generateRoomId();
    while (rooms.has(roomId)) {
      roomId = generateRoomId();
    }

    const room = new GameRoom(roomId, createEmitter(roomId), validTimeControl);
    const playerColor = room.addPlayer(socket.id);

    if (playerColor) {
      rooms.set(roomId, room);
      playerRooms.set(socket.id, roomId);
      socket.join(roomId);

      socket.emit("ROOM_CREATED", {
        roomId,
        playerColor,
        timeControl: validTimeControl,
      });
      console.log(
        `Room ${roomId} created by ${socket.id} as ${playerColor} (${validTimeControl})`,
      );
    }
  });

  socket.on("JOIN_ROOM", ({ roomId }) => {
    const room = rooms.get(roomId.toUpperCase());

    if (!room) {
      socket.emit("ERROR", { message: "Room not found" });
      return;
    }

    if (room.isFull()) {
      socket.emit("ERROR", { message: "Room is full" });
      return;
    }

    // Leave any existing room
    const existingRoomId = playerRooms.get(socket.id);
    if (existingRoomId && existingRoomId !== roomId) {
      socket.leave(existingRoomId);
      const existingRoom = rooms.get(existingRoomId);
      if (existingRoom) {
        existingRoom.removePlayer(socket.id);
      }
      playerRooms.delete(socket.id);
    }

    const playerColor = room.addPlayer(socket.id);

    if (playerColor) {
      playerRooms.set(socket.id, room.roomId);
      socket.join(room.roomId);

      socket.emit("ROOM_JOINED", {
        roomId: room.roomId,
        playerColor,
        timeControl: room.timeControl,
      });
      console.log(
        `Player ${socket.id} joined room ${room.roomId} as ${playerColor}`,
      );

      // Start game if room is full
      if (room.isFull()) {
        room.startGame();
        console.log(`Game started in room ${room.roomId}`);
      }
    }
  });

  socket.on("PLACE_PIECE", ({ type, square }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) {
      socket.emit("ERROR", { message: "Not in a room" });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("ERROR", { message: "Room not found" });
      return;
    }

    const result = room.placePiece(socket.id, type, square);
    if (!result.success) {
      socket.emit("ACTION_REJECTED", {
        action: "PLACE_PIECE",
        reason: result.reason!,
      });
    }
  });

  socket.on("MOVE_PIECE", ({ from, to }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) {
      socket.emit("ERROR", { message: "Not in a room" });
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("ERROR", { message: "Room not found" });
      return;
    }

    const result = room.movePiece(socket.id, from, to);
    if (!result.success) {
      socket.emit("ACTION_REJECTED", {
        action: "MOVE_PIECE",
        reason: result.reason!,
      });
    }
  });

  socket.on("SET_PREMOVES", ({ premoves }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.setPremoves(socket.id, premoves);
  });

  socket.on("CLEAR_PREMOVES", () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.clearPremoves(socket.id);
  });

  socket.on("RESTART_GAME", () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.restartGame(socket.id);
    console.log(`Game restarted in room ${roomId}`);
  });

  socket.on("RESIGN", () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.resign(socket.id);
    console.log(`Player resigned in room ${roomId}`);
  });

  socket.on("OFFER_DRAW", () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.offerDraw(socket.id);
    console.log(`Draw offered in room ${roomId}`);
  });

  socket.on("RESPOND_DRAW", ({ accept }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.respondToDraw(socket.id, accept);
    console.log(`Draw ${accept ? "accepted" : "declined"} in room ${roomId}`);
  });

  socket.on("LEAVE_ROOM", () => {
    handleDisconnect(socket.id);
  });

  socket.on("SEND_CHAT_MESSAGE", ({ text }) => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const playerColor = room.getPlayerColor(socket.id);
    if (!playerColor) return;

    // Sanitize and limit message length
    const sanitizedText = text.trim().slice(0, 200);
    if (!sanitizedText) return;

    const chatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender: playerColor,
      text: sanitizedText,
      timestamp: Date.now(),
    };

    // Broadcast to all players in the room
    io.to(roomId).emit("CHAT_MESSAGE", chatMessage);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    handleDisconnect(socket.id);
  });
});

function handleDisconnect(socketId: string): void {
  const roomId = playerRooms.get(socketId);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const playerColor = room.removePlayer(socketId);
  playerRooms.delete(socketId);

  if (playerColor) {
    // Notify other player
    io.to(roomId).emit("PLAYER_DISCONNECTED", { playerColor });
    console.log(`Player ${playerColor} disconnected from room ${roomId}`);

    // If room is empty, clean it up
    if (room.isEmpty()) {
      cleanupRoom(roomId);
    }
  }
}

// ============================================
// Health Check
// ============================================

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    rooms: rooms.size,
    connections: io.engine.clientsCount,
  });
});

// ============================================
// Start Server
// ============================================

httpServer.listen(PORT, () => {
  console.log(`🚀 Elixir Chess server running on port ${PORT}`);
});
