const FINAL_RESULT_HEADING = "Final Result";

export const preFinalResultTextStrategy = {
  label: "the text block before the Final Result heading",
  read: readPreFinalResultText,
};

async function readPreFinalResultText(page) {
  return page.evaluate((headingText) => {
    const resultNode = findPreFinalResultNode(headingText);
    const resultText = resultNode?.textContent?.trim();

    return resultText || null;

    function findPreFinalResultNode(expectedHeadingText) {
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
