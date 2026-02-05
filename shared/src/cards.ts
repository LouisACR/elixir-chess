// ============================================
// Card Utilities
// ============================================

import type { PieceType, CardHand } from "./index.js";
import { CARD_WEIGHTS, HAND_SIZE, DECK_SIZE } from "./index.js";

/**
 * Draw a random card based on weighted probabilities
 */
export function drawCard(): PieceType {
  const entries = Object.entries(CARD_WEIGHTS).filter(
    ([, weight]) => weight > 0,
  );
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [type, weight] of entries) {
    random -= weight;
    if (random < 0) return type as PieceType;
  }
  return "p";
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
    cards: deck.splice(0, HAND_SIZE),
    nextCard: deck.shift()!,
    deck,
  };
}

/**
 * Cycle a card from hand - remove used card, add next card, draw new next
 */
export function cycleCard(hand: CardHand, usedIndex: number): CardHand {
  const newCards = [...hand.cards];
  newCards.splice(usedIndex, 1);
  newCards.push(hand.nextCard);

  let newDeck = [...hand.deck];
  let newNextCard: PieceType;

  if (newDeck.length > 0) {
    newNextCard = newDeck.shift()!;
  } else {
    newDeck = generateDeck();
    newNextCard = newDeck.shift()!;
  }

  return {
    cards: newCards,
    nextCard: newNextCard,
    deck: newDeck,
  };
}
