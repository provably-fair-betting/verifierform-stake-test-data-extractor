# verifierform-stake-test-data-extractor

[![CI](https://github.com/provably-fair-betting/verifierform-stake-test-data-extractor/actions/workflows/ci.yml/badge.svg)](https://github.com/provably-fair-betting/verifierform-stake-test-data-extractor/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/release/provably-fair-betting/verifierform-stake-test-data-extractor)](https://github.com/provably-fair-betting/verifierform-stake-test-data-extractor/releases/latest)

Drives Stake's provably fair calculator in a real browser and writes one `{game}.json` sample file per game. Consumer projects use these files as test fixtures.

## Installation

Add as a dev dependency, pinned to a release tag:

```bash
pnpm add -D github:provably-fair-betting/verifierform-stake-test-data-extractor#v2.0.0
```

The following peer dependencies are also required:

```bash
pnpm add -D puppeteer-real-browser rebrowser-puppeteer-core tsx
```

If pnpm blocks browser-related postinstall scripts, approve them once:

```bash
pnpm approve-builds
```

## Usage

Add a script to your `package.json`:

```json
"scripts": {
  "sync:testdata": "stake-testdata --output-dir ./tests/lib/games/testcases"
}
```

Run it:

```bash
pnpm sync:testdata
```

To regenerate a single game without being prompted about existing files:

```bash
pnpm sync:testdata -- --game zoo
```

## Options

| Flag                | Description                                                                  |
| ------------------- | ---------------------------------------------------------------------------- |
| `--output-dir`      | Directory where sample JSON files are written (created if it does not exist) |
| `--game <name>`     | Run only the named game; can be repeated for multiple games                  |
| `--list-games`      | Print all registered game names and exit                                     |
| `--nonce-count`     | Override the default number of samples per game for this run                 |
| `--client-seed`     | Override the client seed used for all standard seed-pair games in this run   |
| `--server-seed`     | Override the server seed used for all standard seed-pair games in this run   |
| `--bonus-count`     | Override the target number of bonus samples for slot-style games             |
| `--retrigger-count` | Override the target number of retrigger samples for slot-style games         |
| `--blue-samurai-bonus-count` | Override the Blue Samurai bonus category sample count           |
| `--blue-samurai-special-rounds-count` | Override the Blue Samurai special rounds category sample count |
| `--blue-samurai-bonus-retrigger-count` | Override the Blue Samurai bonus-with-retrigger category sample count |
| `--blue-samurai-bonus-special-rounds-count` | Override the Blue Samurai bonus-with-special-rounds category sample count |
| `--verbose`         | Log per-sample progress in addition to the normal startup and completion messages |

## Output

Each run writes one `{game}.json` file per game into `--output-dir`. When `--output-dir` is not set, output goes into a timestamped subdirectory under `output/`.

## Cloudflare

The browser runs in headed mode so you can observe or manually complete a Cloudflare Turnstile challenge if one appears. Once the form is visible the run continues automatically.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| Form state breaks between inputs | Increase `formDelayMs` in `scripts/config/generator-config.ts` |
| Cloudflare challenge does not pass | Complete it manually in the headed browser window, then wait |
| Result times out | Check that `selectValue` in the game config exactly matches the `<option value="...">` on the page |
| Unknown game error | Run `--list-games` to see registered names |
| Slot count validation error | Ensure `--bonus-count` ≤ total samples and `--retrigger-count` ≤ `--bonus-count` |

## Further reading

- [Adding a game](docs/adding-a-game.md)
- [Architecture](docs/architecture.md)
