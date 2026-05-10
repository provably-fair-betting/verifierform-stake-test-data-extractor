import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

const EXPECTED_NUMBER_COUNT = 10;

const parseKenoResult = (rawResult) => {
  const match = String(rawResult).match(/\(([^)]+)\)/);

  if (!match) {
    throw new Error(
      `Keno expected numbers inside parentheses, got: ${rawResult}`,
    );
  }

  const numbers = match[1]
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10));

  if (numbers.length !== EXPECTED_NUMBER_COUNT || numbers.some(Number.isNaN)) {
    throw new Error(
      `Keno expected ${EXPECTED_NUMBER_COUNT} valid numbers, got: ${rawResult}`,
    );
  }

  return { numbers: numbers.sort((a, b) => a - b) };
};

export const keno = {
  name: "keno",
  selectValue: "keno",
  resultStrategy: finalResultTextStrategy,
  parseResult: parseKenoResult,
  inputs: [],
  selects: [],
};
