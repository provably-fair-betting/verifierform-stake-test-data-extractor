import { finalResultSecondParagraphStrategy } from "../result-strategies/final-result-paragraph.js";
import { parseValuesNumericGrid } from "../parsers/numeric-grid.js";

import type { Game } from "../types.js";

const difficultyValues = ["easy", "medium", "hard", "expert", "master"];

const parseDragonTowerResult = (rawResult: unknown) => {
  const eggPositionsByRound = parseValuesNumericGrid(rawResult, "Dragon Tower");

  return { eggPositionsByRound };
};

export const dragonTower: Game = {
  name: "dragontower",
  selectValue: "dragonTower",
  resultStrategy: finalResultSecondParagraphStrategy,
  parseResult: parseDragonTowerResult,
  inputs: [],
  selects: [
    {
      name: "dragonTowerDifficulty",
      values: difficultyValues,
      coverage: "each-once",
    },
  ],
};
