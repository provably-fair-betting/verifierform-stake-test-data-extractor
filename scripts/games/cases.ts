import { parseTrimmedText } from "../parsers/text.js";
import { finalResultActiveRowSecondCellStrategy } from "../result-strategies/final-result-active-row-second-cell.js";

import type { Game } from "../types.js";

const difficultyValues = ["easy", "medium", "hard", "expert"];

export const cases: Game = {
  name: "cases",
  selectValue: "cases",
  resultStrategy: finalResultActiveRowSecondCellStrategy,
  parseResult: parseTrimmedText,
  inputs: [],
  selects: [
    {
      name: "casesDifficulty",
      values: difficultyValues,
      coverage: "each-once",
    },
  ],
};
