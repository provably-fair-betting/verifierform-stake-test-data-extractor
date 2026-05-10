import { parseCards } from "../parsers/cards.js";
import { finalResultSecondRowStrategy } from "../result-strategies/final-result-second-row.js";

const HILO_CARD_COUNT = 52;

const parseHiloResult = (rawResult) => {
  const cards = parseCards(rawResult);

  if (cards.length < HILO_CARD_COUNT) {
    throw new Error(
      `Hilo expected at least ${HILO_CARD_COUNT} cards, got ${cards.length}: ${rawResult}`,
    );
  }

  return {
    cards: cards.slice(0, HILO_CARD_COUNT),
  };
};

export const hilo = {
  name: "hilo",
  selectValue: "hilo",
  resultStrategy: finalResultSecondRowStrategy,
  parseResult: parseHiloResult,
  inputs: [],
  selects: [],
};
