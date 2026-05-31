import type { Page } from "rebrowser-puppeteer-core";

export type Logger = {
  verboseEnabled: boolean;
  info(message: string): void;
  verbose(message: string): void;
  error(error: unknown): void;
};

export type InteractionOptions = {
  timeoutMs: number;
  updateDelayMs: number;
  settleDelayMs: number;
};

export type SeedPair = {
  clientSeed: string;
  serverSeed: string;
};

export type GameSeeds = SeedPair & { source: "cli" | "random" };

export type SelectValues = Record<string, string>;

export type SelectConfig = {
  name: string;
  values: string[];
  coverage: "each-once";
};

export type InputConfig = {
  name: string;
  value: string | ((context: SampleContext) => string | Promise<string>);
};

export type ResultStrategy = {
  label?: string;
  read: (page: Page) => Promise<string | null>;
};

export type SlotCategoryCounts = {
  bonusCount: number;
  retriggerCount: number;
};

export type BlueSamuraiCategoryCounts = {
  bonus: number | null;
  specialRounds: number | null;
  bonusWithRetrigger: number | null;
  bonusWithSpecialRounds: number | null;
};

export type VisibleReelSymbols = {
  above: string;
  center: string;
  below: string;
  indices: {
    above: number;
    center: number;
    below: number;
  };
};

export type SlotRound = {
  round: number;
  centerIndices: number[];
  visibleSymbolsByReel: VisibleReelSymbols[];
  scatterCount: number;
  triggersBonus: boolean;
  totalRounds: number;
};

export type BlueSamuraiSymbol = {
  index: number;
  reelType: "outer" | "inner";
  float: number | null;
  lookupSymbol: string;
  symbol: string;
  locked: boolean;
};

export type BlueSamuraiRound = {
  round: number;
  retrigger: boolean;
  retriggerType: "bonus" | "special" | null;
  specialRound: boolean;
  specialSpin: number | null;
  previousSpecialSpinsCount: number;
  bonusSpin: number;
  totalBonusRounds: number;
  floatColumns: (number | null)[][];
  lockedSamuraiIndices: number[];
  newlyLockedSamuraiIndices: number[];
  symbols: BlueSamuraiSymbol[];
};

export type SampleContextOverrides = {
  nonce?: number;
  selectValues?: SelectValues;
  slotCategory?: string;
  slotRounds?: SlotRound[];
  blueSamuraiCategory?: string;
  blueSamuraiRounds?: BlueSamuraiRound[];
  [key: string]: unknown;
};

export type SampleContext = {
  game: Game;
  nonce: number | undefined;
  sampleIndex: number;
  selectValues: SelectValues;
  clientSeed: string | undefined;
  serverSeed: string | undefined;
  slotCategory?: string;
  slotRounds?: SlotRound[];
  blueSamuraiCategory?: string;
  blueSamuraiRounds?: BlueSamuraiRound[];
  [key: string]: unknown;
};

export type SamplePlan = {
  selectCombinations: SelectValues[];
  sampleCount: number;
  slotCategoryCounts: SlotCategoryCounts | null;
};

export type BuildSampleContextsOptions = {
  game: Game;
  gameSeeds: GameSeeds;
  logger: Logger;
  samplePlan: SamplePlan;
  runContext: RunContext;
};

export type Game = {
  name: string;
  selectValue: string;
  resultStrategy?: ResultStrategy;
  parseResult: (rawResult: unknown, context: SampleContext) => unknown;
  inputs: InputConfig[];
  selects: SelectConfig[];
  nonceCount?: number;
  usesNonce?: boolean;
  useDefaultSeedPair?: boolean;
  sampleCategoryDefaults?: Record<string, number>;
  roundInputName?: string;
  buildSampleContexts?: (options: BuildSampleContextsOptions) => Promise<SampleContext[]>;
  readVerifiedResult?: (
    page: Page,
    context: SampleContext,
    interactionOptions: InteractionOptions,
  ) => Promise<unknown>;
};

export type RunContext = {
  logger: Logger;
  nonceCountOverride: number | null;
  page: Page;
  runOutputDirectory: string;
  seedPairOverride: SeedPair | null;
  slotSampleCountOverrides: SlotCategoryCounts | null;
  blueSamuraiCategoryCounts: BlueSamuraiCategoryCounts | null;
};

export type GeneratorConfig = {
  url: string;
  defaultNonceCount: number;
  formDelayMs: number;
  waitTimeoutMs: number;
  waitIntervalMs: number;
  outputDir: string;
};
