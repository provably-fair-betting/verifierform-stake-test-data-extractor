import { join, resolve } from "node:path";

import { connectBrowser } from "./browser/connect-browser.js";
import { generatorConfig } from "./config/generator-config.js";
import { games } from "./games/index.js";
import { openCalculationPage } from "./helpers/calculation-page.js";
import {
  buildSelectValueCombinations,
  getEffectiveSampleCount,
  resolveConfigValue,
  resolveSlotCategoryCounts,
} from "./helpers/sample-planning.js";
import {
  buildSampleContext,
  buildSampleMetadata,
  createGameSeeds,
  describeGameSeedChoice,
  formatSelectValues,
} from "./helpers/sample-context.js";
import { setCalculationInput, setCalculationSelect } from "./helpers/form.js";
import { writeJson } from "./helpers/output.js";
import { sleep } from "./helpers/wait.js";

import type { Page } from "rebrowser-puppeteer-core";

import type {
  Game,
  InteractionOptions,
  Logger,
  RunContext,
  SampleContext,
  SeedPair,
  SelectValues,
  SlotCategoryCounts,
} from "./types.js";

type SamplerOptions = {
  gamesToRun?: Game[];
  logger?: Logger;
  nonceCountOverride?: number | null;
  outputDir?: string | null;
  seedPairOverride?: SeedPair | null;
  slotSampleCountOverrides?: SlotCategoryCounts | null;
};

type SamplePlanInternal = {
  selectCombinations: SelectValues[];
  sampleCount: number;
  slotCategoryCounts: SlotCategoryCounts | null;
};

const RESERVED_SAMPLE_KEYS = new Set([
  "clientSeed",
  "serverSeed",
  "nonce",
  "inputs",
  "selects",
]);

const interactionOptions: InteractionOptions = {
  timeoutMs: generatorConfig.waitTimeoutMs,
  updateDelayMs: generatorConfig.formDelayMs,
  settleDelayMs: generatorConfig.formDelayMs,
};

const silentLogger: Logger = {
  verboseEnabled: false,
  info() {},
  verbose() {},
  error(error) {
    console.error(error);
  },
};

export async function runSampler({
  gamesToRun = games,
  logger = silentLogger,
  nonceCountOverride = null,
  outputDir = null,
  seedPairOverride = null,
  slotSampleCountOverrides = null,
}: SamplerOptions = {}): Promise<void> {
  ensureConfigLooksReady();
  assertGamesToRun(gamesToRun);
  logSamplerStart(logger, gamesToRun);

  const runOutputDirectory = buildRunOutputDirectory(outputDir);

  const { browser, page } = await connectBrowser();

  try {
    const calculationPage = await openCalculationPage(browser, page, logger, {
      url: generatorConfig.url,
      waitTimeoutMs: generatorConfig.waitTimeoutMs,
      waitIntervalMs: generatorConfig.waitIntervalMs,
    });
    const runContext: RunContext = {
      logger,
      nonceCountOverride,
      page: calculationPage,
      runOutputDirectory,
      seedPairOverride,
      slotSampleCountOverrides,
    };

    await writeSamplesForAllGames(runContext, gamesToRun);
    logger.info(`[sampler] Completed all requested games`);
  } finally {
    logger.verbose(`[sampler] Closing browser`);
    await browser.close();
  }
}

function ensureConfigLooksReady(): void {
  if (generatorConfig.url.includes("YOUR-CALCULATION-PAGE-HERE")) {
    throw new Error(`Replace generatorConfig.url before running the generator`);
  }
}

function assertGamesToRun(gamesToRun: Game[]): void {
  if (!Array.isArray(gamesToRun) || gamesToRun.length === 0) {
    throw new Error(`No games selected to generate samples for`);
  }
}

function logSamplerStart(logger: Logger, gamesToRun: Game[]): void {
  logger.info(
    `[sampler] Starting run for ${gamesToRun.length} game(s): ${gamesToRun.map((game) => game.name).join(", ")}`,
  );
  logger.verbose(`[sampler] Output directory: ${generatorConfig.outputDir}`);
}

