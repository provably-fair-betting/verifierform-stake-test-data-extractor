import type { Page, ResultStrategy } from "../types.js";

const FINAL_RESULT_HEADING = "Final Result";

export const finalResultFirstParagraphStrategy: ResultStrategy = {
  label: "the first Final Result paragraph",
  read: readFinalResultFirstParagraph,
};

export const finalResultSecondParagraphStrategy: ResultStrategy = {
  label: "the second Final Result paragraph",
  read: readFinalResultSecondParagraph,
};

async function readFinalResultFirstParagraph(page: Page): Promise<string | null> {
  return readFinalResultParagraph(page, 0);
}

async function readFinalResultSecondParagraph(page: Page): Promise<string | null> {
  return readFinalResultParagraph(page, 1);
}

async function readFinalResultParagraph(
  page: Page,
  paragraphIndex: number,
): Promise<string | null> {
  return page.evaluate(
    ({ headingText, paragraphIndex }: { headingText: string; paragraphIndex: number }) => {
      const container = findFinalResultContainer(headingText);

      if (!container) {
        return null;
      }

      const paragraphs = Array.from(container.querySelectorAll("p"));
      const paragraph = paragraphs[paragraphIndex];
      const resultText = paragraph?.textContent?.trim();

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
    },
    { headingText: FINAL_RESULT_HEADING, paragraphIndex },
  );
}
