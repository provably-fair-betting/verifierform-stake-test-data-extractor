import { parseNumberText } from "../parsers/text.js";
import { finalResultMarkedSecondRowCellStrategy } from "../result-strategies/final-result-marked-second-row-cell.js";

export const wheel = {
  name: "wheel",
  selectValue: "wheel",
  resultStrategy: finalResultMarkedSecondRowCellStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [
    {
      name: "wheelRisk",
      values: ["low", "medium", "high"],
      coverage: "each-once",
    },
    {
      name: "wheelSegments",
      values: ["10", "20", "30", "40", "50"],
      coverage: "each-once",
    },
  ],
};