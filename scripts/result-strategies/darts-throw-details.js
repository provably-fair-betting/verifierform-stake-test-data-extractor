const FINAL_RESULT_HEADING = "Final Result";
const DART_COLOR_SELECTOR =
  ".dart-animation > svg > g > g:nth-child(2) > g > g:nth-child(2) > path";

export const dartsThrowDetailsStrategy = {
  label: "the Darts throw details",
  read: readDartsThrowDetails,
};

async function readDartsThrowDetails(page) {
  return page.evaluate(
    (headingText, colorSelector) => {
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

      function findFinalResultContainer(expectedHeadingText) {
        const headings = Array.from(document.querySelectorAll("h2"));
        const heading = headings.find(
          (node) => node.textContent?.trim() === expectedHeadingText,
        );

        if (!heading) {
          return null;
        }

        let container = heading.nextElementSibling;

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
