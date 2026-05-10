import { parseNumberText } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

import type { Game } from "../types.js";

export const primedice: Game = {
  name: "primedice",
  selectValue: "primediceX",
  resultStrategy: finalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [],
};
