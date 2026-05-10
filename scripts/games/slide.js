import { randomBytes } from "node:crypto";

import { parseFlooredTwoDecimalNumber } from "../parsers/text.js";
import { finalResultTextStrategy } from "../result-strategies/final-result-text.js";

const createRandomHex = (byteCount) => randomBytes(byteCount).toString("hex");

const createSlideHash = () => createRandomHex(32);

const createSlideSeed = () => createRandomHex(16);

export const slide = {
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
