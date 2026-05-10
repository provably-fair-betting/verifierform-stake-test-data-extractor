import type { Page, ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";
const EXPECTED_ROLL_COUNT = 5;

export const snakesRollLinesStrategy: ResultStrategy = {
  label: "the Snakes roll lines",
  read: readSnakesRollLines,
};

async function readSnakesRollLines(page: Page): Promise<string | null> {
  return page.evaluate(
    ({
      headingText,
      expectedRollCount,
    }: {
      headingText: string;
      expectedRollCount: number;
    }) => {
      const container = findFinalResultContainer(headingText);

      if (!container) {
        return null;
      }

      const rollTexts = Array.from(container.querySelectorAll("span"))
        .map((node) => node.textContent?.trim())
        .filter((text) => /^Roll\s+\d+:/.test(text ?? ""));

      const uniqueRollTexts = [...new Set(rollTexts)];

      if (uniqueRollTexts.length !== expectedRollCount) {
        return null;
      }

      return uniqueRollTexts.join("\n");

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
      headingText: FINAL_RESULT_HEADING,
      expectedRollCount: EXPECTED_ROLL_COUNT,
    },
  );
}
