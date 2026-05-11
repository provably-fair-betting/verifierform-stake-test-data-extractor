# verifierform-stake-testdata

![Version](badges/version.svg)

Generate deterministic JSON sample files by driving a verifier calculation page with `puppeteer-real-browser`. The project is organized so browser bootstrapping, form interaction, result extraction, parsing, game configuration, and output writing stay separate.

## Consumer usage

Install as a dev dependency in another project using the GitHub package URL pinned to a release tag:

```bash
pnpm add -D github:provably-fair-betting/verifierform-stake-testdata#v1.0.0
```

Add a script to the consumer's `package.json` and pass `--output-dir` to control where sample JSON files are written:

```json
"scripts": {
  "sync:testdata": "stake-testdata --output-dir ./tests/lib/games/testcases"
}
```

Then run it:

```bash
pnpm sync:testdata
```

When `--output-dir` is provided the generator writes one `{game}.json` file directly into the specified directory — no timestamped subdirectory is created. This keeps the output paths stable so the consumer project can version them. The output directory is created automatically if it does not exist.

Without `--output-dir` the default behaviour is preserved: output goes into a timestamped subdirectory inside `output/` (e.g. `output/2026-05-11T12-00-00-000Z/`).

All other flags (`--game`, `--nonce-count`, `--bonus-count`, `--retrigger-count`, `--client-seed`, `--server-seed`, `--verbose`, `--list-games`) work the same way in both modes.

The following peer dependencies must be declared in the consumer project:

