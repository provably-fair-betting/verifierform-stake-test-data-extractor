import { parseNumberText } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

import type { Game } from "../types.js";

export const dice: Game = {
  name: "dice",
  selectValue: "dice",
  resultStrategy: finalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [],
};
