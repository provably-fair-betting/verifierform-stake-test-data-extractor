import { barsTilesStrategy } from "../result-strategies/bars-tiles.js";
import { parseMultiplierText } from "../parsers/text.js";

const BARS_TILE_COUNT = 30;

const parseBarsResult = (rawResult) => {
  const multipliers = String(rawResult)
    .split(/\n/u)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(parseMultiplierText);

  if (multipliers.length !== BARS_TILE_COUNT) {
    throw new Error(
      `Bars expected ${BARS_TILE_COUNT} multipliers, got ${multipliers.length}: ${rawResult}`,
    );
  }

  return { multipliers };
};

export const bars = {
  name: "bars",
  selectValue: "bars",
  resultStrategy: barsTilesStrategy,
  parseResult: parseBarsResult,
  inputs: [],
  selects: [
    {
      name: "barsDifficulty",
      values: ["easy", "medium", "hard", "expert"],
      coverage: "each-once",
    },
    {
      name: "barsTilesCount",
      values: ["1", "2", "3", "4", "5"],
      coverage: "each-once",
    },
  ],
};
