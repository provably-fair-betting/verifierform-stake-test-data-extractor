const FINAL_RESULT_HEADING = "Final Result";

export const finalResultTextStrategy = {
  label: "the Final Result text block",
  read: readFinalResultText,
};

async function readFinalResultText(page) {
  return page.evaluate((headingText) => {
    const container = findFinalResultContainer(headingText);
    const resultText = container?.querySelector("span")?.textContent?.trim();

    return resultText || null;

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
  }, FINAL_RESULT_HEADING);
}