function buildRunOutputDirectory(outputDir: string | null): string {
  if (outputDir !== null) {
    return resolve(outputDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return join(generatorConfig.outputDir, timestamp);
}

async function writeSamplesForAllGames(
  runContext: RunContext,
  gamesToRun: Game[],
): Promise<void> {
  for (const game of gamesToRun) {
    await writeSamplesForGame(runContext, game);
  }
}

async function writeSamplesForGame(runContext: RunContext, game: Game): Promise<void> {
  const {
    logger,
    nonceCountOverride,
    runOutputDirectory,
    slotSampleCountOverrides,
  } = runContext;
  const samplePlan = buildGameSamplePlan(
    game,
    nonceCountOverride,
    slotSampleCountOverrides,
  );

  logger.info(
    `[game:${game.name}] Starting ${samplePlan.sampleCount} samples across ${samplePlan.selectCombinations.length} select combination(s)`,
  );

  const samples = await generateGameSamples(runContext, game, samplePlan);
  const outputPath = buildOutputPath(runOutputDirectory, game);

  await writeJson(outputPath, samples);
  logger.info(
    `[game:${game.name}] Wrote ${samples.length} samples to ${outputPath}`,
  );
}

function buildGameSamplePlan(
  game: Game,
  nonceCountOverride: number | null,
  slotSampleCountOverrides: SlotCategoryCounts | null,
): SamplePlanInternal {
  const selectCombinations = buildSelectValueCombinations(game.selects ?? []);
  const sampleCount = getEffectiveSampleCount(
    game,
    nonceCountOverride ?? generatorConfig.defaultNonceCount,
    selectCombinations,
  );
  const slotCategoryCounts = resolveSlotCategoryCounts(
    game,
    sampleCount,
    slotSampleCountOverrides,
  );

  return {
    selectCombinations,
    sampleCount,
    slotCategoryCounts,
  };
}

async function generateGameSamples(
  runContext: RunContext,
  game: Game,
  samplePlan: SamplePlanInternal,
): Promise<Record<string, unknown>[]> {
  const { logger, page, seedPairOverride } = runContext;
  const samples: Record<string, unknown>[] = [];
  const gameSeeds = createGameSeeds(game, seedPairOverride);
  const sampleContexts = await buildSampleContextsForGame(
    runContext,
    game,
    samplePlan,
    gameSeeds,
  );

  logger.verbose(describeGameSeedChoice(game, gameSeeds));
  logger.verbose(`[game:${game.name}] Applying stable shared fields`);
  await applyStableSharedFields(page, game, gameSeeds);

  for (const context of sampleContexts) {
    const sampleIndex = context.sampleIndex;

    logSampleProgress(logger, game, context, samplePlan.sampleCount);

    try {
      const sample = await generateSingleSample(runContext, game, context);

      samples.push(
        buildSample({
          context,
          ...sample,
        }),
      );
    } catch (error) {
      throw buildSampleGenerationError(game, context, sampleIndex, error);
    }
  }

  return samples;
}

async function buildSampleContextsForGame(
  runContext: RunContext,
  game: Game,
  samplePlan: SamplePlanInternal,
  gameSeeds: ReturnType<typeof createGameSeeds>,
): Promise<SampleContext[]> {
  if (typeof game.buildSampleContexts === "function") {
    return game.buildSampleContexts({
      game,
      gameSeeds: gameSeeds!,
      logger: runContext.logger,
      samplePlan,
      runContext,
    });
  }

  return buildDefaultSampleContexts(game, samplePlan, gameSeeds);
}

function buildDefaultSampleContexts(
  game: Game,
  samplePlan: SamplePlanInternal,
  gameSeeds: ReturnType<typeof createGameSeeds>,
): SampleContext[] {
  return Array.from({ length: samplePlan.sampleCount }, (_, sampleIndex) =>
    buildSampleContext(
      game,
      sampleIndex,
      samplePlan.selectCombinations,
      gameSeeds,
    ),
  );
}

async function applyStableSharedFields(
  page: Page,
  game: Game,
  gameSeeds: ReturnType<typeof createGameSeeds>,
): Promise<void> {
  await setCalculationSelect(
    page,
    "game",
    game.selectValue,
    interactionOptions,
  );

  if (!gameSeeds) {
    return;
  }

  await setCalculationInput(
    page,
    "clientSeed",
    gameSeeds.clientSeed,
    interactionOptions,
  );
  await setCalculationInput(
    page,
    "serverSeed",
    gameSeeds.serverSeed,
    interactionOptions,
  );
}

function logSampleProgress(
  logger: Logger,
  game: Game,
  context: SampleContext,
  sampleCount: number,
): void {
  const nonceDescription =
    game.usesNonce !== false ? ` nonce=${context.nonce}` : "";
  const selectDescription = formatSelectValues(context.selectValues);

  logger.verbose(
    `[game:${game.name}] Sample ${context.sampleIndex + 1}/${sampleCount}${nonceDescription}${selectDescription}`,
  );
}

async function generateSingleSample(
  runContext: RunContext,
  game: Game,
  context: SampleContext,
): Promise<{
  inputs: Record<string, string>;
  selects: Record<string, string>;
  parsedResult: unknown;
}> {
  const { logger, page } = runContext;

  if (game.usesNonce !== false) {
    logger.verbose(`[game:${game.name}] Applying nonce`);
    await applyNonceField(page, context.nonce!);
  }

  logger.verbose(`[game:${game.name}] Applying game inputs`);
  const inputs = await applyGameInputs(page, game, context);
  logger.verbose(`[game:${game.name}] Applying game selects`);
  const selects = await applyGameSelects(page, context.selectValues);
  logger.verbose(`[game:${game.name}] Reading result`);
  const rawResult = await readRawResult(page, game, context);
  logger.verbose(`[game:${game.name}] Parsing result`);

  return {
    inputs,
    selects,
    parsedResult: game.parseResult(rawResult, context),
  };
}

async function applyNonceField(page: Page, nonce: number): Promise<void> {
  // Explicitly write nonce 0 before the initial wait because the page may display 0 without committing it internally.
  await setCalculationInput(page, "nonce", nonce, interactionOptions);
}

async function applyGameInputs(
  page: Page,
  game: Game,
  context: SampleContext,
): Promise<Record<string, string>> {
  const appliedInputs: Record<string, string> = {};

  for (const input of game.inputs ?? []) {
    const value = await resolveConfigValue(input.value, context);

    await setCalculationInput(page, input.name, value, interactionOptions);
    appliedInputs[input.name] = value;
  }

  return appliedInputs;
}

async function applyGameSelects(
  page: Page,
  selectValues: SelectValues,
): Promise<Record<string, string>> {
  const appliedSelects: Record<string, string> = {};

  for (const [name, value] of Object.entries(selectValues)) {
    await setCalculationSelect(page, name, value, interactionOptions);
    appliedSelects[name] = value;
  }

  return appliedSelects;
}

async function readRawResult(page: Page, game: Game, context: SampleContext): Promise<unknown> {
  if (typeof game.readVerifiedResult === "function") {
    return game.readVerifiedResult(page, context, interactionOptions);
  }

  await sleep(interactionOptions.settleDelayMs);

  const rawResult = await game.resultStrategy!.read(page);

  if (rawResult == null) {
    const resultLabel = game.resultStrategy!.label ?? "result";

    throw new Error(`Could not read ${resultLabel} after applying inputs`);
  }

  return rawResult;
}

function buildSample({
  context,
  inputs,
  selects,
  parsedResult,
}: {
  context: SampleContext;
  inputs: Record<string, string>;
  selects: Record<string, string>;
  parsedResult: unknown;
}): Record<string, unknown> {
  return {
    ...buildSampleMetadata(context),
    inputs,
    selects,
    ...normalizeParsedResult(parsedResult),
  };
}

function normalizeParsedResult(parsedResult: unknown): Record<string, unknown> {
  if (
    parsedResult &&
    typeof parsedResult === "object" &&
    !Array.isArray(parsedResult)
  ) {
    assertNoReservedSampleKeys(parsedResult as Record<string, unknown>);
    return parsedResult as Record<string, unknown>;
  }

  return { result: parsedResult };
}

function assertNoReservedSampleKeys(parsedResult: Record<string, unknown>): void {
  for (const reservedKey of RESERVED_SAMPLE_KEYS) {
    if (reservedKey in parsedResult) {
      throw new Error(
        `Parsed result may not define reserved sample key "${reservedKey}"`,
      );
    }
  }
}

function buildSampleGenerationError(
  game: Game,
  context: SampleContext,
  sampleIndex: number,
  error: unknown,
): Error {
  const message =
    `[game:${game.name}] Failed at sample ${sampleIndex + 1} ` +
    `(nonce=${context.nonce}${formatSelectValues(context.selectValues)})`;

  const wrappedError = new Error(message);
  (wrappedError as Error & { cause: unknown }).cause = error;

  return wrappedError;
}

function buildOutputPath(runOutputDirectory: string, game: Game): string {
  return join(runOutputDirectory, `${game.name}.json`);
}
