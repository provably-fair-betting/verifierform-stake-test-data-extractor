import {
  BLUE_SAMURAI_CATEGORY_ORDER,
  classifyBlueSamuraiRounds,
  simulateBlueSamuraiRounds,
} from "./blue-samurai-simulation.js";
import { byTestId, calculationTestId } from "./dom.js";
import { buildSampleContext } from "./sample-context.js";
import { setCalculationInput, setCalculationSelect } from "./form.js";

import type {
  BlueSamuraiRound,
  BuildSampleContextsOptions,
  Game,
  GameSeeds,
  InteractionOptions,
  Page,
  SampleContext,
} from "../types.js";

type BlueSamuraiCategory = string;

type BlueSamuraiCategoryTargets = Record<BlueSamuraiCategory, number>;
type BlueSamuraiBuckets = Record<BlueSamuraiCategory, BlueSamuraiSampleResult[]>;

type BlueSamuraiSampleResult = {
  category: string;
  nonce: number;
  rounds: BlueSamuraiRound[];
};

type VerifiedBlueSamuraiRound = {
  round: number;
  floatColumns: (number | null)[][];
  lookupSymbols: (string | null)[];
};

type VerifiedBlueSamuraiResult = {
  verifiedRounds: VerifiedBlueSamuraiRound[];
};

type LookupCheck = {
  float: number;
  outer: boolean;
};

type CalculatorState = {
  round: string;
  previousSpecialSpinsCount: string;
  isSpecial: string;
};

const BLUE_SAMURAI_NAME = "blue-samurai";
const BLUE_SAMURAI_RESULT_HEADING = "Final Result";
const BLUE_SAMURAI_CATEGORY_DEFINITIONS = [
  { key: "bonus", category: "bonus" },
  { key: "specialRounds", category: "special-rounds" },
  { key: "bonusWithRetrigger", category: "bonus-with-retrigger" },
  { key: "bonusWithSpecialRounds", category: "bonus-with-special-rounds" },
];
const BLUE_SAMURAI_SCAN_LIMIT = 250_000;

export async function buildBlueSamuraiSampleContexts({
  game,
  gameSeeds,
  logger,
  samplePlan,
}: BuildSampleContextsOptions): Promise<SampleContext[]> {
  const blueSamuraiCategoryCounts = resolveBlueSamuraiCategoryCounts(
    game,
    samplePlan.sampleCount,
  );
  const samples = findBlueSamuraiSampleResults({
    clientSeed: (gameSeeds as GameSeeds).clientSeed,
    serverSeed: (gameSeeds as GameSeeds).serverSeed,
    targets: blueSamuraiCategoryCounts,
  });

  logger.verbose(
    `[game:${game.name}] Found Blue Samurai nonces ${samples
      .map((sample) => `${sample.category}=${sample.nonce}`)
      .join(", ")}`,
  );

  return samples.map((sample, sampleIndex) =>
    buildSampleContext(
      game,
      sampleIndex,
      samplePlan.selectCombinations,
      gameSeeds,
      {
        nonce: sample.nonce,
        blueSamuraiCategory: sample.category,
        blueSamuraiRounds: sample.rounds,
      },
    ),
  );
}

function resolveBlueSamuraiCategoryCounts(
  game: Game,
  sampleCount: number,
): BlueSamuraiCategoryTargets {
  if (!Number.isInteger(sampleCount) || sampleCount <= 0) {
    throw new Error(
      `[game:${BLUE_SAMURAI_NAME}] sample count must be a positive integer, got ${sampleCount}`,
    );
  }

  const configuredCounts = game.sampleCategoryDefaults ?? {};
  assertSupportedBlueSamuraiCategoryDefaults(game, configuredCounts);
  const counts = Object.fromEntries(
    BLUE_SAMURAI_CATEGORY_DEFINITIONS.map(({ key, category }) => [
      category,
      resolveBlueSamuraiCategoryCount(game, key, configuredCounts[key]),
    ]),
  );
  const configuredTotal = Object.values(counts).reduce(
    (total, count) => total + count,
    0,
  );

  if (configuredTotal > sampleCount) {
    throw new Error(
      `[game:${game.name}] configured Blue Samurai category counts (${configuredTotal}) cannot exceed sample count (${sampleCount})`,
    );
  }

  counts.ordinary = sampleCount - configuredTotal;

  return counts;
}

