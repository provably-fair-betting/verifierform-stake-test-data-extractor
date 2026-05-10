import { parseNumberText } from "../parsers/text.js";
import { preFinalResultTextStrategy } from "../result-strategies/pre-final-result-text.js";

const difficultyValues = ["easy", "medium", "hard", "expert"];

export const chicken = {
  name: "chicken",
  selectValue: "chicken",
  resultStrategy: preFinalResultTextStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [
    {
      name: "chickenDifficulty",
      values: difficultyValues,
      coverage: "each-once",
    },
  ],
};
