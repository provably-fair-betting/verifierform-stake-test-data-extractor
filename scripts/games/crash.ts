import { randomBytes } from "node:crypto";

import { parseFlooredTwoDecimalNumber } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

import type { Game } from "../types.js";

const createRandomHex = (byteCount: number): string => randomBytes(byteCount).toString("hex");

const createCrashHash = (): string => createRandomHex(32);

const createCrashSeed = (): string => createRandomHex(16);

export const crash: Game = {
  name: "crash",
  selectValue: "crash",
  useDefaultSeedPair: false,
  usesNonce: false,
  resultStrategy: finalResultTextStrategy,
  parseResult: parseFlooredTwoDecimalNumber,
  inputs: [
    {
      name: "hash",
      value: createCrashHash,
    },
    {
      name: "seed",
      value: createCrashSeed,
    },
  ],
  selects: [],
};
