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

Standard games:
```
CLI args
  → run-sampler.ts            (parse flags, resolve game list)
  → run-sampler-for-games.ts  (connect browser, iterate games)
    → form.ts                 (fill inputs, selects, trigger calculation)
    → ResultStrategy.read     (read raw DOM text)
    → game.parseResult        (convert raw text → typed object)
    → output.ts               (write {game}.json)
```

Slot games and Blue Samurai:
```
CLI args
  → run-sampler.ts                  (parse flags, resolve game list)
  → run-sampler-for-games.ts        (connect browser, iterate games)
    → game.buildSampleContexts      (scan nonces offline, classify into categories)
    → form.ts                       (fill inputs per sample)
    → game.readVerifiedResult       (step through rounds, read DOM per round)
    → game.parseResult              (verify simulated state matches DOM)
    → output.ts                     (write {game}.json)
```

## Game definition

Every game is a `Game` object (see `scripts/types.ts`). The two required pieces of behaviour are:

- **`inputs` / `selects`** — declarative form configuration. The orchestrator fills these before each sample.
- **`parseResult`** — converts the raw string from the page into the final JSON object for that sample.

Everything else opts the game in or out of shared orchestration behaviours:

- `resultStrategy` — which DOM reader to use (default flow only; not used when `readVerifiedResult` is set)
- `usesNonce` / `useDefaultSeedPair` — whether the game uses the shared nonce and seed-pair fields
- `nonceCount` — per-game sample count override
- `buildSampleContexts` — replaces the default nonce/select traversal with custom sample planning (used by slot games and Blue Samurai)
- `readVerifiedResult` — replaces the single result read with direct per-sample DOM interaction (used by slot games and Blue Samurai)
- `sampleCategoryDefaults` — declares target counts per sample category; only meaningful when `buildSampleContexts` is set
- `roundInputName` — the form input name used to step through rounds during slot verification

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

Slot games replace both sample-planning and result-reading with their own implementations via `buildSampleContexts` and `readVerifiedResult`.

### Standard slots (`createSlotGame`)

Most slot games are created with the `createSlotGame()` factory in `scripts/helpers/slot-game.ts`. This wires up:

- **`buildSampleContexts` → `buildSlotSampleContexts`** — scans nonces offline to find samples that fall into the `bonus`, `retrigger`, or `simple` categories, targeting the counts in `sampleCategoryDefaults` (default: `{ bonus: 2, retrigger: 1 }`). Remaining samples are ordinary.
- **`readVerifiedResult` → `readVerifiedSlotResult`** — after the calculator page is ready, steps through each expected round using `roundInputName`, reads the visible reel symbols and center indices from the DOM, and returns them for `parseResult` to verify.
- **`parseResult` → `parseSlotVerificationResult`** — compares the simulated reel state against what Stake rendered; throws if they diverge.

The `--bonus-count` and `--retrigger-count` CLI flags override `sampleCategoryDefaults` at run time for all standard slot games.

### Blue Samurai

Blue Samurai uses entirely custom helpers (`scripts/helpers/blue-samurai.ts`) because it has four categories instead of two:

| Category key | Category label | Default count |
| ------------ | -------------- | ------------- |
| `bonus` | `bonus` | 1 |
| `specialRounds` | `special-rounds` | 1 |
| `bonusWithRetrigger` | `bonus-with-retrigger` | 1 |
| `bonusWithSpecialRounds` | `bonus-with-special-rounds` | 1 |

Remaining samples become `ordinary`. Each category is independently overridable via the `--blue-samurai-*-count` CLI flags. The scan uses `simulateBlueSamuraiRounds` and `classifyBlueSamuraiRounds` (in `scripts/helpers/blue-samurai-simulation.ts`) to classify nonces offline before touching the browser, up to a limit of 250 000 nonces.

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
