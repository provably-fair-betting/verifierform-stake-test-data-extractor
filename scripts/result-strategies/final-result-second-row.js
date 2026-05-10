const FINAL_RESULT_HEADING = "Final Result";

export const finalResultSecondRowStrategy = {
  label: "the second Final Result row",
  read: readFinalResultSecondRow,
};

async function readFinalResultSecondRow(page) {
  return page.evaluate((headingText) => {
    const container = findFinalResultContainer(headingText);

    if (!container) {
      return null;
    }

    const secondRow = findSecondTableRow(container);

    if (!secondRow) {
      return null;
    }

    const rowText = secondRow.innerText.trim();

    return rowText || null;

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

    function findSecondTableRow(container) {
      const rows = Array.from(container.querySelectorAll("tr"));

      if (rows.length < 2) {
        return null;
      }

      return rows[1];
    }
  }, FINAL_RESULT_HEADING);
}
