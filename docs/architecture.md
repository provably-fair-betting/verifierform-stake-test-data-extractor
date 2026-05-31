# Architecture

## Directory structure

```
scripts/
├── games/              # One file per game, each exporting a Game object
│   ├── index.ts        # Registry — imports every game and exports the games array
│   ├── zoo.ts
│   └── ...
├── result-strategies/  # Pluggable DOM readers for extracting raw results
├── parsers/            # Low-level text/DOM parsing utilities
├── helpers/            # Shared orchestration helpers (form filling, waits, output)
├── browser/            # Puppeteer connection setup
├── config/             # Static generator config (URL, timeouts, delays)
├── types.ts            # All shared TypeScript types
├── run-sampler.ts      # CLI entry point — parses args, selects games, calls run-sampler-for-games
└── run-sampler-for-games.ts  # Core loop — opens browser, iterates games, writes output files
```

## Data flow

```
CLI args
  → run-sampler.ts      (parse flags, resolve game list)
  → run-sampler-for-games.ts  (connect browser, iterate games)
    → form.ts           (fill inputs, selects, trigger calculation)
    → ResultStrategy    (read raw DOM text)
    → game.parseResult  (convert raw text → typed object)
    → output.ts         (write {game}.json)
```

## Game definition

Every game is a `Game` object (see `scripts/types.ts`). The two required pieces of behaviour are:

- **`inputs` / `selects`** — declarative form configuration. The orchestrator fills these before each sample.
- **`parseResult`** — converts the raw string from the page into the final JSON object for that sample.

Everything else (`resultStrategy`, `usesNonce`, `useDefaultSeedPair`) opts the game in or out of shared orchestration behaviours.

## Result strategies

A `ResultStrategy` encapsulates how to read the outcome from Stake's calculator DOM. Strategies live in `scripts/result-strategies/` and implement:

```typescript
type ResultStrategy = {
  label?: string;
  read: (page: Page) => Promise<string | null>;
};
```

`read` returns `null` when the result is not yet present; the orchestrator retries until it appears or the timeout fires. This separation means `parseResult` stays pure — it only transforms already-retrieved text.

## Sample planning and selects

When a game declares `selects`, the orchestrator builds the Cartesian product of all select `values` and generates `nonceCount` samples per combination. The `coverage: "each-once"` setting is the only mode currently supported — each combination appears at least once across the run.

## Slot games

Slot-style games (blue-samurai, bars, etc.) have a special sampling mode that tracks bonus and retrigger occurrences. `sampleCategoryDefaults` declares how many bonus and retrigger samples to target. The helper in `scripts/helpers/slot-game.ts` drives this logic separately from the standard nonce loop.

## Parsers

`scripts/parsers/` contains reusable extractors:

| Module | Purpose |
| ------ | ------- |
| `cards.ts` | Parses card rank/suit strings (e.g. "Ace of Spades") |
| `numeric-grid.ts` | Extracts a grid of numbers from table-like text |
| `text.ts` | Generic string helpers (trim, split, normalise) |
| `css-color.ts` | Reads computed CSS colour values from DOM elements |

## Output format

Each run writes one `{game}.json` per game into the output directory. The file contains an array of samples. Each sample has the shape:

```json
{
  "inputs":  { "field": "value", ... },
  "selects": { "dropdown": "value", ... },
  ...parseResult fields
}
```

The exact fields beyond `inputs` and `selects` are defined by each game's `parseResult`.

## CLI entry point

`bin/stake-testdata.js` is a thin shim that calls `run-sampler.ts` via `tsx`. Consumer projects invoke it as `stake-testdata` after installing the package.