function assertSupportedBlueSamuraiCategoryDefaults(
  game: Game,
  configuredCounts: Record<string, number>,
): void {
  const allowedKeys = new Set(
    BLUE_SAMURAI_CATEGORY_DEFINITIONS.map(({ key }) => key),
  );

  for (const key of Object.keys(configuredCounts)) {
    if (!allowedKeys.has(key)) {
      throw new Error(
        `[game:${game.name}] Blue Samurai sampleCategoryDefaults.${key} is not supported`,
      );
    }
  }
}

function resolveBlueSamuraiCategoryCount(
  game: Game,
  key: string,
  value: number | undefined,
): number {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `[game:${game.name}] Blue Samurai sampleCategoryDefaults.${key} must be a non-negative integer`,
    );
  }

  return value;
}

export function findBlueSamuraiSampleResults({
  clientSeed,
  serverSeed,
  targets,
  scanLimit = BLUE_SAMURAI_SCAN_LIMIT,
}: {
  clientSeed: string;
  serverSeed: string;
  targets: BlueSamuraiCategoryTargets;
  scanLimit?: number;
}): BlueSamuraiSampleResult[] {
  const buckets: BlueSamuraiBuckets = Object.fromEntries(
    BLUE_SAMURAI_CATEGORY_ORDER.map((category) => [category, []]),
  );

  for (let nonce = 0; nonce < scanLimit; nonce += 1) {
    const rounds = simulateBlueSamuraiRounds({ clientSeed, serverSeed, nonce });
    const category = classifyBlueSamuraiRounds(rounds);

    if (!category || buckets[category].length >= (targets[category] ?? 0)) {
      if (hasCollectedAllBlueSamuraiTargets(buckets, targets)) {
        break;
      }

      continue;
    }

    buckets[category].push({
      category,
      nonce,
      rounds,
    });

    if (hasCollectedAllBlueSamuraiTargets(buckets, targets)) {
      break;
    }
  }

  if (!hasCollectedAllBlueSamuraiTargets(buckets, targets)) {
    throw new Error(
      `Could not find enough Blue Samurai samples within ${scanLimit} nonces`,
    );
  }

  return BLUE_SAMURAI_CATEGORY_ORDER.flatMap((category) => buckets[category]);
}

function hasCollectedAllBlueSamuraiTargets(
  buckets: BlueSamuraiBuckets,
  targets: BlueSamuraiCategoryTargets,
): boolean {
  return BLUE_SAMURAI_CATEGORY_ORDER.every(
    (category) => buckets[category].length >= (targets[category] ?? 0),
  );
}

