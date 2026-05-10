import { randomBytes } from "node:crypto";

import { parseFlooredTwoDecimalNumber } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

import type { Game } from "../types.js";

const createRandomHex = (byteCount: number): string => randomBytes(byteCount).toString("hex");

const createSlideHash = (): string => createRandomHex(32);

const createSlideSeed = (): string => createRandomHex(16);

export const slide: Game = {
  name: "slide",
  selectValue: "slide",
  useDefaultSeedPair: false,
  usesNonce: false,
  resultStrategy: finalResultTextStrategy,
  parseResult: parseFlooredTwoDecimalNumber,
  inputs: [
    {
      name: "hash",
      value: createSlideHash,
    },
    {
      name: "seed",
      value: createSlideSeed,
    },
  ],
  selects: [],
};
