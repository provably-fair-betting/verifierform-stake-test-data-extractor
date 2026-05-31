import { randomBytes } from "node:crypto";

import { finalResultFirstParagraphStrategy } from "../result-strategies/final-result-paragraph.js";

import type { Game } from "../types.js";

const createRandomHex = (byteCount: number): string =>
  randomBytes(byteCount).toString("hex");

const ZOO_ANIMALS = ["lion", "cheetah", "elephant", "crocodile", "rhino", "penguin"] as const;
type ZooAnimal = (typeof ZOO_ANIMALS)[number];

const parseZooResult = (rawResult: unknown): { animals: ZooAnimal[] } => {
  const pattern = new RegExp(ZOO_ANIMALS.join("|"), "g");
  const animals = [...String(rawResult).matchAll(pattern)].map(
    ([match]) => match as ZooAnimal,
  );

  if (animals.length !== 3) {
    throw new Error(`Zoo expected 3 animals, got: ${rawResult}`);
  }

  return { animals };
};

export const zoo: Game = {
  name: "zoo",
  selectValue: "zoo",
  useDefaultSeedPair: false,
  usesNonce: false,
  resultStrategy: finalResultFirstParagraphStrategy,
  parseResult: parseZooResult,
  inputs: [
    {
      name: "hash",
      value: () => createRandomHex(32),
    },
    {
      name: "seed",
      value: () => createRandomHex(16),
    },
  ],
  selects: [],
};
