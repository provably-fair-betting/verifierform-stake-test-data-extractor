import { parseNumberText } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

export const dice = {
  name: "dice",
  selectValue: "dice",
  resultStrategy: finalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [],
};
