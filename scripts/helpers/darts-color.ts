import { parseCssColor, parseHexColor } from "../parsers/css-color.js";

type RgbTuple = [number, number, number];

const DARTS_COLORS = {
  bullseyeGreen: "#24e700",
  outerRed: "#fb053f",
  outerOrange: "#fb6120",
  outerYellow: "#fcc101",
  boardSlate: "#213843",
  boardNavy: "#0e202c",
} as const;

type DartsHexColor = (typeof DARTS_COLORS)[keyof typeof DARTS_COLORS];
type DartsDifficulty = "easy" | "medium" | "hard" | "expert";

const KNOWN_DARTS_COLORS = Object.values(DARTS_COLORS) as DartsHexColor[];

const DARTS_COLOR_TO_MULTI: Record<DartsDifficulty, Record<DartsHexColor, number>> = {
  easy: {
    [DARTS_COLORS.bullseyeGreen]: 8.5,
    [DARTS_COLORS.outerRed]: 2.7,
    [DARTS_COLORS.outerOrange]: 1.5,
    [DARTS_COLORS.outerYellow]: 1.2,
    [DARTS_COLORS.boardSlate]: 0.8,
    [DARTS_COLORS.boardNavy]: 0.5,
  },
  medium: {
    [DARTS_COLORS.bullseyeGreen]: 16,
    [DARTS_COLORS.outerRed]: 6,
    [DARTS_COLORS.outerOrange]: 3.1,
    [DARTS_COLORS.outerYellow]: 1.3,
    [DARTS_COLORS.boardSlate]: 0.6,
    [DARTS_COLORS.boardNavy]: 0.4,
  },
  hard: {
    [DARTS_COLORS.bullseyeGreen]: 63,
    [DARTS_COLORS.outerRed]: 8.8,
    [DARTS_COLORS.outerOrange]: 3.6,
    [DARTS_COLORS.outerYellow]: 2.5,
    [DARTS_COLORS.boardSlate]: 0.5,
    [DARTS_COLORS.boardNavy]: 0.2,
  },
  expert: {
    [DARTS_COLORS.bullseyeGreen]: 500,
    [DARTS_COLORS.outerRed]: 42,
    [DARTS_COLORS.outerOrange]: 9.6,
    [DARTS_COLORS.outerYellow]: 4.8,
    [DARTS_COLORS.boardSlate]: 0.5,
    [DARTS_COLORS.boardNavy]: 0.1,
  },
};

export function resolveDartsColorOutcome(
  fill: string,
  difficulty: string | undefined,
): { pixelColor: string; multi: number } {
  if (!difficulty || !(difficulty in DARTS_COLOR_TO_MULTI)) {
    throw new Error(`Darts expected a supported dartsDifficulty select value`);
  }

  const pixelColor = normalizeDartsColor(fill);
  const multi = DARTS_COLOR_TO_MULTI[difficulty as DartsDifficulty][pixelColor as DartsHexColor];

  if (typeof multi !== "number") {
    throw new Error(
      `Darts could not resolve multiplier for difficulty "${difficulty}" and color "${pixelColor}"`,
    );
  }

  return {
    pixelColor,
    multi,
  };
}

function normalizeDartsColor(fill: string): string {
  const actual = parseCssColor(fill);

  if (!actual) {
    throw new Error(`Darts expected a supported SVG fill color, got: ${fill}`);
  }

  let closestColor: DartsHexColor | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const knownColor of KNOWN_DARTS_COLORS) {
    const candidate = parseHexColor(knownColor);
    const distance = colorDistanceSquared(actual, candidate);

    if (distance < closestDistance) {
      closestColor = knownColor;
      closestDistance = distance;
    }
  }

  if (!closestColor) {
    throw new Error(`Darts could not normalize SVG fill color: ${fill}`);
  }

  return closestColor;
}

function colorDistanceSquared(left: RgbTuple, right: RgbTuple): number {
  const redDistance = left[0] - right[0];
  const greenDistance = left[1] - right[1];
  const blueDistance = left[2] - right[2];

  return redDistance ** 2 + greenDistance ** 2 + blueDistance ** 2;
}
