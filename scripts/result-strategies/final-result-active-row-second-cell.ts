import type { Page } from "rebrowser-puppeteer-core";

import type { ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";

export const finalResultActiveRowSecondCellStrategy: ResultStrategy = {
  label: "the active Final Result row second cell",
  read: readFinalResultActiveRowSecondCell,
};

async function readFinalResultActiveRowSecondCell(page: Page): Promise<string | null> {
  return page.evaluate((headingText: string) => {
    const container = findFinalResultContainer(headingText);

    if (!container) {
      return null;
    }

    const activeCell = container.querySelector("tr.active td:nth-child(2)");
    const cellText = activeCell?.textContent?.trim() ?? "";

    return cellText || null;

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
