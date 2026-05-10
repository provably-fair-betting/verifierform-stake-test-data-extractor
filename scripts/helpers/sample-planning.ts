import type { Game, SampleContext, SelectConfig, SelectValues, SlotCategoryCounts } from "../types.js";

export const resolveConfigValue = async (
  value: string | ((context: SampleContext) => string | Promise<string>),
  context: SampleContext,
): Promise<string> => (typeof value === "function" ? await value(context) : value);

/**
 * Builds a deterministic cartesian product of game-specific select values.
 *
 * Breakdown rules:
 * - No selects returns a single empty combination: `[{}]`
 * - One select returns one combination per declared value
 * - Multiple selects expand left-to-right in the order they are declared
 *
 * Example:
 * `[{ name: "difficulty", values: ["easy", "hard"] }, { name: "mode", values: ["manual", "auto"] }]`
 * becomes:
 * `[
 *   { difficulty: "easy", mode: "manual" },
 *   { difficulty: "easy", mode: "auto" },
 *   { difficulty: "hard", mode: "manual" },
 *   { difficulty: "hard", mode: "auto" },
 * ]`
 *
 * The output order is stable by design so generated sample files stay reproducible.
 */
export const buildSelectValueCombinations = (selects: SelectConfig[] = []): SelectValues[] => {
  if (selects.length === 0) {
    return [{}];
  }

  return selects.reduce(expandCombinationsForSelect, [{}]);
};

const expandCombinationsForSelect = (
  combinations: SelectValues[],
  select: SelectConfig,
): SelectValues[] => {
  assertSupportedSelectConfig(select);

  return combinations.flatMap((combination) =>
    select.values.map((value) => ({
      ...combination,
      [select.name]: value,
    })),
  );
};

const assertSupportedSelectConfig = (select: SelectConfig): void => {
  if (select.coverage !== "each-once") {
    throw new Error(
      `Unsupported coverage mode "${select.coverage}" for select "${select.name}". Only "each-once" is supported.`,
    );
  }

  if (!Array.isArray(select.values) || select.values.length === 0) {
    throw new Error(`Select "${select.name}" must declare at least one value`);
  }
};

export const getEffectiveSampleCount = (
  game: Game,
  defaultNonceCount: number,
  selectCombinations: SelectValues[],
): number => Math.max(game.nonceCount ?? defaultNonceCount, selectCombinations.length);

export const resolveSlotCategoryCounts = (
  game: Game,
  sampleCount: number,
  slotSampleCountOverrides: SlotCategoryCounts | null,
): SlotCategoryCounts | null => {
  if (!game.sampleCategoryDefaults) {
    return null;
  }

  const bonusCount =
    slotSampleCountOverrides?.bonusCount ?? game.sampleCategoryDefaults.bonus;
  const retriggerCount =
    slotSampleCountOverrides?.retriggerCount ?? game.sampleCategoryDefaults.retrigger;

  if (bonusCount > sampleCount) {
    throw new Error(
      `[game:${game.name}] bonus count (${bonusCount}) cannot exceed sample count (${sampleCount})`,
    );
  }

  if (retriggerCount > bonusCount) {
    throw new Error(
      `[game:${game.name}] retrigger count (${retriggerCount}) cannot exceed bonus count (${bonusCount})`,
    );
  }

  return {
    bonusCount,
    retriggerCount,
  };
};
