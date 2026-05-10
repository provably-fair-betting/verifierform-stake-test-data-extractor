import { parseNumberText } from "../parsers/text.js";
import { preFinalResultTextStrategy } from "../result-strategies/pre-final-result-text.js";

export const limbo = {
  name: "limbo",
  selectValue: "limbo",
  resultStrategy: preFinalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [],
};
