import type { Page } from "rebrowser-puppeteer-core";

import type { ResultStrategy } from "../types.js";

const EXPECTED_MULTIPLIER_COUNT = 3;
const FINAL_RESULT_HEADING = "Final Result";

export const drillMultipliersStrategy: ResultStrategy = {
  label: "the Drill multipliers",
  read: readDrillMultipliers,
};

async function readDrillMultipliers(page: Page): Promise<string | null> {
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

      const rows = Array.from(container.querySelectorAll("tbody tr"));

      if (rows.length < expectedCount) {
        return null;
      }

      const multipliers = rows
        .slice(0, expectedCount)
        .map((row) => row.querySelector("td:nth-child(2)")?.textContent?.trim())
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
    {
      expectedCount: EXPECTED_MULTIPLIER_COUNT,
      headingText: FINAL_RESULT_HEADING,
    },
  );
}