export async function readVerifiedBlueSamuraiResult(
  page: Page,
  context: SampleContext,
  interactionOptions: InteractionOptions,
): Promise<VerifiedBlueSamuraiResult> {
  const verifiedRounds: VerifiedBlueSamuraiRound[] = [];
  const calculatorState = await readBlueSamuraiCalculatorState(page);

  for (const expectedRound of context.blueSamuraiRounds ?? []) {
    await applyBlueSamuraiRoundState(
      page,
      calculatorState,
      expectedRound,
      interactionOptions,
    );

    const verifiedRound = await page.evaluate(
      async ({
        headingText,
        lookupChecks,
      }: {
        headingText: string;
        lookupChecks: LookupCheck[];
      }) => {
        const finalHeading = Array.from(document.querySelectorAll("h2")).find(
          (node) => node.textContent?.trim() === headingText,
        );
        const container = finalHeading?.nextElementSibling;

        if (!container) {
          return null;
        }

        const valuesLabel = Array.from(
          container.querySelectorAll("span, div, p"),
        ).find(
          (node) => node.textContent?.trim() === "Values in the shape of game:",
        );
        const valuesRow = valuesLabel?.nextElementSibling;
        const floatColumns = Array.from(valuesRow?.children ?? [])
          .map((column) =>
            Array.from(column.querySelectorAll("span"))
              .map((node) => node.textContent?.trim())
              .filter((value) => /^0(?:\.\d+)?$/u.test(value ?? ""))
              .map((value) => Number.parseFloat(value as string)),
          )
          .filter((column) => column.length > 0);

        const labels = Array.from(container.querySelectorAll("label"));
        const lookupInput = labels
          .find((label) =>
            label.textContent?.includes(
              "Look up symbol with one of the values above",
            ),
          )
          ?.querySelector("input");
        const outerSelect = labels
          .find((label) =>
            label.textContent?.includes(
              "Is the symbol located either in the 1st or 5th reel?",
            ),
          )
          ?.querySelector("select");
        const searchButton = Array.from(
          container.querySelectorAll("button"),
        ).find((button) => button.textContent?.trim() === "Search symbol");

        if (!Array.isArray(lookupChecks)) {
          return null;
        }

        const lookupSymbols: (string | null)[] = [];

        if (lookupChecks.length > 0) {
          if (
            !(lookupInput instanceof HTMLInputElement) ||
            !(outerSelect instanceof HTMLSelectElement) ||
            !(searchButton instanceof HTMLButtonElement)
          ) {
            return null;
          }

          const setControlValue = (
            element: HTMLInputElement | HTMLSelectElement,
            value: string,
          ) => {
            const prototype =
              element instanceof HTMLSelectElement
                ? HTMLSelectElement.prototype
                : HTMLInputElement.prototype;
            const descriptor = Object.getOwnPropertyDescriptor(
              prototype,
              "value",
            );

            descriptor?.set?.call(element, value);
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));
          };

          for (const lookupCheck of lookupChecks) {
            setControlValue(lookupInput, String(lookupCheck.float));
            setControlValue(outerSelect, lookupCheck.outer ? "Yes" : "No");
            searchButton.click();
            await new Promise((resolve) => globalThis.setTimeout(resolve, 50));

            const resultImage = container.querySelector(".result-wrap img");
            const src = resultImage?.getAttribute("src") ?? "";
            const fileName = src.split("/").at(-1) ?? "";
            const symbolMatch = fileName.match(/^([a-z0-9-]+)\./iu);

            lookupSymbols.push(symbolMatch?.[1] ?? null);
          }
        }

        return {
          floatColumns,
          lookupSymbols,
        };
      },
      {
        headingText: BLUE_SAMURAI_RESULT_HEADING,
        lookupChecks: buildLookupChecks(expectedRound),
      },
    );

    if (!verifiedRound) {
      throw new Error(
        `Could not read Blue Samurai verification data from Stake for round ${expectedRound.round}`,
      );
    }

    verifiedRounds.push({
      round: expectedRound.round,
      ...verifiedRound,
    });
  }

  return { verifiedRounds };
}

async function readBlueSamuraiCalculatorState(page: Page): Promise<CalculatorState> {
  const roundSelector = byTestId(
    calculationTestId("input", "samuraiSlotsRound"),
  );
  const previousSpecialSpinsCountSelector = byTestId(
    calculationTestId("input", "samuraiSlotsPreviousSpecialSpinsCount"),
  );
  const isSpecialSelector = byTestId(
    calculationTestId("select", "samuraiSlotsIsSpecial"),
  );

  const state = await page.evaluate(
    ({
      roundSelector,
      previousSpecialSpinsCountSelector,
      isSpecialSelector,
    }: {
      roundSelector: string;
      previousSpecialSpinsCountSelector: string;
      isSpecialSelector: string;
    }) => {
      const round = document.querySelector(roundSelector);
      const previousSpecialSpinsCount = document.querySelector(
        previousSpecialSpinsCountSelector,
      );
      const isSpecial = document.querySelector(isSpecialSelector);

      if (
        !(round instanceof HTMLInputElement) ||
        !(previousSpecialSpinsCount instanceof HTMLInputElement) ||
        !(isSpecial instanceof HTMLSelectElement)
      ) {
        return null;
      }

      return {
        round: round.value,
        previousSpecialSpinsCount: previousSpecialSpinsCount.value,
        isSpecial: isSpecial.value,
      };
    },
    {
      roundSelector,
      previousSpecialSpinsCountSelector,
      isSpecialSelector,
    },
  );

  if (!state) {
    throw new Error(`Could not read Blue Samurai calculator state`);
  }

  return state;
}

