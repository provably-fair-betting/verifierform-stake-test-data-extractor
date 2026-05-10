import { byTestId } from "../helpers/dom.js";

export const testIdOutputStrategy = (testId) => {
  const selector = byTestId(testId);

  return {
    label: `output test id "${testId}"`,
    read: (page) => readTextBySelector(page, selector),
  };
};

async function readTextBySelector(page, selector) {
  const handle = await page.$(selector);

  if (!handle) {
    return null;
  }

  return page.$eval(selector, (element) => element.textContent?.trim() || null);
}
