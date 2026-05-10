import type { Page } from "rebrowser-puppeteer-core";

import type { ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";

export const packsCardIdsStrategy: ResultStrategy = {
  label: "the Packs result card ids",
  read: readPacksCardIds,
};

async function readPacksCardIds(page: Page): Promise<string | null> {
  return page.evaluate((headingText: string) => {
    const container = findFinalResultContainer(headingText);

    if (!container) {
      return null;
    }

    const cardsSectionLabel = Array.from(
      container.querySelectorAll("span"),
    ).find((node) => node.textContent?.trim() === "Result Cards:");

    const cardsSection = cardsSectionLabel?.nextElementSibling;

    if (!cardsSection) {
      return null;
    }

    const cardTexts = Array.from(cardsSection.querySelectorAll("span"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean);

    return cardTexts.length > 0 ? cardTexts.join("\n") : null;

    function findFinalResultContainer(expectedHeadingText: string): Element | null {
      const headings = Array.from(document.querySelectorAll("h2"));
      const heading = headings.find(
        (node) => node.textContent?.trim() === expectedHeadingText,
      );

      if (!heading) {
        return null;
      }

      let container: Element | null = heading.nextElementSibling;

      while (container && container.tagName !== "DIV") {
        container = container.nextElementSibling;
      }

      return container;
    }
  }, FINAL_RESULT_HEADING);
}
