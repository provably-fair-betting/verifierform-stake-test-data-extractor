import { createSlotGame } from "../helpers/slot-game.js";

import type { Game } from "../types.js";

export const tomeOfLife: Game = createSlotGame({
  name: "tome-of-life",
  selectValue: "slotsTomeOfLife",
  roundInputName: "slotsTomeOfLifeRound",
});
