const FINAL_RESULT_HEADING = "Final Result";
const EXPECTED_CARD_COUNT = 3;

export const tarotSelectedMultipliersStrategy = {
  label: "the selected Tarot multipliers",
  read: readTarotSelectedMultipliers,
};

async function readTarotSelectedMultipliers(page) {
  return page.evaluate(
    ({ expectedCount, headingText }) => {
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
    { expectedCount: EXPECTED_CARD_COUNT, headingText: FINAL_RESULT_HEADING },
  );
}
