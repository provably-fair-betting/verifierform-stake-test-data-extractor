import { parseNumberText } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

export const roulette = {
  name: "roulette",
  selectValue: "roulette",
  resultStrategy: finalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [],
};
