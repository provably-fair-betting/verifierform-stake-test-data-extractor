import { drillMultipliersStrategy } from "../result-strategies/drill-multipliers.js";
import { parseMultiplierText } from "../parsers/text.js";

const EXPECTED_MULTIPLIER_COUNT = 3;

const parseDrillResult = (rawResult) => {
  const multipliers = String(rawResult)
    .split(/\n/u)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(parseMultiplierText);

  if (multipliers.length !== EXPECTED_MULTIPLIER_COUNT) {
    throw new Error(
      `Drill expected ${EXPECTED_MULTIPLIER_COUNT} multipliers, got ${multipliers.length}: ${rawResult}`,
    );
  }

  return { multipliers };
};

export const drill = {
  name: "drill",
  selectValue: "drill",
  resultStrategy: drillMultipliersStrategy,
  parseResult: parseDrillResult,
  inputs: [],
  selects: [],
};
