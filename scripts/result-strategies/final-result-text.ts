import type { Page } from "rebrowser-puppeteer-core";

import type { ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";

export const finalResultTextStrategy: ResultStrategy = {
  label: "the Final Result text block",
  read: readFinalResultText,
};

async function readFinalResultText(page: Page): Promise<string | null> {
  return page.evaluate((headingText: string) => {
    const container = findFinalResultContainer(headingText);
    const resultText = container?.querySelector("span")?.textContent?.trim();

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
