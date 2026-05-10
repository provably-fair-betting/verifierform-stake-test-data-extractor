import { parseNumberText } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

import type { Game } from "../types.js";

export const roulette: Game = {
  name: "roulette",
  selectValue: "roulette",
  resultStrategy: finalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [],
};
