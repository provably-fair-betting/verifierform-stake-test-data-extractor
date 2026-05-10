import type { Page, ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";
const EXPECTED_CARD_COUNT = 3;

export const tarotSelectedMultipliersStrategy: ResultStrategy = {
  label: "the selected Tarot multipliers",
  read: readTarotSelectedMultipliers,
};

async function readTarotSelectedMultipliers(page: Page): Promise<string | null> {
  return page.evaluate(
    ({
      expectedCount,
      headingText,
    }: {
      expectedCount: number;
      headingText: string;
    }) => {
      const container = findFinalResultContainer(headingText);

      if (!container) {
        return null;
      }

      const multipliers = Array.from(
        container.querySelectorAll("tr.used td:nth-child(2)"),
      )
        .map((node) => node.textContent?.trim())
        .filter(Boolean);

      if (multipliers.length !== expectedCount) {
        return null;
      }

      return multipliers.join("\n");

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
    },
    { expectedCount: EXPECTED_CARD_COUNT, headingText: FINAL_RESULT_HEADING },
  );
}
