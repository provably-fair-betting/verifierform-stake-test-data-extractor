# Adding a game

This guide walks through adding a new game extractor. Zoo is used as the worked example throughout.

## 1. Create the game file

Create `scripts/games/{game-name}.ts`. Export a single `Game` object named after the game.

```typescript
import { finalResultFirstParagraphStrategy } from "../result-strategies/final-result-paragraph.js";
import type { Game } from "../types.js";

export const zoo: Game = {
  name: "zoo",
  selectValue: "zoo",
  useDefaultSeedPair: false,
  usesNonce: false,
  resultStrategy: finalResultFirstParagraphStrategy,
  parseResult: parseZooResult,
  inputs: [
    { name: "hash", value: () => createRandomHex(32) },
    { name: "seed", value: () => createRandomHex(16) },
  ],
  selects: [],
};
```

## 2. Game config fields

| Field | Required | Description |
| ----- | -------- | ----------- |
| `name` | Yes | Identifier used with `--game` and as the output filename |
| `selectValue` | Yes | The `<option value="...">` on Stake's calculator page |
| `inputs` | Yes | Form inputs to fill (name + value or value factory) |
| `selects` | Yes | Dropdown selects to cycle through (empty array if none) |
| `parseResult` | Yes | Converts the raw DOM text into the final JSON shape |
| `resultStrategy` | No | How to read the result from the DOM (see below) |
| `usesNonce` | No | Set `false` for games without a nonce field (default: `true`) |
| `useDefaultSeedPair` | No | Set `false` for games with custom seed fields (default: `true`) |
| `nonceCount` | No | Override the default number of samples for this game only |
| `sampleCategoryDefaults` | No | Target counts per sample category for slot-style games (see Slot games below) |
| `roundInputName` | No | Form input name used to set the round number when verifying slot results |
| `buildSampleContexts` | No | Custom hook that replaces the default nonce/select traversal with game-specific sample planning |
| `readVerifiedResult` | No | Custom hook for games that need direct DOM interaction per sample instead of a single result read |

## 3. Inputs

Each entry in `inputs` maps to a named form field. The `value` can be a fixed string or a factory function called once per sample:

```typescript
inputs: [
  { name: "clientSeed", value: "my-seed" },           // fixed
  { name: "hash",       value: () => randomHex(32) }, // per-sample random
]
```

The factory receives a `SampleContext` if it needs to vary by nonce or select combination.

## 4. Selects

If the game has dropdown options that affect results, list them in `selects`. The extractor generates one sample per combination:

```typescript
selects: [
  { name: "rows", values: ["3", "4", "5", "6"], coverage: "each-once" },
]
```

Set `selects: []` when the game has no variable dropdowns.

## 5. Choosing a result strategy

A `ResultStrategy` reads raw text from the calculator page after submission. Pick the one that matches where Stake renders the outcome:

| Strategy | Use when |
| -------- | -------- |
| `finalResultFirstParagraphStrategy` | Result is in the first `<p>` under the "Final Result" heading |
| `finalResultTextStrategy` | Result is in a `<span>` under the "Final Result" heading |
| `finalResultSecondRowStrategy` | Result is in the second table row |
| `testIdOutputStrategy` | Result element has a `data-testid="output"` attribute |

All strategies are exported from `scripts/result-strategies/`. If none fits, implement `ResultStrategy` directly — the interface is:

```typescript
type ResultStrategy = {
  label?: string;
  read: (page: Page) => Promise<string | null>;
};
```

## 6. Writing parseResult

`parseResult` receives the raw string from the DOM and must return the object that goes into the JSON fixture. Throw if the data is invalid — the extractor treats a throw as a sample failure and retries.

```typescript
const parseZooResult = (rawResult: unknown): { animals: ZooAnimal[] } => {
  const pattern = new RegExp(ZOO_ANIMALS.join("|"), "g");
  const animals = [...String(rawResult).matchAll(pattern)].map(([m]) => m as ZooAnimal);
  if (animals.length !== 3) throw new Error(`Zoo expected 3 animals, got: ${rawResult}`);
  return { animals };
};
```

## 7. Slot games

Slot games have their own sample-planning and result-verification logic. Most can be created with the `createSlotGame()` factory instead of defining everything manually:

```typescript
import { createSlotGame } from "../helpers/slot-game.js";

export const scarabSpins = createSlotGame({
  name: "scarab-spins",
  selectValue: "slotsScarab",
  roundInputName: "slotsRound",
});
```

`createSlotGame()` automatically wires up `buildSampleContexts`, `readVerifiedResult`, and `parseResult` for the standard slot flow. It also sets the default category targets via `sampleCategoryDefaults`:

```typescript
sampleCategoryDefaults: { bonus: 2, retrigger: 1 }
```

These defaults can be overridden at run time with `--bonus-count` and `--retrigger-count`.

Use `createSlotGame()` when the game follows the standard slot layout. Define the `Game` object manually when the game has custom selects, a non-standard DOM layout, or its own category scheme — Bars and Drill are examples of this.

### Blue Samurai

Blue Samurai is a slot game but does not use `createSlotGame()`. It has four distinct sample categories instead of the standard two:

```typescript
sampleCategoryDefaults: {
  bonus: 1,
  specialRounds: 1,
  bonusWithRetrigger: 1,
  bonusWithSpecialRounds: 1,
}
```

These are overridable at run time with the `--blue-samurai-*-count` flags. Any category not overridden falls back to its default; passing `0` suppresses it entirely.

## 8. Register the game

Add an import and an entry to the array in `scripts/games/index.ts`:

```typescript
import { zoo } from "./zoo.js";

export const games: Game[] = [
  // ...existing games...
  zoo,
];
```

The array is sorted alphabetically by convention, but order does not affect behaviour.

## 9. Verify

```bash
# Check the game name is discoverable
npx tsx scripts/run-sampler.ts --list-games

# Generate a small sample to confirm the extractor works
npx tsx scripts/run-sampler.ts --game zoo --nonce-count 3
```

Inspect the output file under `output/` and confirm the shape matches what your consumer tests expect.
