import { finalResultFirstParagraphStrategy } from "../result-strategies/final-result-paragraph.js";

const mineCountValues = Array.from({ length: 24 }, (_, index) =>
  String(index + 1),
);

const parseMinesResult = (rawResult) => {
  const values = Array.from(String(rawResult).matchAll(/\b\d+\b/g), ([value]) =>
    Number.parseInt(value, 10),
  );

  if (values.length === 0 || values.some(Number.isNaN)) {
    throw new Error(
      `Mines expected at least one valid value, got: ${rawResult}`,
    );
  }

  return {
    minePositions: values.sort((a, b) => a - b),
  };
};

export const mines = {
  name: "mines",
  selectValue: "mines",
  resultStrategy: finalResultFirstParagraphStrategy,
  parseResult: parseMinesResult,
  inputs: [],
  selects: [
    {
      name: "minesCount",
      values: mineCountValues,
      coverage: "each-once",
    },
  ],
};
