import {
  buildBlueSamuraiSampleContexts,
  parseBlueSamuraiResult,
  readVerifiedBlueSamuraiResult,
} from "../helpers/blue-samurai.js";

export const blueSamurai = {
  name: "blue-samurai",
  selectValue: "slotsSamurai",
  sampleCategoryDefaults: {
    bonus: 1,
    specialRounds: 1,
    bonusWithRetrigger: 1,
    bonusWithSpecialRounds: 1,
  },
  buildSampleContexts: buildBlueSamuraiSampleContexts,
  readVerifiedResult: readVerifiedBlueSamuraiResult,
  parseResult: parseBlueSamuraiResult,
  inputs: [],
  selects: [],
};
