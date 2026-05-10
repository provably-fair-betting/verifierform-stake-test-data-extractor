export const parseValuesNumericGrid = (input, gameLabel) => {
  const rawInput = String(input);
  const match = rawInput.match(/Values:\s*(\[.*\])$/u);

  if (!match) {
    throw new Error(`${gameLabel} expected a Values array, got: ${rawInput}`);
  }

  let grid;

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

  return grid;
};
