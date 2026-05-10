export const parseTrimmedText = (input: unknown): string => String(input).trim();

export const parseNumberText = (input: unknown): number => {
  const trimmed = parseTrimmedText(input);
  const value = Number.parseFloat(trimmed);

  if (Number.isNaN(value)) {
    throw new Error(`Expected a numeric result, received: ${input}`);
  }

  return value;
};

export const parseMultiplierText = (input: unknown): number => {
  const trimmed = parseTrimmedText(input);
  const normalizedValue = trimmed
    .replace(/^[×x]\s*/iu, "")
    .replace(/\s*[×x]$/iu, "");
  const multiplier = Number.parseFloat(normalizedValue);

  if (Number.isNaN(multiplier)) {
    throw new Error(`Invalid multiplier value "${input}"`);
  }

  return multiplier;
};

export const parseFlooredTwoDecimalNumber = (input: unknown): number => {
  const value = parseNumberText(input);

  return Math.floor((value + Number.EPSILON) * 100) / 100;
};
