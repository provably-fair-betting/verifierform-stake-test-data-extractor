import { games } from "./games/index.js";
import { runSampler } from "./run-sampler-for-games.js";

import type {
  BlueSamuraiCategoryCounts,
  Game,
  Logger,
  SeedPair,
  SlotCategoryCounts,
} from "./types.js";

type Command = {
  clientSeed: string | null;
  gameNames: string[];
  listGames: boolean;
  nonceCount: string | null;
  bonusCount: string | null;
  outputDir: string | null;
  retriggerCount: string | null;
  serverSeed: string | null;
  verbose: boolean;
  bsBonusCount: string | null;
  bsSpecialRoundsCount: string | null;
  bsBonusRetriggerCount: string | null;
  bsBonusSpecialRoundsCount: string | null;
};

main().catch(handleFatalError);

async function main(): Promise<void> {
  const command = parseCommand(process.argv.slice(2));
  const logger = createLogger(command.verbose);
  const seedPairOverride = resolveSeedPairOverride(command);
  const nonceCountOverride = resolveNonceCountOverride(command);
  const slotSampleCountOverrides = resolveSlotSampleCountOverrides(command);
  const blueSamuraiCategoryCounts = resolveBlueSamuraiCategoryCountOverrides(command);

  if (command.listGames) {
    printAvailableGames();
    return;
  }

  const gamesToRun = resolveGamesToRun(command.gameNames);

  await runSampler({
    gamesToRun,
    logger,
    nonceCountOverride,
    outputDir: command.outputDir,
    seedPairOverride,
    slotSampleCountOverrides,
    blueSamuraiCategoryCounts,
  });
}

function parseCommand(args: string[]): Command {
  const command: Command = {
    clientSeed: null,
    gameNames: [],
    listGames: false,
    nonceCount: null,
    bonusCount: null,
    outputDir: null,
    retriggerCount: null,
    serverSeed: null,
    verbose: false,
    bsBonusCount: null,
    bsSpecialRoundsCount: null,
    bsBonusRetriggerCount: null,
    bsBonusSpecialRoundsCount: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--") {
      continue;
    }

    if (argument === "--verbose" || argument === "-v") {
      command.verbose = true;
      continue;
    }

    if (argument === "--list-games") {
      command.listGames = true;
      continue;
    }

    if (argument === "--output-dir") {
      const outputDir = args[index + 1] ?? null;

      if (!outputDir) {
        throw new Error(`Missing value for "${argument}"`);
      }

      command.outputDir = outputDir;
      index += 1;
      continue;
    }

    if (argument === "--game" || argument === "-g") {
      const gameName = args[index + 1] ?? null;

      if (!gameName) {
        throw new Error(`Missing value for "${argument}"`);
      }

      command.gameNames.push(gameName);
      index += 1;
      continue;
    }

    if (argument === "--client-seed") {
      const clientSeed = args[index + 1] ?? null;

      if (!clientSeed) {
        throw new Error(`Missing value for "${argument}"`);
      }

      command.clientSeed = clientSeed;
      index += 1;
      continue;
    }

    if (argument === "--server-seed") {
      const serverSeed = args[index + 1] ?? null;

      if (!serverSeed) {
        throw new Error(`Missing value for "${argument}"`);
      }

      command.serverSeed = serverSeed;
      index += 1;
      continue;
    }

    if (argument === "--nonce-count") {
      const nonceCount = args[index + 1] ?? null;

      if (!nonceCount) {
        throw new Error(`Missing value for "${argument}"`);
      }

      command.nonceCount = nonceCount;
      index += 1;
      continue;
    }

    if (argument === "--bonus-count") {
      const bonusCount = args[index + 1] ?? null;

      if (!bonusCount) {
        throw new Error(`Missing value for "${argument}"`);
      }

      command.bonusCount = bonusCount;
      index += 1;
      continue;
    }

    if (argument === "--retrigger-count") {
      const retriggerCount = args[index + 1] ?? null;

      if (!retriggerCount) {
        throw new Error(`Missing value for "${argument}"`);
      }

      command.retriggerCount = retriggerCount;
      index += 1;
      continue;
    }

    if (argument === "--blue-samurai-bonus-count") {
      const value = args[index + 1] ?? null;
      if (!value) throw new Error(`Missing value for "${argument}"`);
      command.bsBonusCount = value;
      index += 1;
      continue;
    }

    if (argument === "--blue-samurai-special-rounds-count") {
      const value = args[index + 1] ?? null;
      if (!value) throw new Error(`Missing value for "${argument}"`);
      command.bsSpecialRoundsCount = value;
      index += 1;
      continue;
    }

    if (argument === "--blue-samurai-bonus-retrigger-count") {
      const value = args[index + 1] ?? null;
      if (!value) throw new Error(`Missing value for "${argument}"`);
      command.bsBonusRetriggerCount = value;
      index += 1;
      continue;
    }

    if (argument === "--blue-samurai-bonus-special-rounds-count") {
      const value = args[index + 1] ?? null;
      if (!value) throw new Error(`Missing value for "${argument}"`);
      command.bsBonusSpecialRoundsCount = value;
      index += 1;
      continue;
    }

    if (!argument.startsWith("-")) {
      command.gameNames.push(argument);
      continue;
    }

    throw new Error(`Unknown argument "${argument}"`);
  }

  return command;
}

