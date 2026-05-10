import { parseCards } from "../parsers/cards.js";
import { finalResultSecondRowStrategy } from "../result-strategies/final-result-second-row.js";

const INITIAL_HAND_CARD_COUNT = 5;
const COMING_HAND_CARD_COUNT = 5;
const VIDEO_POKER_CARD_COUNT = INITIAL_HAND_CARD_COUNT + COMING_HAND_CARD_COUNT;

const parseVideoPokerResult = (rawResult) => {
  const cards = parseCards(rawResult);

  if (cards.length < VIDEO_POKER_CARD_COUNT) {
    throw new Error(
      `Video Poker expected at least ${VIDEO_POKER_CARD_COUNT} cards, got ${cards.length}: ${rawResult}`,
    );
  }

  return {
    initialHand: cards.slice(0, INITIAL_HAND_CARD_COUNT),
    comingHand: cards.slice(
      INITIAL_HAND_CARD_COUNT,
      INITIAL_HAND_CARD_COUNT + COMING_HAND_CARD_COUNT,
    ),
  };
};

export const videoPoker = {
  name: "videopoker",
  selectValue: "videoPoker",
  resultStrategy: finalResultSecondRowStrategy,
  parseResult: parseVideoPokerResult,
  inputs: [],
  selects: [],
};
