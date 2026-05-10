import { fileURLToPath } from "node:url";

import type { GeneratorConfig } from "../types.js";

const samplesDirectoryUrl = new URL("../../output/", import.meta.url);

export const generatorConfig: GeneratorConfig = {
  url: "https://stake.com/provably-fair/calculation",
  defaultNonceCount: 10,
  formDelayMs: 120,
  waitTimeoutMs: 30_000,
  waitIntervalMs: 150,
  outputDir: fileURLToPath(samplesDirectoryUrl),
};
