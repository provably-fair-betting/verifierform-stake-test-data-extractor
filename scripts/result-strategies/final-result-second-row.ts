import type { Page, ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";

export const finalResultSecondRowStrategy: ResultStrategy = {
  label: "the second Final Result row",
  read: readFinalResultSecondRow,
};

async function readFinalResultSecondRow(page: Page): Promise<string | null> {
  return page.evaluate((headingText: string) => {
    const container = findFinalResultContainer(headingText);

    if (!container) {
      return null;
    }

    const secondRow = findSecondTableRow(container);

    if (!secondRow) {
      return null;
    }

    const rowText = (secondRow as HTMLElement).innerText.trim();

    return rowText || null;

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

    function findSecondTableRow(container: Element): Element | null {
      const rows = Array.from(container.querySelectorAll("tr"));

      if (rows.length < 2) {
        return null;
      }

      return rows[1];
    }
  }, FINAL_RESULT_HEADING);
}
