export function parseCssColor(value) {
  const normalizedValue = String(value).trim().toLowerCase();

  if (normalizedValue.startsWith("#")) {
    return parseHexColor(normalizedValue);
  }

  const rgbMatch = normalizedValue.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/u);

  if (!rgbMatch) {
    return null;
  }

  return rgbMatch.slice(1).map((component) => Number.parseInt(component, 10));
}

export function parseHexColor(hexColor) {
  const normalizedHex = hexColor.trim().toLowerCase();
  const hexMatch = normalizedHex.match(/^#([0-9a-f]{6})$/u);

  if (!hexMatch) {
    throw new Error(`Darts expected a 6-digit hex color, got: ${hexColor}`);
  }

  const [red, green, blue] = hexMatch[1]
    .match(/../gu)
    .map((component) => Number.parseInt(component, 16));

  return [red, green, blue];
}