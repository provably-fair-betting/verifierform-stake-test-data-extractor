import { parseCards } from "../parsers/cards.js";
import { finalResultSecondRowStrategy } from "../result-strategies/final-result-second-row.js";

import type { Game } from "../types.js";

const BLACKJACK_DECK_CARD_COUNT = 52;
const PLAYER_CARD_COUNT = 2;
const DEALER_CARD_COUNT = 2;

const parseBlackjackResult = (rawResult: unknown) => {
  const cards = parseCards(rawResult);

  if (cards.length < BLACKJACK_DECK_CARD_COUNT) {
    throw new Error(
      `Blackjack expected at least ${BLACKJACK_DECK_CARD_COUNT} cards, got ${cards.length}: ${rawResult}`,
    );
  }

  return {
    playerCards: cards.slice(0, PLAYER_CARD_COUNT),
    dealerCards: cards.slice(
      PLAYER_CARD_COUNT,
      PLAYER_CARD_COUNT + DEALER_CARD_COUNT,
    ),
    remainingCards: cards.slice(
      PLAYER_CARD_COUNT + DEALER_CARD_COUNT,
      BLACKJACK_DECK_CARD_COUNT,
    ),
  };
};

export const blackjack: Game = {
  name: "blackjack",
  selectValue: "blackjack",
  resultStrategy: finalResultSecondRowStrategy,
  parseResult: parseBlackjackResult,
  inputs: [],
  selects: [],
};
