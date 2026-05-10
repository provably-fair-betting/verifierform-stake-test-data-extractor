import { packsCardIdsStrategy } from "../result-strategies/packs-card-ids.js";

const EXPECTED_CARD_COUNT = 5;

const parsePacksResult = (rawResult) => {
  const cardIds = Array.from(
    String(rawResult).matchAll(/\bID\s+(\d+)\b/giu),
    ([, value]) => Number.parseInt(value, 10),
  );

  if (cardIds.length !== EXPECTED_CARD_COUNT || cardIds.some(Number.isNaN)) {
    throw new Error(
      `Packs expected ${EXPECTED_CARD_COUNT} valid card ids, got: ${rawResult}`,
    );
  }

  return {
    cardIds: [...cardIds].sort((left, right) => left - right),
  };
};

export const packs = {
  name: "packs",
  selectValue: "packs",
  resultStrategy: packsCardIdsStrategy,
  parseResult: parsePacksResult,
  inputs: [],
  selects: [],
};
