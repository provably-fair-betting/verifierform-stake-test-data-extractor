import { finalResultSecondParagraphStrategy } from "../result-strategies/final-result-paragraph.js";

import type { Game } from "../types.js";

const parseFlipResult = (rawResult: unknown) => {
  const values = Array.from(
    String(rawResult).matchAll(/"(heads|tails)"/gi),
    ([, value]) => value.toLowerCase(),
  );

  if (values.length !== 20) {
    throw new Error(`Flip expected 20 heads/tails values, got: ${rawResult}`);
  }

  return { values };
};

export const flip: Game = {
  name: "flip",
  selectValue: "flip",
  resultStrategy: finalResultSecondParagraphStrategy,
  parseResult: parseFlipResult,
  inputs: [],
  selects: [],
};
