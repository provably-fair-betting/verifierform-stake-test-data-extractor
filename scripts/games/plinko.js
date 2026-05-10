import { parseNumberText } from "../parsers/text.js";
import { finalResultMarkedSecondRowCellStrategy } from "../result-strategies/final-result-marked-second-row-cell.js";

export const plinko = {
  name: "plinko",
  selectValue: "plinko",
  resultStrategy: finalResultMarkedSecondRowCellStrategy,
  parseResult: parseNumberText,
  inputs: [],
  selects: [
    {
      name: "plinkoRisk",
      values: ["low", "medium", "high", "expert"],
      coverage: "each-once",
    },
    {
      name: "plinkoRow",
      values: ["8", "9", "10", "11", "12", "13", "14", "15", "16"],
      coverage: "each-once",
    },
  ],
};
