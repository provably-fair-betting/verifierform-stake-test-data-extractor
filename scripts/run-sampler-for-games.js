import { join } from "node:path";

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

const RESERVED_SAMPLE_KEYS = new Set([
  "clientSeed",
  "serverSeed",
  "nonce",
  "inputs",
  "selects",
]);

const interactionOptions = {
  timeoutMs: generatorConfig.waitTimeoutMs,
  updateDelayMs: generatorConfig.formDelayMs,
  settleDelayMs: generatorConfig.formDelayMs,
};

const silentLogger = {
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
  seedPairOverride = null,
  slotSampleCountOverrides = null,
} = {}) {
  ensureConfigLooksReady();
  assertGamesToRun(gamesToRun);
  logSamplerStart(logger, gamesToRun);

  const runOutputDirectory = buildRunOutputDirectory();

  const { browser, page } = await connectBrowser();

  try {
    const calculationPage = await openCalculationPage(browser, page, logger, {
      url: generatorConfig.url,
      waitTimeoutMs: generatorConfig.waitTimeoutMs,
      waitIntervalMs: generatorConfig.waitIntervalMs,
    });
    const runContext = {
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

function ensureConfigLooksReady() {
  if (generatorConfig.url.includes("YOUR-CALCULATION-PAGE-HERE")) {
    throw new Error(`Replace generatorConfig.url before running the generator`);
  }
}

function assertGamesToRun(gamesToRun) {
  if (!Array.isArray(gamesToRun) || gamesToRun.length === 0) {
    throw new Error(`No games selected to generate samples for`);
  }
}

function logSamplerStart(logger, gamesToRun) {
  logger.info(
    `[sampler] Starting run for ${gamesToRun.length} game(s): ${gamesToRun.map((game) => game.name).join(", ")}`,
  );
  logger.verbose(`[sampler] Output directory: ${generatorConfig.outputDir}`);
}

function buildRunOutputDirectory() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return join(generatorConfig.outputDir, timestamp);
}

async function writeSamplesForAllGames(runContext, gamesToRun) {
  for (const game of gamesToRun) {
    await writeSamplesForGame(runContext, game);
  }
}

async function writeSamplesForGame(runContext, game) {
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
  game,
  nonceCountOverride,
  slotSampleCountOverrides,
) {
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

async function generateGameSamples(runContext, game, samplePlan) {
  const { logger, page, seedPairOverride } = runContext;
  const samples = [];
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
  runContext,
  game,
  samplePlan,
  gameSeeds,
) {
  if (typeof game.buildSampleContexts === "function") {
    return game.buildSampleContexts({
      game,
      gameSeeds,
      logger: runContext.logger,
      samplePlan,
      runContext,
    });
  }

  return buildDefaultSampleContexts(game, samplePlan, gameSeeds);
}

function buildDefaultSampleContexts(game, samplePlan, gameSeeds) {
  return Array.from({ length: samplePlan.sampleCount }, (_, sampleIndex) =>
    buildSampleContext(
      game,
      sampleIndex,
      samplePlan.selectCombinations,
      gameSeeds,
    ),
  );
}

async function applyStableSharedFields(page, game, gameSeeds) {
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

function logSampleProgress(logger, game, context, sampleCount) {
  const nonceDescription =
    game.usesNonce !== false ? ` nonce=${context.nonce}` : "";
  const selectDescription = formatSelectValues(context.selectValues);

  logger.verbose(
    `[game:${game.name}] Sample ${context.sampleIndex + 1}/${sampleCount}${nonceDescription}${selectDescription}`,
  );
}

async function generateSingleSample(runContext, game, context) {
  const { logger, page } = runContext;

  if (game.usesNonce !== false) {
    logger.verbose(`[game:${game.name}] Applying nonce`);
    await applyNonceField(page, context.nonce);
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

async function applyNonceField(page, nonce) {
  // Explicitly write nonce 0 before the initial wait because the page may display 0 without committing it internally.
  await setCalculationInput(page, "nonce", nonce, interactionOptions);
}

async function applyGameInputs(page, game, context) {
  const appliedInputs = {};

  for (const input of game.inputs ?? []) {
    const value = await resolveConfigValue(input.value, context);

    await setCalculationInput(page, input.name, value, interactionOptions);
    appliedInputs[input.name] = value;
  }

  return appliedInputs;
}

async function applyGameSelects(page, selectValues) {
  const appliedSelects = {};

  for (const [name, value] of Object.entries(selectValues)) {
    await setCalculationSelect(page, name, value, interactionOptions);
    appliedSelects[name] = value;
  }

  return appliedSelects;
}

async function readRawResult(page, game, context) {
  if (typeof game.readVerifiedResult === "function") {
    return game.readVerifiedResult(page, context, interactionOptions);
  }

  await sleep(interactionOptions.settleDelayMs);

  const rawResult = await game.resultStrategy.read(page);

  if (rawResult == null) {
    const resultLabel = game.resultStrategy.label ?? "result";

    throw new Error(`Could not read ${resultLabel} after applying inputs`);
  }

  return rawResult;
}

function buildSample({ context, inputs, selects, parsedResult }) {
  return {
    ...buildSampleMetadata(context),
    inputs,
    selects,
    ...normalizeParsedResult(parsedResult),
  };
}

function normalizeParsedResult(parsedResult) {
  if (
    parsedResult &&
    typeof parsedResult === "object" &&
    !Array.isArray(parsedResult)
  ) {
    assertNoReservedSampleKeys(parsedResult);
    return parsedResult;
  }

  return { result: parsedResult };
}

function assertNoReservedSampleKeys(parsedResult) {
  for (const reservedKey of RESERVED_SAMPLE_KEYS) {
    if (reservedKey in parsedResult) {
      throw new Error(
        `Parsed result may not define reserved sample key "${reservedKey}"`,
      );
    }
  }
}

function buildSampleGenerationError(game, context, sampleIndex, error) {
  const message =
    `[game:${game.name}] Failed at sample ${sampleIndex + 1} ` +
    `(nonce=${context.nonce}${formatSelectValues(context.selectValues)})`;

  const wrappedError = new Error(message);
  wrappedError.cause = error;

  return wrappedError;
}

function buildOutputPath(runOutputDirectory, game) {
  return join(runOutputDirectory, `${game.name}.json`);
}
