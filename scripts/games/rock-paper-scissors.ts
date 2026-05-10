import { finalResultSecondParagraphStrategy } from "../result-strategies/final-result-paragraph.js";

import type { Game } from "../types.js";

const ROCK_PAPER_SCISSORS_VALUE_MAP: Record<string, string> = {
  0: "rock",
  1: "paper",
  2: "scissors",
};

const EXPECTED_VALUE_COUNT = 20;

const parseRockPaperScissorsResult = (rawResult: unknown) => {
  const values = Array.from(
    String(rawResult).matchAll(/\b([012])\b/g),
    ([, value]) => {
      const mappedValue = ROCK_PAPER_SCISSORS_VALUE_MAP[value];

      if (!mappedValue) {
        throw new Error(`Unsupported Rock Paper Scissors value "${value}"`);
      }

      return mappedValue;
    },
  );

  if (values.length !== EXPECTED_VALUE_COUNT) {
    throw new Error(
      `Rock Paper Scissors expected ${EXPECTED_VALUE_COUNT} values, got: ${rawResult}`,
    );
  }

  return { values };
};

export const rockPaperScissors: Game = {
  name: "rockpaperscissors",
  selectValue: "rockPaperScissors",
  resultStrategy: finalResultSecondParagraphStrategy,
  parseResult: parseRockPaperScissorsResult,
  inputs: [],
  selects: [],
};
