import { finalResultSecondParagraphStrategy } from "../result-strategies/final-result-paragraph.js";
import { parseValuesNumericGrid } from "../parsers/numeric-grid.js";

const moleCountValues = ["1", "2", "3", "4", "5", "6"];

const parseMolesResult = (rawResult) => {
  const molePositionsByRound = parseValuesNumericGrid(rawResult, "Moles");

  return { molePositionsByRound };
};

export const moles = {
  name: "moles",
  selectValue: "moles",
  resultStrategy: finalResultSecondParagraphStrategy,
  parseResult: parseMolesResult,
  inputs: [],
  selects: [
    {
      name: "molesCount",
      values: moleCountValues,
      coverage: "each-once",
    },
  ],
};
