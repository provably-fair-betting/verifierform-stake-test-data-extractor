import { games } from "./games/index.js";
import { runSampler } from "./run-sampler-for-games.js";

main().catch(handleFatalError);

async function main() {
  const command = parseCommand(process.argv.slice(2));
  const logger = createLogger(command.verbose);
  const seedPairOverride = resolveSeedPairOverride(command);
  const nonceCountOverride = resolveNonceCountOverride(command);
  const slotSampleCountOverrides = resolveSlotSampleCountOverrides(command);

  if (command.listGames) {
    printAvailableGames();
    return;
  }

  const gamesToRun = resolveGamesToRun(command.gameNames);

  await runSampler({
    gamesToRun,
    logger,
    nonceCountOverride,
    seedPairOverride,
    slotSampleCountOverrides,
  });
}

function parseCommand(args) {
  const command = {
    clientSeed: null,
    gameNames: [],
    listGames: false,
    nonceCount: null,
    bonusCount: null,
    retriggerCount: null,
    serverSeed: null,
    verbose: false,
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

    if (!argument.startsWith("-")) {
      command.gameNames.push(argument);
      continue;
    }

    throw new Error(`Unknown argument "${argument}"`);
  }

  return command;
}

function resolveSeedPairOverride(command) {
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
    clientSeed: command.clientSeed,
    serverSeed: command.serverSeed,
  };
}

function resolveNonceCountOverride(command) {
  if (command.nonceCount === null) {
    return null;
  }

  const nonceCount = Number(command.nonceCount);

  if (!Number.isInteger(nonceCount) || nonceCount <= 0) {
    throw new Error(`--nonce-count must be a positive integer`);
  }

  return nonceCount;
}

function resolveSlotSampleCountOverrides(command) {
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
    bonusCount,
    retriggerCount,
  };
}

function resolveNonNegativeIntegerFlag(value, flagName) {
  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${flagName} must be a non-negative integer`);
  }

  return parsedValue;
}

function createLogger(verboseEnabled) {
  return {
    verboseEnabled,
    info(message) {
      console.log(message);
    },
    verbose(message) {
      if (verboseEnabled) {
        console.log(message);
      }
    },
    error(error) {
      console.error(error);
    },
  };
}

function resolveGamesToRun(gameNames) {
  if (!Array.isArray(gameNames) || gameNames.length === 0) {
    return games;
  }

  const uniqueGameNames = [...new Set(gameNames)];

  return uniqueGameNames.map(resolveGameByName);
}

function resolveGameByName(gameName) {
  const matchingGame = games.find((game) => game.name === gameName);

  if (!matchingGame) {
    throw new Error(
      `Unknown game "${gameName}". Run --list-games to see available games.`,
    );
  }

  return matchingGame;
}

function printAvailableGames() {
  console.log(`Available games:`);

  for (const game of games) {
    console.log(`- ${game.name}`);
  }
}

function handleFatalError(error) {
  printErrorChain(error);
  process.exitCode = 1;
}

function printErrorChain(error) {
  let currentError = error;
  let depth = 0;

  while (currentError instanceof Error) {
    const prefix = depth === 0 ? "" : `Caused by (${depth}): `;

    console.error(`${prefix}${currentError.stack ?? currentError.message}`);
    currentError = currentError.cause;
    depth += 1;
  }

  if (currentError) {
    console.error(currentError);
  }
}
