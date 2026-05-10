import { blackjack } from "./blackjack.js";
import { baccarat } from "./baccarat.js";
import { bars } from "./bars.js";
import { blueSamurai } from "./blue-samurai.js";
import { crash } from "./crash.js";
import { chicken } from "./chicken.js";
import { dice } from "./dice.js";
import { cases } from "./cases.js";
import { darts } from "./darts.js";
import { diamonds } from "./diamonds.js";
import { dragonTower } from "./dragon-tower.js";
import { drill } from "./drill.js";
import { flip } from "./flip.js";
import { hilo } from "./hilo.js";
import { keno } from "./keno.js";
import { limbo } from "./limbo.js";
import { mines } from "./mines.js";
import { moles } from "./moles.js";
import { packs } from "./packs.js";
import { plinko } from "./plinko.js";
import { primedice } from "./primedice.js";
import { pump } from "./pump.js";
import { rockPaperScissors } from "./rock-paper-scissors.js";
import { roulette } from "./roulette.js";
import { slide } from "./slide.js";
import { scarabSpins } from "./scarab-spins.js";
import { snakes } from "./snakes.js";
import { tarot } from "./tarot.js";
import { tomeOfLife } from "./tome-of-life.js";
import { videoPoker } from "./video-poker.js";
import { wheel } from "./wheel.js";

import type { Game } from "../types.js";

// Add future games here without changing generator orchestration.
export const games: Game[] = [
  baccarat,
  bars,
  blackjack,
  blueSamurai,
  cases,
  crash,
  chicken,
  darts,
  diamonds,
  dice,
  dragonTower,
  drill,
  flip,
  hilo,
  keno,
  limbo,
  mines,
  moles,
  packs,
  plinko,
  primedice,
  pump,
  rockPaperScissors,
  roulette,
  scarabSpins,
  slide,
  snakes,
  tarot,
  tomeOfLife,
  videoPoker,
  wheel,
];
