import { parseNumberText } from "../parsers/text.js";
import { preFinalResultTextStrategy } from "../result-strategies/pre-final-result-text.js";

import type { Game } from "../types.js";

export const limbo: Game = {
  name: "limbo",
  selectValue: "limbo",
  resultStrategy: preFinalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [],
};
