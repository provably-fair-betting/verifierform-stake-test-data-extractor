import probabilities from "./bluesamurai-probabilities.json" with { type: "json" };

import { createFloatGenerator } from "./floats.js";

export const BLUE_SAMURAI_CATEGORY_ORDER = [
  "ordinary",
  "bonus",
  "special-rounds",
  "bonus-with-retrigger",
  "bonus-with-special-rounds",
];

const BLUE_SAMURAI_BONUS_ROUNDS_AWARDED = 10;
const BLUE_SAMURAI_SPECIAL_ROUNDS_AWARDED = 5;
const BLUE_SAMURAI_MAX_BONUS_ROUNDS = 180;
const BLUE_SAMURAI_REGULAR_COLUMN_SIZES = [3, 4, 4, 4, 3];
const BLUE_SAMURAI_SPECIAL_COLUMN_SIZES = [4, 4, 4];
const BLUE_SAMURAI_REGULAR_SYMBOL_COUNT = 18;

const outerProbabilityTable = buildProbabilityTable("outer");
const innerProbabilityTable = buildProbabilityTable("inner");

function buildProbabilityTable(columnName) {
  let running = 0;

  return probabilities
    .filter((entry) => Number(entry[columnName]) > 0)
    .map((entry) => {
      running += Number(entry[columnName]);

      return {
        max: running,
        symbol: entry.symbol,
      };
    });
}

export function simulateBlueSamuraiRounds({ clientSeed, serverSeed, nonce }) {
  const floatGenerator = createFloatGenerator({
    clientSeed,
    serverSeed,
    nonce,
  });
  const rounds = [];
  let bonusSpin = 0;
  let remainingRounds = 1;
  let remainingSpecialRounds = 0;
  let roundIndex = 0;
  let stuckSamuraiIndices = new Set();
  let totalBonusRounds = 0;
  let completedSpecialRounds = 0;

  while (remainingRounds > 0) {
    const specialRound = remainingSpecialRounds > 0;
    const previouslyLockedIndices = new Set(stuckSamuraiIndices);
    const symbols = buildRoundSymbols({
      floatGenerator,
      specialRound,
      stuckSamuraiIndices: previouslyLockedIndices,
    });
    const scatters = symbols.filter(
      (symbol) => symbol.lookupSymbol === "scatter",
    ).length;
    const specialTrigger = !specialRound && isSpecialTriggerRound(symbols);
    const awardedBonusRounds =
      scatters >= 3
        ? Math.min(
            BLUE_SAMURAI_BONUS_ROUNDS_AWARDED,
            BLUE_SAMURAI_MAX_BONUS_ROUNDS - totalBonusRounds,
          )
        : 0;
    const retriggerType =
      awardedBonusRounds > 0 ? "bonus" : specialTrigger ? "special" : null;

    if (specialRound) {
      stuckSamuraiIndices = updateStuckSamuraiIndices(
        symbols,
        previouslyLockedIndices,
      );
    }

    const newlyLockedIndices = differenceOfSets(
      stuckSamuraiIndices,
      previouslyLockedIndices,
    );

    if (awardedBonusRounds > 0) {
      totalBonusRounds += awardedBonusRounds;
    }

    rounds.push({
      round: roundIndex,
      retrigger: Boolean(retriggerType),
      retriggerType,
      specialRound,
      specialSpin: specialRound
        ? BLUE_SAMURAI_SPECIAL_ROUNDS_AWARDED - remainingSpecialRounds + 1
        : null,
      previousSpecialSpinsCount: completedSpecialRounds,
      bonusSpin,
      totalBonusRounds,
      floatColumns: buildFloatColumns(symbols, specialRound),
      lockedSamuraiIndices: [...stuckSamuraiIndices].sort(
        (left, right) => left - right,
      ),
      newlyLockedSamuraiIndices: [...newlyLockedIndices].sort(
        (left, right) => left - right,
      ),
      symbols,
    });

    if (!specialRound) {
      bonusSpin += 1;
    } else {
      completedSpecialRounds += 1;
    }

    remainingRounds -= 1;
    remainingSpecialRounds = Math.max(remainingSpecialRounds - 1, 0);

    if (remainingSpecialRounds === 0) {
      stuckSamuraiIndices = new Set();
    }

    if (awardedBonusRounds > 0) {
      remainingRounds += awardedBonusRounds;
    } else if (specialTrigger) {
      remainingSpecialRounds += BLUE_SAMURAI_SPECIAL_ROUNDS_AWARDED;
      remainingRounds += BLUE_SAMURAI_SPECIAL_ROUNDS_AWARDED;
    }

    roundIndex += 1;
  }

  return rounds;
}

