import { buildSampleContext } from "./sample-context.js";
import { setCalculationInput } from "./form.js";
import { findSlotSampleResults } from "./slot-simulation.js";

import type {
  BuildSampleContextsOptions,
  Game,
  GameSeeds,
  InteractionOptions,
  Page,
  SampleContext,
  SlotRound,
  VisibleReelSymbols,
} from "../types.js";

type SlotGameConfig = {
  name: string;
  selectValue: string;
  roundInputName: string;
  sampleCategoryDefaults?: { bonus: number; retrigger: number };
};

type VerifiedSlotRound = {
  round: number;
  centerIndices: number[];
  visibleSymbolsByReel: VisibleReelSymbols[];
};

type VerifiedSlotResult = {
  verifiedRounds: VerifiedSlotRound[];
};

type SlotSampleResult = {
  nonce: number;
  category: string;
  rounds: SlotRound[];
};

type SlotCategoryCounts = {
  simple: number;
  bonus: number;
  retrigger: number;
};

const SLOT_RESULT_HEADING = "Final Result";

export function createSlotGame({
  name,
  selectValue,
  roundInputName,
  sampleCategoryDefaults = { bonus: 2, retrigger: 1 },
}: SlotGameConfig): Game {
  return {
    name,
    selectValue,
    roundInputName,
    sampleCategoryDefaults,
    buildSampleContexts: buildSlotSampleContexts,
    readVerifiedResult: readVerifiedSlotResult,
    parseResult: parseSlotVerificationResult,
    inputs: [],
    selects: [],
  };
}

async function buildSlotSampleContexts({
  game,
  gameSeeds,
  logger,
  samplePlan,
}: BuildSampleContextsOptions): Promise<SampleContext[]> {
  const samples = findSlotSampleResults({
    clientSeed: (gameSeeds as GameSeeds).clientSeed,
    serverSeed: (gameSeeds as GameSeeds).serverSeed,
    sampleCount: samplePlan.sampleCount,
    bonusCount: samplePlan.slotCategoryCounts!.bonusCount,
    retriggerCount: samplePlan.slotCategoryCounts!.retriggerCount,
  });
  const counts = countSlotCategories(samples);

  logger.verbose(
    `[game:${game.name}] Found slot nonces simple=${counts.simple} bonus=${counts.bonus} retrigger=${counts.retrigger}`,
  );

  return samples.map((sample, sampleIndex) =>
    buildSampleContext(
      game,
      sampleIndex,
      samplePlan.selectCombinations,
      gameSeeds,
      {
        nonce: sample.nonce,
        slotCategory: sample.category,
        slotRounds: sample.rounds,
      },
    ),
  );
}

async function readVerifiedSlotResult(
  page: Page,
  context: SampleContext,
  interactionOptions: InteractionOptions,
): Promise<VerifiedSlotResult> {
  const verifiedRounds: VerifiedSlotRound[] = [];

  for (const expectedRound of context.slotRounds ?? []) {
    await setCalculationInput(
      page,
      context.game.roundInputName!,
      expectedRound.round,
      interactionOptions,
    );
    await expandSlotResult(page, interactionOptions.settleDelayMs);

    const verifiedRound = await page.evaluate(
      (headingText: string) => {
        const heading = Array.from(document.querySelectorAll("h2")).find(
          (node) => node.textContent?.trim() === headingText,
        );
        const container = heading?.nextElementSibling;

        if (!container) {
          return null;
        }

        const rows = Array.from(container.querySelectorAll("table tr"));
        const centerIndices = Array.from(rows[0]?.querySelectorAll("td") ?? [])
          .map((cell) => cell.textContent?.trim())
          .filter(Boolean)
          .map((value) => Number.parseInt(value as string, 10));
        const reelSymbolsByReel = Array.from(
          rows[1]?.querySelectorAll("td") ?? [],
        )
          .slice(0, 5)
          .map((cell) =>
            Array.from(cell.querySelectorAll("img"))
              .map((image) => image.getAttribute("alt")?.trim())
              .filter(Boolean),
          );

        if (centerIndices.length !== 5 || reelSymbolsByReel.length !== 5) {
          return null;
        }

        const visibleSymbolsByReel = reelSymbolsByReel.map(
          (reelSymbols, reelIndex) => {
            const centerIndex = centerIndices[reelIndex];
            const reelSize = reelSymbols.length;
            const aboveIndex = (centerIndex - 1 + reelSize) % reelSize;
            const belowIndex = (centerIndex + 1) % reelSize;

            return {
              above: reelSymbols[aboveIndex],
              center: reelSymbols[centerIndex],
              below: reelSymbols[belowIndex],
              indices: {
                above: aboveIndex,
                center: centerIndex,
                below: belowIndex,
              },
            };
          },
        );

        return {
          centerIndices,
          visibleSymbolsByReel,
        };
      },
      SLOT_RESULT_HEADING,
    );

    if (!verifiedRound) {
      throw new Error(
        `Could not read slot verification data from Stake for round ${expectedRound.round}`,
      );
    }

    verifiedRounds.push({
      round: expectedRound.round,
      ...verifiedRound,
    } as VerifiedSlotRound);
  }

  return { verifiedRounds };
}

