import { Chess, type Square } from "chess.js";
import type {
  GameState,
  PlayerColor,
  PieceType,
  CardHand,
  PlayerView,
  ElixirGainEvent,
  GameStatus,
  Premove,
  TimeControlType,
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
  TIME_CONTROLS,
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
    // Pawns can never be on rank 1 or 8, so they can't block check there
    const rank = parseInt(square[1]);
    if (type === "p" && (rank === 1 || rank === 8)) return false;

    const success = game.put({ type, color: turn }, square as Square);

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
      // Pawns cannot be placed on the 1st or 8th rank
      if (pieceType === "p" && (rank === 1 || rank === 8)) continue;

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
  public readonly timeControl: TimeControlType;
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
  private premoveTimeout: NodeJS.Timeout | null = null;
  private emitter: RoomEventEmitter;

  private lastTimerTick: number = 0;

  // Premove queues for each player
  private premoves: Record<PlayerColor, Premove[]> = {
    w: [],
    b: [],
  };

  // Draw offer state
  private pendingDrawOffer: PlayerColor | null = null;

  constructor(
    roomId: string,
    emitter: RoomEventEmitter,
    timeControl: TimeControlType = "blitz",
  ) {
    this.roomId = roomId;
    this.timeControl = timeControl;
    this.emitter = emitter;
    this.chess = new Chess(INITIAL_FEN);
    this.gameState = this.createInitialGameState();
  }

  private createInitialGameState(): GameState {
    const initialTime = TIME_CONTROLS[this.timeControl].time;
    return {
      fen: this.chess.fen(),
      turn: "w",
      elixir: { w: STARTING_ELIXIR, b: STARTING_ELIXIR },
      hands: { w: initializeHand(), b: initializeHand() },
      timers: { w: initialTime, b: initialTime },
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
      this.players.w = undefined;
      this.disconnectedPlayers.w = Date.now();
      return "w";
    } else if (this.players.b === socketId) {
      this.players.b = undefined;
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

    this.lastTimerTick = Date.now();

    this.timerInterval = setInterval(() => {
      if (this.gameState.status !== "playing") return;

      const now = Date.now();
      const elapsed = (now - this.lastTimerTick) / 1000;
      this.lastTimerTick = now;

      const currentTurn = this.gameState.turn;
      this.gameState.timers[currentTurn] = Math.max(
        0,
        this.gameState.timers[currentTurn] - elapsed,
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
    if (this.premoveTimeout) {
      clearTimeout(this.premoveTimeout);
      this.premoveTimeout = null;
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

    // Input validation
    const validPieceTypes: PieceType[] = ["p", "n", "b", "r", "q"];
    if (!validPieceTypes.includes(type))
      return { success: false, reason: "Invalid piece type" };
    if (!/^[a-h][1-8]$/.test(square))
      return { success: false, reason: "Invalid square" };

    const hand = this.gameState.hands[playerColor];
    const cardIndex = hand.cards.indexOf(type);
    if (cardIndex === -1) return { success: false, reason: "Card not in hand" };

    const cost = PIECE_COSTS[type];
    if (this.gameState.elixir[playerColor] < cost)
      return { success: false, reason: "Not enough elixir" };

    if (!isInPlacementZone(square, playerColor))
      return { success: false, reason: "Invalid placement zone" };

    // Pawns cannot be placed on rank 1 or 8
    const rank = parseInt(square[1]);
    if (type === "p" && (rank === 1 || rank === 8))
      return { success: false, reason: "Pawns cannot be placed on back rank" };

    const pieceAtSquare = this.chess.get(square as Square);
    if (pieceAtSquare) return { success: false, reason: "Square occupied" };

    // Check if we're in check - placement must block it
    if (this.chess.inCheck() && !wouldBlockCheck(this.chess, type, square)) {
      return { success: false, reason: "Must block check" };
    }

    // Place the piece
    const wasInCheck = this.chess.inCheck();
    const originalFen = this.chess.fen();

    const success = this.chess.put(
      { type, color: playerColor },
      square as Square,
    );

    if (!success) return { success: false, reason: "Failed to place piece" };

    // Verify no self-check after placement
    if (this.chess.inCheck() && this.chess.turn() === playerColor) {
      // Restore original position
      this.chess.load(originalFen);
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
      // Check if player can place any piece (also verify placement wouldn't cause self-check)
      const originalFen = this.chess.fen();
      let canPlace = false;

      for (const pieceType of hand.cards) {
        const cost = PIECE_COSTS[pieceType];
        if (elixir < cost) continue;

        const validSquares = getValidPlacementSquares(
          this.chess,
          pieceType,
          turn,
        );
        for (const sq of validSquares) {
          try {
            const placed = this.chess.put(
              { type: pieceType, color: turn },
              sq as Square,
            );
            if (placed) {
              const wouldBeInCheck = this.chess.inCheck();
              this.chess.load(originalFen, { skipValidation: true });
              if (!wouldBeInCheck) {
                canPlace = true;
                break;
              }
            } else {
              this.chess.load(originalFen, { skipValidation: true });
            }
          } catch {
            this.chess.load(originalFen, { skipValidation: true });
          }
        }
        if (canPlace) break;
      }

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

    // Clear premoves and draw offers
    this.premoves = { w: [], b: [] };
    this.pendingDrawOffer = null;

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
  // Resign & Draw
  // ============================================

  resign(socketId: string): boolean {
    const playerColor = this.getPlayerColor(socketId);
    if (!playerColor) return false;
    if (this.gameState.status !== "playing") return false;

    // The opponent wins
    const winner = playerColor === "w" ? "b" : "w";
    this.endGame("resigned", winner);
    return true;
  }

  offerDraw(socketId: string): boolean {
    const playerColor = this.getPlayerColor(socketId);
    if (!playerColor) return false;
    if (this.gameState.status !== "playing") return false;

    // Can't offer draw if there's already a pending offer
    if (this.pendingDrawOffer !== null) return false;

    this.pendingDrawOffer = playerColor;

    // Notify opponent of the draw offer
    const opponentColor = playerColor === "w" ? "b" : "w";
    if (this.players[opponentColor]) {
      this.emitter.emitToPlayer(this.players[opponentColor]!, "DRAW_OFFERED", {
        from: playerColor,
      });
    }

    return true;
  }

  respondToDraw(socketId: string, accept: boolean): boolean {
    const playerColor = this.getPlayerColor(socketId);
    if (!playerColor) return false;
    if (this.gameState.status !== "playing") return false;

    // Must be the opponent of the one who offered
    if (this.pendingDrawOffer === null) return false;
    if (this.pendingDrawOffer === playerColor) return false;

    if (accept) {
      this.endGame("draw");
    } else {
      // Notify the player who offered that draw was declined
      if (this.players[this.pendingDrawOffer]) {
        this.emitter.emitToPlayer(
          this.players[this.pendingDrawOffer]!,
          "DRAW_DECLINED",
          {},
        );
      }
    }

    this.pendingDrawOffer = null;
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
        premoves: this.premoves[color],
      },
    };
  }

  // ============================================
  // Premove Management
  // ============================================

  setPremoves(socketId: string, premoves: Premove[]): void {
    const playerColor = this.getPlayerColor(socketId);
    if (!playerColor) return;
    if (this.gameState.status !== "playing") return;

    // Cap premove queue size to prevent abuse
    this.premoves[playerColor] = premoves.slice(0, 10);

    // Notify the player of their updated premoves
    if (this.players[playerColor]) {
      this.emitter.emitToPlayer(
        this.players[playerColor]!,
        "GAME_STATE_UPDATE",
        this.getPlayerView(playerColor),
      );
    }
  }

  clearPremoves(socketId: string): void {
    const playerColor = this.getPlayerColor(socketId);
    if (!playerColor) return;

    this.premoves[playerColor] = [];

    if (this.players[playerColor]) {
      this.emitter.emitToPlayer(
        this.players[playerColor]!,
        "GAME_STATE_UPDATE",
        this.getPlayerView(playerColor),
      );
    }
  }

  private clearPremovesForPlayer(color: PlayerColor, reason: string): void {
    this.premoves[color] = [];

    if (this.players[color]) {
      this.emitter.emitToPlayer(this.players[color]!, "PREMOVES_CLEARED", {
        reason,
      });
    }
  }

  private tryExecutePremove(): boolean {
    if (this.gameState.status !== "playing") return false;

    const currentTurn = this.gameState.turn;
    const premoveQueue = this.premoves[currentTurn];

    if (premoveQueue.length === 0) return false;

    const premove = premoveQueue[0];
    const wasInCheck = this.chess.inCheck();

    // Validate the premove is still legal
    try {
      const move = this.chess.move({
        from: premove.from as Square,
        to: premove.to as Square,
        promotion: "q",
      });

      if (!move) {
        // Invalid premove - clear all premoves for this player
        this.clearPremovesForPlayer(currentTurn, "Invalid premove");
        return false;
      }

      // Remove the executed premove from queue
      premoveQueue.shift();

      // Update game state
      this.gameState.fen = this.chess.fen();
      this.gameState.turn = this.chess.turn() as PlayerColor;
      this.gameState.history = this.chess.history();

      // Check for bonus elixir (same logic as movePiece)
      const nowInCheck = this.chess.inCheck();
      let gainEvent: ElixirGainEvent | undefined;
      if (
        !wasInCheck &&
        !nowInCheck &&
        this.gameState.elixir[currentTurn] < MAX_ELIXIR
      ) {
        this.gameState.elixir[currentTurn]++;
        gainEvent = { player: currentTurn, amount: 1, timestamp: Date.now() };
      }

      // Check for game end
      this.checkGameEnd();

      // Broadcast state update
      this.broadcastGameState(gainEvent);

      return true;
    } catch {
      // Invalid premove - clear all premoves
      this.clearPremovesForPlayer(currentTurn, "Invalid premove");
      return false;
    }
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

    // Try to execute premove for the player whose turn it is
    // Use setTimeout to allow the state update to be processed first
    if (this.gameState.status === "playing") {
      if (this.premoveTimeout) clearTimeout(this.premoveTimeout);
      this.premoveTimeout = setTimeout(() => {
        this.premoveTimeout = null;
        if (this.gameState.status === "playing") {
          this.tryExecutePremove();
        }
      }, 50);
    }
  }
}
