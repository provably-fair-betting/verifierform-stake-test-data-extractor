import slotReels from "./slot-reels.json" with { type: "json" };

import { createFloatGenerator } from "./floats.js";

const SLOT_REEL_SIZES = [30, 30, 30, 30, 41];
const SCATTER_SYMBOL = "scatter";
const MAX_SLOT_ROUNDS = 180;
const BONUS_SPINS_AWARDED = 15;
const DEFAULT_SLOT_SCAN_LIMIT = 250_000;

export function findSlotSampleResults({
  clientSeed,
  serverSeed,
  sampleCount,
  bonusCount,
  retriggerCount,
  scanLimit = DEFAULT_SLOT_SCAN_LIMIT,
}) {
  assertSlotSampleTargets({ sampleCount, bonusCount, retriggerCount });

  const targets = {
    simple: sampleCount - bonusCount,
    bonus: bonusCount - retriggerCount,
    retrigger: retriggerCount,
  };
  const buckets = {
    simple: [],
    bonus: [],
    retrigger: [],
  };

  for (let nonce = 0; nonce < scanLimit; nonce += 1) {
    const result = classifySlotSpin({ clientSeed, serverSeed, nonce });

    if (buckets[result.type].length >= targets[result.type]) {
      if (hasCollectedAllTargets(buckets, targets)) {
        break;
      }

      continue;
    }

    buckets[result.type].push({
      nonce,
      category: result.type,
      rounds: result.rounds,
    });

    if (hasCollectedAllTargets(buckets, targets)) {
      break;
    }
  }

  if (!hasCollectedAllTargets(buckets, targets)) {
    throw new Error(
      `Could not find enough slot samples within ${scanLimit} nonces ` +
        `(simple=${targets.simple}, bonus=${targets.bonus}, retrigger=${targets.retrigger})`,
    );
  }

  return [...buckets.simple, ...buckets.bonus, ...buckets.retrigger].sort(
    (left, right) => left.nonce - right.nonce,
  );
}

function assertSlotSampleTargets({ sampleCount, bonusCount, retriggerCount }) {
  if (!Number.isInteger(sampleCount) || sampleCount <= 0) {
    throw new Error(`Slot sampleCount must be a positive integer`);
  }

  if (!Number.isInteger(bonusCount) || bonusCount < 0) {
    throw new Error(`Slot bonusCount must be a non-negative integer`);
  }

  if (!Number.isInteger(retriggerCount) || retriggerCount < 0) {
    throw new Error(`Slot retriggerCount must be a non-negative integer`);
  }

  if (bonusCount > sampleCount) {
    throw new Error(
      `Slot bonusCount (${bonusCount}) cannot exceed sampleCount (${sampleCount})`,
    );
  }

  if (retriggerCount > bonusCount) {
    throw new Error(
      `Slot retriggerCount (${retriggerCount}) cannot exceed bonusCount (${bonusCount})`,
    );
  }
}

export function classifySlotSpin(seed) {
  const rounds = simulateSlotRounds(seed);
  const baseRound = rounds[0];

  if (!baseRound) {
    throw new Error(`Slot simulation expected at least one round`);
  }

  if (!baseRound.triggersBonus) {
    return {
      rounds,
      type: "simple",
    };
  }

  const hasRetrigger = rounds.slice(1).some((round) => round.triggersBonus);

  return {
    rounds,
    type: hasRetrigger ? "retrigger" : "bonus",
  };
}

export function simulateSlotRounds({ clientSeed, serverSeed, nonce }) {
  const floatGenerator = createFloatGenerator({
    clientSeed,
    serverSeed,
    nonce,
  });
  const rounds = [];
  let pendingRounds = 1;
  let totalRounds = 1;

  while (pendingRounds > 0 && rounds.length < MAX_SLOT_ROUNDS) {
    const centerIndices = SLOT_REEL_SIZES.map((reelSize) =>
      Math.floor(floatGenerator.next().value * reelSize),
    );
    const visibleSymbolsByReel = centerIndices.map((centerIndex, reelIndex) =>
      buildVisibleReelSymbols(reelIndex, centerIndex),
    );
    const scatterCount = countScatterSymbols(visibleSymbolsByReel);
    const triggersBonus = scatterCount >= 3;

    pendingRounds -= 1;

    if (triggersBonus) {
      pendingRounds += BONUS_SPINS_AWARDED;
      totalRounds = Math.min(
        totalRounds + BONUS_SPINS_AWARDED,
        MAX_SLOT_ROUNDS,
      );
    }

    rounds.push({
      round: rounds.length,
      centerIndices,
      visibleSymbolsByReel,
      scatterCount,
      triggersBonus,
      totalRounds,
    });
  }

  return rounds;
}

export function buildVisibleReelSymbols(reelIndex, centerIndex) {
  const reel = slotReels[reelIndex];
  const reelSize = SLOT_REEL_SIZES[reelIndex];

  if (!Array.isArray(reel) || reel.length !== reelSize) {
    throw new Error(
      `Slot reel ${reelIndex} expected ${reelSize} symbols, got ${reel?.length ?? 0}`,
    );
  }

  const aboveIndex = (centerIndex - 1 + reelSize) % reelSize;
  const belowIndex = (centerIndex + 1) % reelSize;

  return {
    above: reel[aboveIndex],
    center: reel[centerIndex],
    below: reel[belowIndex],
    indices: {
      above: aboveIndex,
      center: centerIndex,
      below: belowIndex,
    },
  };
}

function countScatterSymbols(visibleSymbolsByReel) {
  return visibleSymbolsByReel.reduce((count, reel) => {
    return (
      count + [reel.above, reel.center, reel.below].filter(isScatter).length
    );
  }, 0);
}

function isScatter(symbol) {
  return symbol === SCATTER_SYMBOL;
}

function hasCollectedAllTargets(buckets, targets) {
  return Object.entries(targets).every(
    ([key, targetCount]) => buckets[key].length >= targetCount,
  );
}
