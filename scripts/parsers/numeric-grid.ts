export const parseValuesNumericGrid = (input: unknown, gameLabel: string): number[][] => {
  const rawInput = String(input);
  const match = rawInput.match(/Values:\s*(\[.*\])$/u);

  if (!match) {
    throw new Error(`${gameLabel} expected a Values array, got: ${rawInput}`);
  }

  let grid: unknown;

  try {
    grid = JSON.parse(match[1]);
  } catch {
    throw new Error(`${gameLabel} could not parse Values array: ${rawInput}`);
  }

  if (
    !Array.isArray(grid) ||
    grid.length === 0 ||
    grid.some(
      (row) =>
        !Array.isArray(row) ||
        row.length === 0 ||
        row.some((value) => !Number.isInteger(value)),
    )
  ) {
    throw new Error(
      `${gameLabel} expected a non-empty 2D numeric array, got: ${rawInput}`,
    );
  }

  return grid as number[][];
};
