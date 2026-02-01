import { Chess, type Square } from "chess.js";
import type {
  GameState,
  PlayerColor,
  PieceType,
  CardHand,
  PlayerView,
  ElixirGainEvent,
  GameStatus,
} from "@elixir-chess/shared";
import {
  PIECE_COSTS,
  STARTING_ELIXIR,
  MAX_ELIXIR,
  INITIAL_TIME,
  PLACEMENT_ZONES,
  TIMER_TICK_MS,
  RECONNECT_TIMEOUT_MS,
  INITIAL_FEN,
  initializeHand,
  generateDeck,
} from "@elixir-chess/shared";

// ============================================
// Chess Utilities
// ============================================

function isInPlacementZone(square: string, color: PlayerColor): boolean {
  const rank = parseInt(square[1]);
  return PLACEMENT_ZONES[color].includes(rank);
}

function wouldBlockCheck(
  game: Chess,
  type: PieceType,
  square: string,
): boolean {
  const turn = game.turn();
  if (!game.inCheck()) return false;

  const originalFen = game.fen();

  try {
    const rank = parseInt(square[1]);
    const isPawnOnBackRank = type === "p" && (rank === 1 || rank === 8);

    let success: boolean;
    if (isPawnOnBackRank) {
      const currentFen = game.fen();
      const [position, ...rest] = currentFen.split(" ");
      const rows = position.split("/");
      const rankIndex = 8 - rank;
      const file = square.charCodeAt(0) - 97;

      let expandedRow = rows[rankIndex].replace(/[1-8]/g, (m) =>
        ".".repeat(parseInt(m)),
      );
      const pieceChar = turn === "w" ? "P" : "p";
      expandedRow =
        expandedRow.substring(0, file) +
        pieceChar +
        expandedRow.substring(file + 1);
      const compressedRow = expandedRow.replace(/\.+/g, (m) =>
        m.length.toString(),
      );
      rows[rankIndex] = compressedRow;

      const newFen = [rows.join("/"), ...rest].join(" ");
      game.load(newFen);
      success = true;
    } else {
      success = game.put({ type, color: turn }, square as Square);
    }

    if (!success) {
      game.load(originalFen);
      return false;
    }

    const stillInCheck = game.inCheck();
    game.load(originalFen);

    return !stillInCheck;
  } catch {
    game.load(originalFen);
    return false;
  }
}

function getValidPlacementSquares(
  game: Chess,
  pieceType: PieceType,
  color: PlayerColor,
): string[] {
  const validSquares: string[] = [];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const isCheck = game.inCheck();

  for (const file of files) {
    for (const rank of PLACEMENT_ZONES[color]) {
      const square = `${file}${rank}`;
      const pieceAtSquare = game.get(square as Square);

      if (!pieceAtSquare) {
        if (isCheck) {
          if (wouldBlockCheck(game, pieceType, square)) {
            validSquares.push(square);
          }
        } else {
          validSquares.push(square);
        }
      }
    }
  }

  return validSquares;
}

function canBlockCheckByPlacing(
  game: Chess,
  hand: PieceType[],
  elixir: number,
): boolean {
  if (!game.inCheck()) return false;

  const turn = game.turn();
  const affordableCards = hand.filter((type) => PIECE_COSTS[type] <= elixir);

  for (const pieceType of affordableCards) {
    const validSquares = getValidPlacementSquares(game, pieceType, turn);
    if (validSquares.length > 0) return true;
  }

  return false;
}

// ============================================
// Game Room Class
// ============================================

export type RoomEventEmitter = {
  emitToPlayer: (socketId: string, event: string, data: unknown) => void;
  emitToRoom: (event: string, data: unknown) => void;
};

export class GameRoom {
  public readonly roomId: string;
  public players: Record<PlayerColor, string | undefined> = {
    w: undefined,
    b: undefined,
  };
  public disconnectedPlayers: Record<PlayerColor, number | undefined> = {
    w: undefined,
    b: undefined,
  };

