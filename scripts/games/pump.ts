import { parseNumberText } from "../parsers/text.js";
import { preFinalResultTextStrategy } from "../result-strategies/pre-final-result-text.js";

import type { Game } from "../types.js";

const difficultyValues = ["easy", "medium", "hard", "expert"];

export const pump: Game = {
  name: "pump",
  selectValue: "pump",
  resultStrategy: preFinalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [
    {
      name: "pumpDifficulty",
      values: difficultyValues,
      coverage: "each-once",
    },
  ],
};
