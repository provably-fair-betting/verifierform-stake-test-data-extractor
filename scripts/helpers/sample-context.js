import { randomBytes } from "node:crypto";

export function createGameSeeds(game, seedPairOverride) {
  if (game.useDefaultSeedPair === false) {
    return null;
  }

  if (seedPairOverride) {
    return {
      ...seedPairOverride,
      source: "cli",
    };
  }

  return {
    clientSeed: createRandomSeed(),
    serverSeed: createRandomSeed(),
    source: "random",
  };
}

export function describeGameSeedChoice(game, gameSeeds) {
  if (!gameSeeds) {
    return `[game:${game.name}] Skipping default client/server seeds for this game`;
  }

  if (gameSeeds.source === "cli") {
    return (
      `[game:${game.name}] Using CLI seeds ` +
      `client=${gameSeeds.clientSeed} server=${gameSeeds.serverSeed}`
    );
  }

  return (
    `[game:${game.name}] Using random seeds ` +
    `client=${gameSeeds.clientSeed} server=${gameSeeds.serverSeed}`
  );
}

export function buildSampleContext(
  game,
  sampleIndex,
  selectCombinations,
  gameSeeds,
  overrides = {},
) {
  const nonce = Object.hasOwn(overrides, "nonce")
    ? overrides.nonce
    : game.usesNonce !== false
      ? sampleIndex
      : undefined;
  const selectValues =
    overrides.selectValues ??
    selectCombinations[sampleIndex % selectCombinations.length] ??
    {};

  return {
    game,
    nonce,
    sampleIndex,
    selectValues,
    clientSeed: gameSeeds?.clientSeed,
    serverSeed: gameSeeds?.serverSeed,
    ...overrides,
  };
}

export function buildSampleMetadata(context) {
  const sampleMetadata = {};

  if (context.game.useDefaultSeedPair !== false) {
    sampleMetadata.clientSeed = context.clientSeed;
    sampleMetadata.serverSeed = context.serverSeed;
  }

  if (context.game.usesNonce !== false) {
    sampleMetadata.nonce = context.nonce;
  }

  return sampleMetadata;
}

export function formatSelectValues(selectValues) {
  const entries = Object.entries(selectValues);

  if (entries.length === 0) {
    return "";
  }

  const formattedEntries = entries
    .map(([name, value]) => `${name}=${value}`)
    .join(", ");

  return ` selects={${formattedEntries}}`;
}

function createRandomSeed() {
  return randomBytes(16).toString("hex");
}
