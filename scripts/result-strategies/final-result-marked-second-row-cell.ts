import type { Page } from "rebrowser-puppeteer-core";

import type { ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";

export const finalResultMarkedSecondRowCellStrategy: ResultStrategy = {
  label: "the marked cell in the second Final Result row",
  read: readFinalResultMarkedSecondRowCell,
};

async function readFinalResultMarkedSecondRowCell(page: Page): Promise<string | null> {
  return page.evaluate((headingText: string) => {
    const container = findFinalResultContainer(headingText);

    if (!container) {
      return null;
    }

    const rows = Array.from(container.querySelectorAll("tbody tr"));
    const secondRow = rows[1];

    if (!secondRow) {
      return null;
    }

    const markedCell = secondRow.querySelector("td.marked");
    const resultText = markedCell?.textContent?.trim();

    return resultText || null;

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
