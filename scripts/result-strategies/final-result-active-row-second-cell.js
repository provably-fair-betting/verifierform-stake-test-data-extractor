const FINAL_RESULT_HEADING = "Final Result";

export const finalResultActiveRowSecondCellStrategy = {
  label: "the active Final Result row second cell",
  read: readFinalResultActiveRowSecondCell,
};

async function readFinalResultActiveRowSecondCell(page) {
  return page.evaluate((headingText) => {
    const container = findFinalResultContainer(headingText);

    if (!container) {
      return null;
    }

    const activeCell = container.querySelector("tr.active td:nth-child(2)");
    const cellText = activeCell?.textContent?.trim() ?? "";

    return cellText || null;

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
