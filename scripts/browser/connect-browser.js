import { connect } from "puppeteer-real-browser";

// Keep all puppeteer-real-browser specifics here so strategies and parsers stay browser-agnostic.
export const connectBrowser = async ({
  headless = false,
  enableFingerprint = true,
} = {}) => {
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

  return { browser, page };
};
