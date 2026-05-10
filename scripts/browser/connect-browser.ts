import { connect } from "puppeteer-real-browser";

import type { Browser, Page } from "../types.js";

// Keep all puppeteer-real-browser specifics here so strategies and parsers stay browser-agnostic.
export const connectBrowser = async ({
  headless = false,
  enableFingerprint = true,
}: {
  headless?: boolean;
  enableFingerprint?: boolean;
} = {}): Promise<{ browser: Browser; page: Page }> => {
  const connectOptions = {
    headless,
    turnstile: true,
    args: ["--start-maximized"],
    customConfig: {},
    connectOption: {
      defaultViewport: null,
    },
    ...(enableFingerprint ? { fingerprint: true } : {}),
  };

  const { browser, page } = await connect(connectOptions);

  return { browser: browser as Browser, page: page as Page };
};