```json
"devDependencies": {
  "puppeteer-real-browser": "^1.3.12",
  "rebrowser-puppeteer-core": "^23.10.3",
  "tsx": "^4.19.2"
}
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- A calculation page URL that exposes the expected `data-testid` attributes

## Install

```bash
pnpm install
```

If `pnpm` blocks browser-related postinstall scripts, approve them once:

```bash
pnpm approve-builds
```

The project already declares `puppeteer-real-browser`. The equivalent manual install command is:

```bash
pnpm add -D puppeteer-real-browser
```

## Configure

Review [scripts/config/generator-config.ts](scripts/config/generator-config.ts) before running the generator. It currently points at Stake's calculation page and writes output into `output/`.

| Option              | Type     | Required | Purpose                                                                           |
| ------------------- | -------- | -------- | --------------------------------------------------------------------------------- |
| `url`               | `string` | Yes      | Calculation page URL to open in the headed browser                                |
| `defaultNonceCount` | `number` | No       | Shared sample count used for games unless a rare game-specific override is needed |
| `formDelayMs`       | `number` | No       | Pacing delay between form writes and the final settle delay after each update     |
| `waitTimeoutMs`     | `number` | No       | Timeout for initial calculator form readiness and control visibility              |
| `waitIntervalMs`    | `number` | No       | Polling interval while waiting for the calculator page to become ready            |
| `outputDir`         | `string` | No       | Base directory used for timestamped sample output folders                         |

Games that use the default verifier seed pair get a random `clientSeed` and `serverSeed` once per game run and reuse that pair across all samples for that game. Multiplayer games can opt out and use their own game-specific inputs instead.

You can override that default seed pair per run from the command line with `--client-seed` and `--server-seed`. When provided, that pair is reused for every game in the run that uses the default verifier seed pair.

You can also override the default nonce sample count for the current run with `--nonce-count`. This replaces `defaultNonceCount` as the shared default for games that do not declare their own `nonceCount`.

Slot-style games can also override their category targets for a run with `--bonus-count` and `--retrigger-count`. These must be non-negative integers, `bonusCount` cannot exceed the total sample count, and `retriggerCount` cannot exceed `bonusCount`.

## Run

```bash
pnpm generate
```

Run one or more games by name:

```bash
pnpm generate -- --game baccarat --game dice
```

Positional game names also work:

```bash
pnpm generate -- baccarat dice
```

List the currently registered game names:

```bash
pnpm generate -- --list-games
```

Enable verbose progress logging:

```bash
pnpm generate -- --verbose
```

Override the default verifier seed pair for the current run:

```bash
pnpm generate -- --game chicken --client-seed my-client-seed --server-seed my-server-seed
```

Override the default nonce sample count for the current run:

```bash
pnpm generate -- --game roulette --nonce-count 100
```

Override slot sample category targets for the current run:

```bash
pnpm generate -- --game scarab-spins --nonce-count 100 --bonus-count 20 --retrigger-count 5
```

Verbose mode logs per-sample progress, including nonce when the current game uses one, plus any active select values. Normal mode logs startup, page readiness, per-game start, and output file completion.

Generated files are written to `output/`.

## Cloudflare / Turnstile

The browser launches in headed mode by default so you can observe or complete Cloudflare Turnstile when needed. The anti-detection browser setup is isolated in [scripts/browser/connect-browser.ts](scripts/browser/connect-browser.ts), which is the only file that knows about `puppeteer-real-browser` options.

## Strategy Design

Most game configs provide a `resultStrategy` object with the same contract:

- `label`: human-readable description used in read errors
- `read(page)`: read the current raw result or return `null` when it is not available yet

The sampler applies inputs, waits for the configured settle delay, then calls `resultStrategy.read(page)`. If the strategy returns `null`, the sampler throws using the strategy label. Slot-style games are the exception: they can provide `readVerifiedResult(page, context, interactionOptions)` when they need tighter control over verification than a single generic page read.

Current strategy families cover several page layouts:

- table readers such as `finalResultSecondRowStrategy`, `finalResultActiveRowSecondCellStrategy`, and `finalResultMarkedSecondRowCellStrategy`
- paragraph and text readers such as `finalResultTextStrategy`, `preFinalResultTextStrategy`, `finalResultFirstParagraphStrategy`, and `finalResultSecondParagraphStrategy`
- selector-based readers such as `testIdOutputStrategy(testId)` for stable `data-testid` outputs
- game-specific DOM extractors such as `dartsThrowDetailsStrategy`, `snakesRollLinesStrategy`, `barsTilesStrategy`, `packsCardIdsStrategy`, `drillMultipliersStrategy`, and `tarotSelectedMultipliersStrategy`

Keep strategies narrowly focused on reading raw page state. Any normalization, parsing, or reshaping belongs in the game's `parseResult` function or shared helpers under [scripts/parsers](scripts/parsers).

## Parsers

Shared parsers live under [scripts/parsers](scripts/parsers). Current helpers include:

- [scripts/parsers/cards.ts](scripts/parsers/cards.ts) for card strings such as `♥10`
- [scripts/parsers/text.ts](scripts/parsers/text.ts) for generic raw text handling
- [scripts/parsers/numeric-grid.ts](scripts/parsers/numeric-grid.ts) for grid-like numeric outputs
- [scripts/parsers/css-color.ts](scripts/parsers/css-color.ts) for reusable CSS and hex color parsing used by darts helpers

## Card Games

Card parsing is generic and lives in [scripts/parsers/cards.ts](scripts/parsers/cards.ts). It converts values such as `♥10` into `10-heart` and throws helpful errors when the source text is invalid.

Game files shape parsed card arrays into their own sample format. Baccarat expects exactly six cards, split into:

- `playerCards`
- `dealerCards`
- `deciderCards`

Samples always include shared metadata plus explicit `inputs` and `selects` objects, even when they are empty. That keeps the JSON format consistent across games.

## Adding a New Game

1. Create a new file under [scripts/games](scripts/games).
2. Export a config object with the fields below.
3. Reuse a strategy from [scripts/result-strategies](scripts/result-strategies) or create a new one that matches the same contract.
4. Reuse generic parsers from [scripts/parsers](scripts/parsers) and only add game-specific shaping in the new game file.
5. Add the game to [scripts/games/index.ts](scripts/games/index.ts).

### Game Config Fields

| Field                 | Type                                                                                               | Required | Purpose                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| `name`                | `string`                                                                                           | Yes      | Output filename stem and internal game identifier                                            |
| `selectValue`         | `string`                                                                                           | Yes      | Value written into the main `game` select                                                    |
| `resultStrategy`      | strategy object                                                                                    | Yes      | Reads raw page output through the shared `read(page)` contract                               |
| `parseResult`         | `(rawResult) => object \| primitive`                                                               | Yes      | Converts raw strategy output into the JSON shape written for each sample                     |
| `nonceCount`          | `number`                                                                                           | No       | Optional game-specific sample count override when the shared default is not suitable         |
| `usesNonce`           | `boolean`                                                                                          | No       | Set to `false` for games that do not use the shared nonce field                              |
| `inputs`              | `Array<GameInputConfig>`                                                                           | No       | Extra calculation inputs to set for each sample                                              |
| `selects`             | `Array<GameSelectConfig>`                                                                          | No       | Extra calculation selects to cover deterministically across samples                          |
| `buildSampleContexts` | `({ game, gameSeeds, logger, samplePlan, runContext }) => Array<object> \| Promise<Array<object>>` | No       | Custom sample planning hook for games that need more than the default nonce/select traversal |

### `inputs` Entries

| Field   | Type                              | Required | Purpose                                                          |
| ------- | --------------------------------- | -------- | ---------------------------------------------------------------- |
| `name`  | `string`                          | Yes      | Input name used to build `calculation-input-{name}`              |
| `value` | `unknown \| (context) => unknown` | Yes      | Static value or resolver function called with the sample context |

The resolver context always includes `game`, `sampleIndex`, and `selectValues`. Games that use nonce and the default seed pair also receive `nonce`, `clientSeed`, and `serverSeed`.

Games can also declare `sampleCategoryDefaults` when they need deterministic category targets, such as slot-style runs that distinguish simple, bonus, and retrigger samples.

### `selects` Entries

| Field      | Type          | Required | Purpose                                                |
| ---------- | ------------- | -------- | ------------------------------------------------------ |
| `name`     | `string`      | Yes      | Select name used to build `calculation-select-{name}`  |
| `values`   | `string[]`    | Yes      | Allowed values to cover across generated samples       |
| `coverage` | `"each-once"` | Yes      | Coverage mode for deterministic combination generation |

Select coverage is deterministic. The generator starts from `defaultNonceCount` and raises the effective sample count when needed to cover every declared select combination at least once.

## Troubleshooting

- Form breaks if inputs are filled too quickly: increase `formDelayMs` in [scripts/config/generator-config.ts](scripts/config/generator-config.ts). Form updates are intentionally awaited one at a time to keep reactive UI state stable.
- Cloudflare page does not pass: keep the run in headed mode, complete Turnstile manually, and retry once the form is visible.
- Result row timeout: verify that all required shared fields and any game-specific inputs/selects are configured and that the target game actually renders the expected output section.
- Incorrect game select value: confirm that the game config `selectValue` exactly matches the underlying `<option value="...">`.
- Slot count validation error: make sure `--bonus-count` does not exceed the total sample count and `--retrigger-count` does not exceed `--bonus-count`.
- Parser expected `6` cards but got a different count: inspect the raw text on the page and update the game-specific parser only if the page layout changed.

## Project Structure

```text
verifierform-stake-testdata/
  package.json                   # pnpm scripts, ESM config, dev dependency declaration
  README.md                      # setup, usage, troubleshooting, extension guide
  .gitignore                     # ignores installed packages and generated sample JSON files
  scripts/
    run-sampler.ts               # CLI bootstrap for all games, one game, or game listing
    run-sampler-for-games.ts     # high-level sampler orchestration across games and samples
    browser/
      connect-browser.ts         # puppeteer-real-browser setup only
    config/
      generator-config.ts        # URL, pacing, output directory, and timeout settings
    games/
      index.ts                   # exported game list and extension point for more games
      {game}.ts                  # one config file per supported game
    helpers/
      calculation-page.ts        # calculator page readiness, loader checks, and Cloudflare waiting
      darts-color.ts             # darts-specific color normalization and multiplier lookup
      dom.ts                     # shared data-testid selector builders
      form.ts                    # reusable input/select interaction helpers with pacing
      output.ts                  # JSON file writing helpers
      sample-context.ts          # seed selection, sample context, and shared sample metadata helpers
      sample-planning.ts         # sample count, config value, slot category, and select coverage helpers
      slot-game.ts               # slot sample builders shared by slot-style games
      slot-simulation.ts         # slot outcome planning and validation helpers
      wait.ts                    # sleep and polling utilities with timeout errors
    parsers/
      cards.ts                   # pure generic card parsing functions
      css-color.ts               # generic CSS color parsing helpers
      numeric-grid.ts            # numeric grid parsing helpers
      text.ts                    # simple raw text parsers for future non-card games
    result-strategies/
      bars-tiles.ts              # bars tile extraction
      darts-throw-details.ts     # darts board SVG extraction
      drill-multipliers.ts       # drill multiplier extraction
      final-result-active-row-second-cell.ts # active result row reader
      final-result-marked-second-row-cell.ts # marked row/cell reader
      final-result-paragraph.ts  # paragraph result reader
      final-result-second-row.ts # strategy for the Final Result table's second row
      final-result-text.ts       # plain text final result reader
      packs-card-ids.ts          # packs card id extraction
      pre-final-result-text.ts   # reader for pre-final result text blocks
      snakes-roll-lines.ts       # snakes output line extraction
      tarot-selected-multipliers.ts # tarot selected multiplier extraction
      test-id-output.ts          # strategy factory for known data-testid output nodes
  output/
    {timestamp}/                 # timestamped run directories containing generated game JSON files
    .gitkeep                     # keeps the output directory in the project
```

## Exact Commands

```bash
pnpm install
pnpm approve-builds
pnpm generate
pnpm generate -- --game baccarat --game dice
pnpm generate -- --game scarab-spins --nonce-count 100 --bonus-count 20 --retrigger-count 5
pnpm generate -- --verbose
```
