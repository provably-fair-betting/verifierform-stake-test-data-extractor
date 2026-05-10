import type { Page } from "rebrowser-puppeteer-core";

import type { ResultStrategy } from "../types.js";

type DartsThrowDetails = {
  detailsText: string;
  fill: string;
};

const FINAL_RESULT_HEADING = "Final Result";
const DART_COLOR_SELECTOR =
  ".dart-animation > svg > g > g:nth-child(2) > g > g:nth-child(2) > path";

export const dartsThrowDetailsStrategy: ResultStrategy = {
  label: "the Darts throw details",
  read: readDartsThrowDetails as (page: Page) => Promise<string | null>,
};

async function readDartsThrowDetails(page: Page): Promise<DartsThrowDetails | null> {
  return page.evaluate(
    (headingText: string, colorSelector: string) => {
      const container = findFinalResultContainer(headingText);
      const colorPath = document.querySelector(colorSelector);

      if (!container || !(colorPath instanceof SVGElement)) {
        return null;
      }

      const paragraphs = Array.from(container.querySelectorAll("p"))
        .map((node) => node.textContent?.trim())
        .filter(Boolean);
      const detailParagraphs = paragraphs.slice(1);

      if (detailParagraphs.length < 3) {
        return null;
      }

      const fill = colorPath.getAttribute("fill")?.trim();

      if (!fill) {
        return null;
      }

      return {
        detailsText: detailParagraphs.join("\n"),
        fill,
      };

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
    FINAL_RESULT_HEADING,
    DART_COLOR_SELECTOR,
  );
}
