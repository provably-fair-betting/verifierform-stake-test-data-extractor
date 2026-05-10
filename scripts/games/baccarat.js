import { parseCards } from "../parsers/cards.js";
import { finalResultSecondRowStrategy } from "../result-strategies/final-result-second-row.js";

const parseBaccaratResult = (rawResult) => {
  const cards = parseCards(rawResult);

  if (cards.length !== 6) {
    throw new Error(
      `Baccarat expected 6 cards, got ${cards.length}: ${rawResult}`,
    );
  }

  return {
    playerCards: cards.slice(0, 2),
    dealerCards: cards.slice(2, 4),
    deciderCards: cards.slice(4, 6),
  };
};

export const baccarat = {
  name: "baccarat",
  selectValue: "baccarat",
  resultStrategy: finalResultSecondRowStrategy,
  parseResult: parseBaccaratResult,
  inputs: [],
  selects: [],
};