  private chess: Chess;
  private gameState: GameState;
  private timerInterval: NodeJS.Timeout | null = null;
  private emitter: RoomEventEmitter;

  constructor(roomId: string, emitter: RoomEventEmitter) {
    this.roomId = roomId;
    this.emitter = emitter;
    this.chess = new Chess(INITIAL_FEN);
    this.gameState = this.createInitialGameState();
  }

  private createInitialGameState(): GameState {
    return {
      fen: this.chess.fen(),
      turn: "w",
      elixir: { w: STARTING_ELIXIR, b: STARTING_ELIXIR },
      hands: { w: initializeHand(), b: initializeHand() },
      timers: { w: INITIAL_TIME, b: INITIAL_TIME },
      status: "waiting",
      history: [],
    };
  }

  // ============================================
  // Player Management
  // ============================================

  addPlayer(socketId: string): PlayerColor | null {
    if (!this.players.w) {
      this.players.w = socketId;
      return "w";
    } else if (!this.players.b) {
      this.players.b = socketId;
      return "b";
    }
    return null;
  }

  removePlayer(socketId: string): PlayerColor | null {
    if (this.players.w === socketId) {
      this.disconnectedPlayers.w = Date.now();
      return "w";
    } else if (this.players.b === socketId) {
      this.disconnectedPlayers.b = Date.now();
      return "b";
    }
    return null;
  }

  reconnectPlayer(socketId: string, color: PlayerColor): boolean {
    if (this.disconnectedPlayers[color]) {
      this.players[color] = socketId;
      delete this.disconnectedPlayers[color];
      return true;
    }
    return false;
  }

  isFull(): boolean {
    return !!this.players.w && !!this.players.b;
  }

  isEmpty(): boolean {
    return !this.players.w && !this.players.b;
  }

  getPlayerColor(socketId: string): PlayerColor | null {
    if (this.players.w === socketId) return "w";
    if (this.players.b === socketId) return "b";
    return null;
  }

  // ============================================
  // Game Control
  // ============================================

  startGame(): void {
    if (!this.isFull()) return;

    this.gameState.status = "playing";
    this.startTimers();

    // Send initial state to both players
    if (this.players.w) {
      this.emitter.emitToPlayer(
        this.players.w,
        "GAME_START",
        this.getPlayerView("w"),
      );
    }
    if (this.players.b) {
      this.emitter.emitToPlayer(
        this.players.b,
        "GAME_START",
        this.getPlayerView("b"),
      );
    }
  }

