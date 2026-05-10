import { createSlotGame } from "../helpers/slot-game.js";

import type { Game } from "../types.js";

export const scarabSpins: Game = createSlotGame({
  name: "scarab-spins",
  selectValue: "slots",
  roundInputName: "slotsRound",
});