function buildRoundSymbols({
  floatGenerator,
  specialRound,
  stuckSamuraiIndices,
}) {
  const symbols = [];

  for (let index = 0; index < BLUE_SAMURAI_REGULAR_SYMBOL_COUNT; index += 1) {
    const outerReel = isOuterPosition(index);
    const reelType = outerReel ? "outer" : "inner";

    if (specialRound && outerReel) {
      symbols.push({
        index,
        reelType,
        float: null,
        lookupSymbol: "samurai",
        symbol: "samurai",
        locked: false,
      });
      continue;
    }

    const float = floatGenerator.next().value;
    const lookupSymbol = resolveBlueSamuraiSymbol(float, reelType);
    const locked = specialRound && stuckSamuraiIndices.has(index);

    symbols.push({
      index,
      reelType,
      float,
      lookupSymbol,
      symbol: locked ? "samurai" : lookupSymbol,
      locked,
    });
  }

  return symbols;
}

function resolveBlueSamuraiSymbol(float, reelType) {
  const probabilityTable =
    reelType === "outer" ? outerProbabilityTable : innerProbabilityTable;

  if (probabilityTable.length === 0) {
    throw new Error(
      `Blue Samurai probability table is empty for reel type "${reelType}"`,
    );
  }

  for (const entry of probabilityTable) {
    if (float < entry.max) {
      return entry.symbol;
    }
  }

  throw new Error(
    `Blue Samurai symbol resolution failed for float ${float} on reel type "${reelType}"`,
  );
}

function isSpecialTriggerRound(symbols) {
  const leftOuterReel = symbols.slice(0, 3);
  const rightOuterReel = symbols.slice(-3);

  return (
    leftOuterReel.every((symbol) => symbol.symbol === "samurai") ||
    rightOuterReel.every((symbol) => symbol.symbol === "samurai")
  );
}

function updateStuckSamuraiIndices(symbols, stuckSamuraiIndices) {
  const updatedIndices = new Set(stuckSamuraiIndices);

  for (const symbol of symbols) {
    if (!isOuterPosition(symbol.index) && symbol.lookupSymbol === "samurai") {
      updatedIndices.add(symbol.index);
    }
  }

  return updatedIndices;
}

function isOuterPosition(index) {
  return index < 3 || index > 14;
}

function differenceOfSets(left, right) {
  return new Set([...left].filter((value) => !right.has(value)));
}

function buildFloatColumns(symbols, specialRound) {
  const sourceSymbols = specialRound
    ? symbols.filter((symbol) => symbol.reelType === "inner")
    : symbols;
  const columnSizes = specialRound
    ? BLUE_SAMURAI_SPECIAL_COLUMN_SIZES
    : BLUE_SAMURAI_REGULAR_COLUMN_SIZES;
  const columns = [];
  let cursor = 0;

  for (const size of columnSizes) {
    columns.push(
      sourceSymbols
        .slice(cursor, cursor + size)
        .map((symbol) => symbol.float)
        .filter((value) => typeof value === "number"),
    );
    cursor += size;
  }

  return columns;
}

export function classifyBlueSamuraiRounds(rounds) {
  const hasBonusRounds = rounds.some(
    (round) => !round.specialRound && round.bonusSpin > 0,
  );
  const hasSpecialRounds = rounds.some((round) => round.specialRound);
  const bonusTriggerCount = rounds.filter(
    (round) => round.retriggerType === "bonus",
  ).length;

  if (!hasBonusRounds && !hasSpecialRounds) {
    return "ordinary";
  }

  if (!hasBonusRounds && hasSpecialRounds) {
    return "special-rounds";
  }

  if (hasBonusRounds && !hasSpecialRounds) {
    return bonusTriggerCount > 1 ? "bonus-with-retrigger" : "bonus";
  }

  if (hasBonusRounds && hasSpecialRounds && bonusTriggerCount <= 1) {
    return "bonus-with-special-rounds";
  }

  return null;
}
