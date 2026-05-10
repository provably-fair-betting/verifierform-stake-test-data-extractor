import { finalResultSecondRowStrategy } from "../result-strategies/final-result-second-row.js";

const parseDiamondsResult = (rawResult) => {
  const gems = String(rawResult).trim().split(/\s+/).filter(Boolean);

  if (gems.length !== 5) {
    throw new Error(`Diamonds expected five gems, got: ${rawResult}`);
  }

  return { gems };
};

export const diamonds = {
  name: "diamonds",
  selectValue: "diamonds",
  resultStrategy: finalResultSecondRowStrategy,
  parseResult: parseDiamondsResult,
  inputs: [],
  selects: [],
};