async function expandSlotResult(page: Page, settleDelayMs: number): Promise<void> {
  const didExpand = await page.evaluate((headingText: string) => {
    const heading = Array.from(document.querySelectorAll("h2")).find(
      (node) => node.textContent?.trim() === headingText,
    );
    const container = heading?.nextElementSibling;
    const button = container?.querySelector("button");

    if (
      !(button instanceof HTMLButtonElement) ||
      !/show more/i.test(button.textContent ?? "")
    ) {
      return false;
    }

    button.click();
    return true;
  }, SLOT_RESULT_HEADING);

  if (!didExpand) {
    return;
  }

  await delay(settleDelayMs);
  await page.waitForFunction(
    (headingText: string) => {
      const heading = Array.from(document.querySelectorAll("h2")).find(
        (node) => node.textContent?.trim() === headingText,
      );
      const container = heading?.nextElementSibling;
      const reelCells = Array.from(
        container?.querySelectorAll("table tr:nth-child(2) td") ?? [],
      ).slice(0, 5);

      return reelCells.every((cell) => cell.querySelectorAll("img").length > 3);
    },
    { timeout: 5_000 },
    SLOT_RESULT_HEADING,
  );
}

function delay(delayMs: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, delayMs));
}

function parseSlotVerificationResult(rawResult: unknown, context: SampleContext): unknown {
  const expectedRounds = context.slotRounds ?? [];
  const verifiedRounds = (rawResult as VerifiedSlotResult)?.verifiedRounds;

  if (!Array.isArray(verifiedRounds)) {
    throw new Error(`Slot verification expected verified rounds from Stake`);
  }

  if (verifiedRounds.length !== expectedRounds.length) {
    throw new Error(
      `Slot verification round count mismatch: expected ${expectedRounds.length}, got ${verifiedRounds.length}`,
    );
  }

  for (let index = 0; index < expectedRounds.length; index += 1) {
    const expected = expectedRounds[index];
    const verified = verifiedRounds[index];

    if (!sameNumberArray(expected.centerIndices, verified.centerIndices)) {
      throw new Error(
        `Slot verification mismatch for round ${expected.round}: expected ${expected.centerIndices.join(",")}, got ${verified.centerIndices.join(",")}`,
      );
    }

    if (
      !sameVisibleSymbolsByReel(
        expected.visibleSymbolsByReel,
        verified.visibleSymbolsByReel,
      )
    ) {
      throw new Error(
        `Slot verification visible-window mismatch for round ${expected.round}`,
      );
    }
  }

  return {
    category: context.slotCategory,
    rounds: expectedRounds,
  };
}

function countSlotCategories(samples: SlotSampleResult[]): SlotCategoryCounts {
  return samples.reduce(
    (counts, sample) => {
      counts[sample.category as keyof SlotCategoryCounts] += 1;
      return counts;
    },
    { simple: 0, bonus: 0, retrigger: 0 },
  );
}

function sameNumberArray(left: number[], right: number[]): boolean {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function sameVisibleSymbolsByReel(
  left: VisibleReelSymbols[],
  right: VisibleReelSymbols[],
): boolean {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((leftReel, index) => sameVisibleSymbols(leftReel, right[index]))
  );
}

function sameVisibleSymbols(left: VisibleReelSymbols, right: VisibleReelSymbols): boolean {
  return (
    left?.above === right?.above &&
    left?.center === right?.center &&
    left?.below === right?.below &&
    left?.indices?.above === right?.indices?.above &&
    left?.indices?.center === right?.indices?.center &&
    left?.indices?.below === right?.indices?.below
  );
}
