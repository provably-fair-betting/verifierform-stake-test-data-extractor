import { randomBytes } from "node:crypto";

import { parseFlooredTwoDecimalNumber } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

const createRandomHex = (byteCount) => randomBytes(byteCount).toString("hex");

const createCrashHash = () => createRandomHex(32);

const createCrashSeed = () => createRandomHex(16);

export const crash = {
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
