import { byTestId } from "../helpers/dom.js";

import type { Page } from "rebrowser-puppeteer-core";

import type { ResultStrategy } from "../types.js";

export const testIdOutputStrategy = (testId: string): ResultStrategy => {
  const selector = byTestId(testId);

  return {
    label: `output test id "${testId}"`,
    read: (page: Page) => readTextBySelector(page, selector),
  };
};

async function readTextBySelector(page: Page, selector: string): Promise<string | null> {
  const handle = await page.$(selector);

  if (!handle) {
    return null;
  }

  return page.$eval(selector, (element) => element.textContent?.trim() || null);
}