function resolveSeedPairOverride(command: Command): SeedPair | null {
  const hasClientSeed = Boolean(command.clientSeed);
  const hasServerSeed = Boolean(command.serverSeed);

  if (!hasClientSeed && !hasServerSeed) {
    return null;
  }

  if (!hasClientSeed || !hasServerSeed) {
    throw new Error(
      `--client-seed and --server-seed must be provided together`,
    );
  }

  return {
    clientSeed: command.clientSeed!,
    serverSeed: command.serverSeed!,
  };
}

function resolveNonceCountOverride(command: Command): number | null {
  if (command.nonceCount === null) {
    return null;
  }

  const nonceCount = Number(command.nonceCount);

  if (!Number.isInteger(nonceCount) || nonceCount <= 0) {
    throw new Error(`--nonce-count must be a positive integer`);
  }

  return nonceCount;
}

function resolveSlotSampleCountOverrides(command: Command): SlotCategoryCounts | null {
  const bonusCount = resolveNonNegativeIntegerFlag(
    command.bonusCount,
    "--bonus-count",
  );
  const retriggerCount = resolveNonNegativeIntegerFlag(
    command.retriggerCount,
    "--retrigger-count",
  );

  if (bonusCount === null && retriggerCount === null) {
    return null;
  }

  return {
    bonusCount: bonusCount ?? 0,
    retriggerCount: retriggerCount ?? 0,
  };
}

function resolveBlueSamuraiCategoryCountOverrides(
  command: Command,
): BlueSamuraiCategoryCounts | null {
  const bonus = resolveNonNegativeIntegerFlag(
    command.bsBonusCount,
    "--blue-samurai-bonus-count",
  );
  const specialRounds = resolveNonNegativeIntegerFlag(
    command.bsSpecialRoundsCount,
    "--blue-samurai-special-rounds-count",
  );
  const bonusWithRetrigger = resolveNonNegativeIntegerFlag(
    command.bsBonusRetriggerCount,
    "--blue-samurai-bonus-retrigger-count",
  );
  const bonusWithSpecialRounds = resolveNonNegativeIntegerFlag(
    command.bsBonusSpecialRoundsCount,
    "--blue-samurai-bonus-special-rounds-count",
  );

  if (
    bonus === null &&
    specialRounds === null &&
    bonusWithRetrigger === null &&
    bonusWithSpecialRounds === null
  ) {
    return null;
  }

  return { bonus, specialRounds, bonusWithRetrigger, bonusWithSpecialRounds };
}

function resolveNonNegativeIntegerFlag(
  value: string | null,
  flagName: string,
): number | null {
  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${flagName} must be a non-negative integer`);
  }

  return parsedValue;
}

function createLogger(verboseEnabled: boolean): Logger {
  return {
    verboseEnabled,
    info(message: string) {
      console.log(message);
    },
    verbose(message: string) {
      if (verboseEnabled) {
        console.log(message);
      }
    },
    error(error: unknown) {
      console.error(error);
    },
  };
}

function resolveGamesToRun(gameNames: string[]): Game[] {
  if (!Array.isArray(gameNames) || gameNames.length === 0) {
    return games;
  }

  const uniqueGameNames = [...new Set(gameNames)];

  return uniqueGameNames.map(resolveGameByName);
}

function resolveGameByName(gameName: string): Game {
  const matchingGame = games.find((game) => game.name === gameName);

  if (!matchingGame) {
    throw new Error(
      `Unknown game "${gameName}". Run --list-games to see available games.`,
    );
  }

  return matchingGame;
}

function printAvailableGames(): void {
  console.log(`Available games:`);

  for (const game of games) {
    console.log(`- ${game.name}`);
  }
}

function handleFatalError(error: unknown): void {
  printErrorChain(error);
  process.exitCode = 1;
}

function printErrorChain(error: unknown): void {
  let currentError: unknown = error;
  let depth = 0;

  while (currentError instanceof Error) {
    const prefix = depth === 0 ? "" : `Caused by (${depth}): `;

    console.error(`${prefix}${currentError.stack ?? currentError.message}`);
    currentError = (currentError as Error & { cause: unknown }).cause;
    depth += 1;
  }

  if (currentError) {
    console.error(currentError);
  }
}
