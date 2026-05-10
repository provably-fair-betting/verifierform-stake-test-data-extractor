import { snakesRollLinesStrategy } from "../result-strategies/snakes-roll-lines.js";

import type { Game } from "../types.js";

const difficultyValues = ["easy", "medium", "hard", "expert", "master"];
const EXPECTED_ROLL_COUNT = 5;

const parseSnakesResult = (rawResult: unknown) => {
  const rollTotals = Array.from(
    String(rawResult).matchAll(/=\s*(\d+)$/gmu),
    ([, value]) => Number.parseInt(value, 10),
  );

  if (
    rollTotals.length !== EXPECTED_ROLL_COUNT ||
    rollTotals.some(Number.isNaN)
  ) {
    throw new Error(
      `Snakes expected ${EXPECTED_ROLL_COUNT} roll totals, got: ${rawResult}`,
    );
  }

  return { rollTotals };
};

export const snakes: Game = {
  name: "snakes",
  selectValue: "snakes",
  resultStrategy: snakesRollLinesStrategy,
  parseResult: parseSnakesResult,
  inputs: [],
  selects: [
    {
      name: "snakesDifficulty",
      values: difficultyValues,
      coverage: "each-once",
    },
  ],
};
