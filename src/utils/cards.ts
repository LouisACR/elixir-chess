import type { PieceType, CardHand } from "../types/game";
import { CARD_WEIGHTS, DECK_SIZE, HAND_SIZE } from "../constants/game";

/**
 * Draw a random card based on weighted probabilities
 */
export function drawCard(): PieceType {
  const pieces = Object.keys(CARD_WEIGHTS) as Exclude<PieceType, "k">[];
  const totalWeight = Object.values(CARD_WEIGHTS).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (const piece of pieces) {
    random -= CARD_WEIGHTS[piece];
    if (random <= 0) return piece;
  }

  return "p"; // Fallback to pawn
}

/**
 * Generate a deck of cards based on weighted probabilities
 */
export function generateDeck(size: number = DECK_SIZE): PieceType[] {
  return Array.from({ length: size }, () => drawCard());
}

/**
 * Initialize a player's hand with cards and next card preview
 */
export function initializeHand(): CardHand {
  const deck = generateDeck();

  return {
    cards: Array.from({ length: HAND_SIZE }, () => deck.pop()!),
    nextCard: deck.pop()!,
    deck,
  };
}

/**
 * Cycle a card out of hand and bring in the next card
 * Returns a new CardHand object (immutable)
 */
export function cycleCard(hand: CardHand, usedCardIndex: number): CardHand {
  const newCards = [...hand.cards];
  newCards.splice(usedCardIndex, 1);
  newCards.push(hand.nextCard);

  const newDeck = [...hand.deck];
  const newNextCard = newDeck.length > 0 ? newDeck.pop()! : drawCard();

  return {
    cards: newCards,
    nextCard: newNextCard,
    deck: newDeck,
  };
}
