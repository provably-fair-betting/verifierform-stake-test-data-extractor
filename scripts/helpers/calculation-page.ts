import { sleep } from "./wait.js";

import type { Browser, Logger, Page } from "../types.js";

type PageState = {
  title: string;
  url: string;
  hasVisibleStakeLoader: boolean;
  bodyPreview: string;
};

type PollResult = {
  readyPage: Page | null;
  initialPageState: PageState;
  waitingForRedirect: boolean;
};

type OpenCalculationPageOptions = {
  url: string;
  waitTimeoutMs: number;
  waitIntervalMs: number;
  stakeLoaderSelector?: string;
};

const defaultStakeLoaderSelector = ".loading";

const silentLogger: Logger = {
  verboseEnabled: false,
  info() {},
  verbose() {},
  error(error) {
    console.error(error);
  },
};

export async function openCalculationPage(
  browser: Browser,
  page: Page,
  logger: Logger = silentLogger,
  {
    url,
    waitTimeoutMs,
    waitIntervalMs,
    stakeLoaderSelector = defaultStakeLoaderSelector,
  }: OpenCalculationPageOptions,
): Promise<Page> {
  logger.info(`[sampler] Opening ${url}`);
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  logger.info(`[sampler] Waiting for calculation form`);
  const calculationPage = await waitForCalculationForm(browser, page, logger, {
    waitTimeoutMs,
    waitIntervalMs,
    stakeLoaderSelector,
  });
  logger.info(`[sampler] Calculation form is ready`);

  return calculationPage;
}

async function waitForCalculationForm(
  browser: Browser,
  initialPage: Page,
  logger: Logger,
  {
    waitTimeoutMs,
    waitIntervalMs,
    stakeLoaderSelector,
  }: { waitTimeoutMs: number; waitIntervalMs: number; stakeLoaderSelector: string },
): Promise<Page> {
  const startedAt = Date.now();
  let didLogBlockingPage = false;
  let didLogStakeLoader = false;
  let lastInitialPageState: PageState | null = null;

  while (Date.now() - startedAt < waitTimeoutMs) {
    const pollResult = await pollCalculationPages(browser, initialPage, {
      stakeLoaderSelector,
    });
    const { readyPage, initialPageState, waitingForRedirect } = pollResult;

    lastInitialPageState = initialPageState;

    if (readyPage) {
      if (readyPage !== initialPage) {
        logger.verbose(
          `[sampler] Switched to the browser page that rendered the calculator form`,
        );
      }

      return readyPage;
    }

    if (waitingForRedirect) {
      logger.info(
        `[sampler] Cloudflare challenge passed. Waiting for redirect to settle.`,
      );
      await sleep(1500);
    }

    if (!didLogBlockingPage && looksLikeChallengePage(initialPageState)) {
      logger.info(
        `[sampler] Cloudflare still in progress on "${initialPageState.title}". Wait unless the page asks for manual verification.`,
      );
      didLogBlockingPage = true;
    }

    if (!didLogStakeLoader && initialPageState.hasVisibleStakeLoader) {
      logger.info(
        `[sampler] Stake loader still visible. Waiting for it to clear.`,
      );
      didLogStakeLoader = true;
    }

    await sleep(waitIntervalMs);
  }

  const pageState =
    lastInitialPageState ??
    (await readCalculationPageState(initialPage, stakeLoaderSelector));

  throw new Error(
    `[sampler] Calculation form did not appear within ${waitTimeoutMs}ms. ` +
      `title="${pageState.title}" url="${pageState.url}" body="${pageState.bodyPreview}"`,
  );
}

async function pollCalculationPages(
  browser: Browser,
  initialPage: Page,
  { stakeLoaderSelector }: { stakeLoaderSelector: string },
): Promise<PollResult> {
  const pages = await browser.pages();
  let initialPageState: PageState | null = null;
  let waitingForRedirect = false;

  for (const currentPage of pages) {
    const pageState = await readCalculationPageState(
      currentPage,
      stakeLoaderSelector,
    );

    if (currentPage === initialPage) {
      initialPageState = pageState;
    }

    if (pageState.title.length === 0) {
      waitingForRedirect = true;
    }

    if (isCalculationFormReady(pageState)) {
      return {
        readyPage: currentPage,
        initialPageState: initialPageState ?? pageState,
        waitingForRedirect,
      };
    }
  }

  return {
    readyPage: null,
    initialPageState:
      initialPageState ??
      (await readCalculationPageState(initialPage, stakeLoaderSelector)),
    waitingForRedirect,
  };
}

async function readCalculationPageState(
  page: Page,
  stakeLoaderSelector: string,
): Promise<PageState> {
  try {
    return await page.evaluate((loaderSelector: string) => {
      const bodyText = (document.body as HTMLBodyElement & { innerText: string })?.innerText ?? "";

      return {
        title: document.title,
        url: window.location.href,
        hasVisibleStakeLoader: hasVisibleLoader(loaderSelector),
        bodyPreview: bodyText.replace(/\s+/g, " ").trim().slice(0, 240),
      };

      function hasVisibleLoader(selector: string): boolean {
        return Array.from(document.querySelectorAll(selector)).some(isVisible);
      }

      function isVisible(element: Element): boolean {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          rect.width > 0 &&
          rect.height > 0
        );
      }
    }, stakeLoaderSelector);
  } catch (error) {
    return {
      title: "<unavailable>",
      url: page.url(),
      hasVisibleStakeLoader: false,
      bodyPreview: String(error),
    };
  }
}

function isCalculationFormReady(pageState: PageState): boolean {
  return (
    isCalculationPage(pageState) &&
    !looksLikeChallengePage(pageState) &&
    !pageState.hasVisibleStakeLoader
  );
}

function isCalculationPage(pageState: PageState): boolean {
  return (
    pageState.url.includes("/provably-fair/calculation") &&
    pageState.title.toLowerCase().includes("provably fair calculator")
  );
}

function looksLikeChallengePage(pageState: PageState): boolean {
  const title = pageState.title.toLowerCase();
  const bodyPreview = pageState.bodyPreview.toLowerCase();

  return (
    title.includes("just a moment") ||
    bodyPreview.includes("verify you are human") ||
    bodyPreview.includes("checking if the site connection is secure") ||
    bodyPreview.includes("turnstile")
  );
}
