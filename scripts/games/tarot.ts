import { tarotSelectedMultipliersStrategy } from "../result-strategies/tarot-selected-multipliers.js";
import { parseMultiplierText } from "../parsers/text.js";

import type { Game } from "../types.js";

const difficultyValues = ["easy", "medium", "hard", "expert"];
const EXPECTED_CARD_COUNT = 3;

const parseTarotResult = (rawResult: unknown) => {
  const selectedMultipliers = String(rawResult)
    .split(/\n/u)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(parseMultiplierText);

  if (selectedMultipliers.length !== EXPECTED_CARD_COUNT) {
    throw new Error(
      `Tarot expected ${EXPECTED_CARD_COUNT} selected multipliers, got: ${rawResult}`,
    );
  }

  return { selectedMultipliers };
};

export const tarot: Game = {
  name: "tarot",
  selectValue: "tarot",
  resultStrategy: tarotSelectedMultipliersStrategy,
  parseResult: parseTarotResult,
  inputs: [],
  selects: [
    {
      name: "tarotDifficulty",
      values: difficultyValues,
      coverage: "each-once",
    },
  ],
};