  private startTimers(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      if (this.gameState.status !== "playing") return;

      const currentTurn = this.gameState.turn;
      this.gameState.timers[currentTurn] = Math.max(
        0,
        this.gameState.timers[currentTurn] - TIMER_TICK_MS / 1000,
      );

      // Broadcast timer update
      this.emitter.emitToRoom("TIMER_TICK", { timers: this.gameState.timers });

      // Check for timeout
      if (this.gameState.timers[currentTurn] <= 0) {
        this.endGame("timeout", currentTurn === "w" ? "b" : "w");
      }

      // Check for disconnection timeout
      for (const color of ["w", "b"] as PlayerColor[]) {
        const disconnectTime = this.disconnectedPlayers[color];
        if (
          disconnectTime &&
          Date.now() - disconnectTime > RECONNECT_TIMEOUT_MS
        ) {
          this.endGame("disconnected", color === "w" ? "b" : "w");
        }
      }
    }, TIMER_TICK_MS);
  }

  stopTimers(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private endGame(status: GameStatus, winner?: PlayerColor): void {
    this.gameState.status = status;
    this.gameState.winner = winner;
    this.stopTimers();
    this.emitter.emitToRoom("GAME_OVER", { status, winner });
  }

  // ============================================
  // Game Actions
  // ============================================

  placePiece(
    socketId: string,
    type: PieceType,
    square: string,
  ): { success: boolean; reason?: string } {
    const playerColor = this.getPlayerColor(socketId);
    if (!playerColor) return { success: false, reason: "Not in this game" };
    if (this.gameState.status !== "playing")
      return { success: false, reason: "Game not in progress" };
    if (this.gameState.turn !== playerColor)
      return { success: false, reason: "Not your turn" };

    const hand = this.gameState.hands[playerColor];
    const cardIndex = hand.cards.indexOf(type);
    if (cardIndex === -1) return { success: false, reason: "Card not in hand" };

    const cost = PIECE_COSTS[type];
    if (this.gameState.elixir[playerColor] < cost)
      return { success: false, reason: "Not enough elixir" };

    if (!isInPlacementZone(square, playerColor))
      return { success: false, reason: "Invalid placement zone" };

    const pieceAtSquare = this.chess.get(square as Square);
    if (pieceAtSquare) return { success: false, reason: "Square occupied" };

    // Check if we're in check - placement must block it
    if (this.chess.inCheck() && !wouldBlockCheck(this.chess, type, square)) {
      return { success: false, reason: "Must block check" };
    }

    // Place the piece
    const wasInCheck = this.chess.inCheck();
    const rank = parseInt(square[1]);
    const isPawnOnBackRank = type === "p" && (rank === 1 || rank === 8);

    let success: boolean;
    if (isPawnOnBackRank) {
      // FEN manipulation for pawns on back rank
      const currentFen = this.chess.fen();
      const [position, ...rest] = currentFen.split(" ");
      const rows = position.split("/");
      const rankIndex = 8 - rank;
      const file = square.charCodeAt(0) - 97;

      let expandedRow = rows[rankIndex].replace(/[1-8]/g, (m) =>
        ".".repeat(parseInt(m)),
      );
      const pieceChar =
        playerColor === "w" ? type.toUpperCase() : type.toLowerCase();
      expandedRow =
        expandedRow.substring(0, file) +
        pieceChar +
        expandedRow.substring(file + 1);
      const compressedRow = expandedRow.replace(/\.+/g, (m) =>
        m.length.toString(),
      );
      rows[rankIndex] = compressedRow;

      const newFen = [rows.join("/"), ...rest].join(" ");
      this.chess.load(newFen);
      success = true;
    } else {
      success = this.chess.put({ type, color: playerColor }, square as Square);
    }

    if (!success) return { success: false, reason: "Failed to place piece" };

    // Verify no self-check after placement
    if (this.chess.inCheck() && this.chess.turn() === playerColor) {
      this.chess.remove(square as Square);
      return { success: false, reason: "Cannot place into check" };
    }

    // Deduct elixir
    this.gameState.elixir[playerColor] -= cost;

    // Cycle card
    hand.cards.splice(cardIndex, 1);
    hand.cards.push(hand.nextCard);
    if (hand.deck.length > 0) {
      hand.nextCard = hand.deck.shift()!;
    } else {
      hand.deck = generateDeck();
      hand.nextCard = hand.deck.shift()!;
    }

    // Switch turn via FEN manipulation
    const fen = this.chess.fen();
    const parts = fen.split(" ");
    parts[1] = playerColor === "w" ? "b" : "w";
    this.chess.load(parts.join(" "));

    // Update game state
    this.gameState.fen = this.chess.fen();
    this.gameState.turn = this.chess.turn() as PlayerColor;
    this.gameState.history = this.chess.history();

    // Check for bonus elixir
    const nowInCheck = this.chess.inCheck();
    let gainEvent: ElixirGainEvent | undefined;
    if (
      !wasInCheck &&
      !nowInCheck &&
      this.gameState.elixir[playerColor] < MAX_ELIXIR
    ) {
      this.gameState.elixir[playerColor]++;
      gainEvent = { player: playerColor, amount: 1, timestamp: Date.now() };
    }

    // Check for game end
    this.checkGameEnd();

    // Broadcast state update
    this.broadcastGameState(gainEvent);

    return { success: true };
  }

  movePiece(
    socketId: string,
    from: string,
    to: string,
  ): { success: boolean; reason?: string } {
    const playerColor = this.getPlayerColor(socketId);
    if (!playerColor) return { success: false, reason: "Not in this game" };
    if (this.gameState.status !== "playing")
      return { success: false, reason: "Game not in progress" };
    if (this.gameState.turn !== playerColor)
      return { success: false, reason: "Not your turn" };

    const wasInCheck = this.chess.inCheck();

    try {
      const move = this.chess.move({
        from: from as Square,
        to: to as Square,
        promotion: "q",
      });

      if (!move) return { success: false, reason: "Invalid move" };

      // Update game state
      this.gameState.fen = this.chess.fen();
      this.gameState.turn = this.chess.turn() as PlayerColor;
      this.gameState.history = this.chess.history();

      // Check for bonus elixir
      const nowInCheck = this.chess.inCheck();
      let gainEvent: ElixirGainEvent | undefined;
      if (
        !wasInCheck &&
        !nowInCheck &&
        this.gameState.elixir[playerColor] < MAX_ELIXIR
      ) {
        this.gameState.elixir[playerColor]++;
        gainEvent = { player: playerColor, amount: 1, timestamp: Date.now() };
      }

      // Check for game end
      this.checkGameEnd();

      // Broadcast state update
      this.broadcastGameState(gainEvent);

      return { success: true };
    } catch {
      return { success: false, reason: "Invalid move" };
    }
  }

  private checkGameEnd(): void {
    const turn = this.gameState.turn;
    const hand = this.gameState.hands[turn];
    const elixir = this.gameState.elixir[turn];

    if (this.chess.isCheckmate()) {
      if (!canBlockCheckByPlacing(this.chess, hand.cards, elixir)) {
        this.endGame("checkmate", turn === "w" ? "b" : "w");
      }
    } else if (this.chess.isStalemate()) {
      // Check if player can place any piece
      const canPlace = hand.cards.some((pieceType: PieceType) => {
        const cost = PIECE_COSTS[pieceType];
        if (elixir < cost) return false;
        return getValidPlacementSquares(this.chess, pieceType, turn).length > 0;
      });

      if (!canPlace) {
        this.endGame("stalemate");
      }
    }
  }

  restartGame(socketId: string): boolean {
    const playerColor = this.getPlayerColor(socketId);
    if (!playerColor) return false;

    this.chess = new Chess(INITIAL_FEN);
    this.gameState = this.createInitialGameState();
    this.gameState.status = "playing";

    this.startTimers();

    // Send fresh state to both players
    if (this.players.w) {
      this.emitter.emitToPlayer(
        this.players.w,
        "GAME_START",
        this.getPlayerView("w"),
      );
    }
    if (this.players.b) {
      this.emitter.emitToPlayer(
        this.players.b,
        "GAME_START",
        this.getPlayerView("b"),
      );
    }

    return true;
  }

  // ============================================
  // View Generation
  // ============================================

  getPlayerView(color: PlayerColor): PlayerView {
    const opponentColor = color === "w" ? "b" : "w";
    const opponentHand = this.gameState.hands[opponentColor];

    return {
      roomId: this.roomId,
      playerColor: color,
      gameState: {
        fen: this.gameState.fen,
        turn: this.gameState.turn,
        elixir: this.gameState.elixir,
        timers: this.gameState.timers,
        status: this.gameState.status,
        winner: this.gameState.winner,
        history: this.gameState.history,
        myHand: this.gameState.hands[color],
        opponentCardCount: opponentHand.cards.length,
      },
    };
  }

  private broadcastGameState(gainEvent?: ElixirGainEvent): void {
    if (this.players.w) {
      const view = this.getPlayerView("w");
      this.emitter.emitToPlayer(this.players.w, "GAME_STATE_UPDATE", {
        ...view,
        gainEvent: gainEvent?.player === "w" ? gainEvent : undefined,
      });
    }
    if (this.players.b) {
      const view = this.getPlayerView("b");
      this.emitter.emitToPlayer(this.players.b, "GAME_STATE_UPDATE", {
        ...view,
        gainEvent: gainEvent?.player === "b" ? gainEvent : undefined,
      });
    }
  }
}
