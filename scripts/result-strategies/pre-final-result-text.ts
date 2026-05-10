import type { Page, ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";

export const preFinalResultTextStrategy: ResultStrategy = {
  label: "the text block before the Final Result heading",
  read: readPreFinalResultText,
};

async function readPreFinalResultText(page: Page): Promise<string | null> {
  return page.evaluate((headingText: string) => {
    const resultNode = findPreFinalResultNode(headingText);
    const resultText = resultNode?.textContent?.trim();

    return resultText || null;

    function findPreFinalResultNode(expectedHeadingText: string): Element | null {
      const headings = Array.from(document.querySelectorAll("h2"));
      const heading = headings.find(
        (node) => node.textContent?.trim() === expectedHeadingText,
      );

      if (!heading) {
        return null;
      }

      const headingContainer = heading.closest("div");

      return headingContainer?.previousElementSibling ?? null;
    }
  }, FINAL_RESULT_HEADING);
}
