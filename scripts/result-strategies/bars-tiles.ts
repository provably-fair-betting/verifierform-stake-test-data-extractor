import type { Page, ResultStrategy } from "../types.js";

const TILE_COUNT = 30;

export const barsTilesStrategy: ResultStrategy = {
  label: "the Bars multiplier tiles",
  read: readBarsTiles,
};

async function readBarsTiles(page: Page): Promise<string | null> {
  return page.evaluate((tileCount: number) => {
    const tilesWrap = document.querySelector(".tiles-wrap");

    if (!tilesWrap) {
      return null;
    }

    const tileTexts: string[] = [];

    for (let tileIndex = 1; tileIndex <= tileCount; tileIndex += 1) {
      const tile = tilesWrap.querySelector(
        `[data-testid="game-tile-${tileIndex}"]`,
      );

      if (!tile) {
        return null;
      }

      const tileText = tile.textContent?.trim();

      if (!tileText) {
        return null;
      }

      tileTexts.push(tileText);
    }

    return tileTexts.join("\n");
  }, TILE_COUNT);
}
