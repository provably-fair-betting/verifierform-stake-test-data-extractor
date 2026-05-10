import { finalResultSecondRowStrategy } from "../result-strategies/final-result-second-row.js";

import type { Game } from "../types.js";

const parseDiamondsResult = (rawResult: unknown) => {
  const gems = String(rawResult).trim().split(/\s+/).filter(Boolean);

  if (gems.length !== 5) {
    throw new Error(`Diamonds expected five gems, got: ${rawResult}`);
  }

  return { gems };
};

export const diamonds: Game = {
  name: "diamonds",
  selectValue: "diamonds",
  resultStrategy: finalResultSecondRowStrategy,
  parseResult: parseDiamondsResult,
  inputs: [],
  selects: [],
};
