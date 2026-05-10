const FINAL_RESULT_HEADING = "Final Result";
const EXPECTED_ROLL_COUNT = 5;

export const snakesRollLinesStrategy = {
  label: "the Snakes roll lines",
  read: readSnakesRollLines,
};

async function readSnakesRollLines(page) {
  return page.evaluate(
    ({ headingText, expectedRollCount }) => {
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
    {
      headingText: FINAL_RESULT_HEADING,
      expectedRollCount: EXPECTED_ROLL_COUNT,
    },
  );
}