async function applyBlueSamuraiRoundState(
  page: Page,
  calculatorState: CalculatorState,
  expectedRound: BlueSamuraiRound,
  interactionOptions: InteractionOptions,
): Promise<void> {
  const nextRound = String(expectedRound.round);
  const nextPreviousSpecialSpinsCount = String(
    expectedRound.previousSpecialSpinsCount,
  );
  const nextIsSpecial = expectedRound.specialRound ? "Yes" : "No";

  if (calculatorState.round !== nextRound) {
    await setCalculationInput(
      page,
      "samuraiSlotsRound",
      expectedRound.round,
      interactionOptions,
    );
    calculatorState.round = nextRound;
  }

  if (
    calculatorState.previousSpecialSpinsCount !== nextPreviousSpecialSpinsCount
  ) {
    await setCalculationInput(
      page,
      "samuraiSlotsPreviousSpecialSpinsCount",
      expectedRound.previousSpecialSpinsCount,
      interactionOptions,
    );
    calculatorState.previousSpecialSpinsCount = nextPreviousSpecialSpinsCount;
  }

  if (calculatorState.isSpecial !== nextIsSpecial) {
    await setCalculationSelect(
      page,
      "samuraiSlotsIsSpecial",
      nextIsSpecial,
      interactionOptions,
    );
    calculatorState.isSpecial = nextIsSpecial;
  }
}

function buildLookupChecks(round: BlueSamuraiRound): LookupCheck[] {
  if (round.specialRound) {
    return [];
  }

  return round.symbols
    .filter((symbol) => typeof symbol.float === "number")
    .map((symbol) => ({
      float: symbol.float as number,
      outer: symbol.reelType === "outer",
    }));
}

function buildExpectedLookupSymbols(round: BlueSamuraiRound): string[] {
  if (round.specialRound) {
    return [];
  }

  return round.symbols
    .filter((symbol) => typeof symbol.float === "number")
    .map((symbol) => symbol.lookupSymbol);
}

export function parseBlueSamuraiResult(rawResult: unknown, context: SampleContext): unknown {
  const expectedRounds = context.blueSamuraiRounds ?? [];
  const verifiedRounds = (rawResult as VerifiedBlueSamuraiResult)?.verifiedRounds;

  if (!Array.isArray(verifiedRounds)) {
    throw new Error(
      `Blue Samurai verification expected verified rounds from Stake`,
    );
  }

  if (verifiedRounds.length !== expectedRounds.length) {
    throw new Error(
      `Blue Samurai verification round count mismatch: expected ${expectedRounds.length}, got ${verifiedRounds.length}`,
    );
  }

  for (let index = 0; index < expectedRounds.length; index += 1) {
    const expectedRound = expectedRounds[index];
    const verifiedRound = verifiedRounds[index];

    if (
      !sameNumberMatrix(expectedRound.floatColumns, verifiedRound.floatColumns)
    ) {
      throw new Error(
        `Blue Samurai float mismatch for round ${expectedRound.round}`,
      );
    }

    const expectedLookupSymbols = buildExpectedLookupSymbols(expectedRound);

    if (!sameArray(expectedLookupSymbols, verifiedRound.lookupSymbols)) {
      throw new Error(
        `Blue Samurai lookup mismatch for round ${expectedRound.round}`,
      );
    }
  }

  return {
    category: context.blueSamuraiCategory,
    rounds: expectedRounds,
  };
}

function sameNumberMatrix(
  left: (number | null)[][],
  right: (number | null)[][],
): boolean {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((leftColumn, index) => sameArray(leftColumn, right[index]))
  );
}

function sameArray<T>(left: T[], right: T[]): boolean {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}
