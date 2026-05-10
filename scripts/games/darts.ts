import { dartsThrowDetailsStrategy } from "../result-strategies/darts-throw-details.js";
import { resolveDartsColorOutcome } from "../helpers/darts-color.js";

import type { Game, SampleContext } from "../types.js";

type DartsRawResult = {
  detailsText: string;
  fill: string;
};

const dartsDifficultyValues = ["easy", "medium", "hard", "expert"];

const parseDartsResult = (rawResult: unknown, context: SampleContext) => {
  const detailsText = (rawResult as DartsRawResult)?.detailsText;
  const fill = (rawResult as DartsRawResult)?.fill;

  if (typeof detailsText !== "string" || typeof fill !== "string") {
    throw new Error(
      `Darts expected detail text and fill color from its result strategy`,
    );
  }

  const rotation = parseLabeledNumber(detailsText, "Rotation");
  const distance = parseLabeledNumber(detailsText, "Distance");
  const difficulty = context?.selectValues?.dartsDifficulty;
  const { pixelColor, multi } = resolveDartsColorOutcome(fill, difficulty);

  return {
    rotation,
    distance,
    pixelColor,
    multi,
  };
};

function parseLabeledNumber(input: string, label: string): number {
  const match = String(input).match(
    new RegExp(`${escapeRegExp(label)}\\s*-\\s*([0-9]+(?:\\.[0-9]+)?)`, "u"),
  );

  if (!match) {
    throw new Error(`Darts expected a "${label}" value, got: ${input}`);
  }

  const value = Number.parseFloat(match[1]);

  if (Number.isNaN(value)) {
    throw new Error(`Darts expected "${label}" to be numeric, got: ${input}`);
  }

  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export const darts: Game = {
  name: "darts",
  selectValue: "darts",
  resultStrategy: dartsThrowDetailsStrategy,
  parseResult: parseDartsResult,
  inputs: [],
  selects: [
    {
      name: "dartsDifficulty",
      values: dartsDifficultyValues,
      coverage: "each-once",
    },
  ],
};
