import { byTestId, calculationTestId } from "./dom.js";
import { sleep } from "./wait.js";

const defaultInteractionOptions = {
  timeoutMs: 10_000,
  updateDelayMs: 80,
  settleDelayMs: 120,
};

export const setCalculationInput = async (page, name, value, options = {}) =>
  updateFormControl(page, calculationTestId("input", name), value, {
    ...options,
    mode: "input",
  });

export const emptyCalculationInput = async (page, name, options = {}) =>
  updateFormControl(page, calculationTestId("input", name), "", {
    ...options,
    mode: "input",
  });

export const setCalculationSelect = async (page, name, value, options = {}) =>
  updateFormControl(page, calculationTestId("select", name), value, {
    ...options,
    mode: "select",
  });

// Sequential awaited form updates keep reactive UI state stable on pages that break under rapid writes.
export const updateFormControl = async (
  page,
  testId,
  value,
  { mode = "input", ...options } = {},
) => {
  const settings = {
    ...defaultInteractionOptions,
    ...options,
  };
  const selector = byTestId(testId);
  const expectedValue = String(value);

  assertSupportedMode(mode);
  await waitForControl(page, selector, settings.timeoutMs);

  if (mode === "select") {
    await updateSelectControl(page, selector, testId, expectedValue);
  } else {
    await updateTextControl(page, selector, expectedValue);
  }

  await sleep(settings.settleDelayMs);
};

const assertSupportedMode = (mode) => {
  if (mode !== "input" && mode !== "select") {
    throw new Error(`Unsupported form control mode "${mode}"`);
  }
};

const waitForControl = async (page, selector, timeoutMs) => {
  const handle = await page.waitForSelector(selector, {
    timeout: timeoutMs,
  });

  if (!handle) {
    throw new Error(`Timed out waiting for form control ${selector} to appear`);
  }

  return handle;
};

const updateSelectControl = async (page, selector, testId, value) => {
  const appliedValue = String(value);
  const didApply = await applySelectValue(page, selector, appliedValue);

  if (!didApply) {
    throw new Error(
      `Select ${testId} does not contain option value "${appliedValue}"`,
    );
  }

  await commitControlUpdate(page, selector);
};

const applySelectValue = (page, selector, nextValue) =>
  page.$eval(selector, setSelectControlValue, nextValue);

const setSelectControlValue = (element, nextValue) => {
  if (!(element instanceof HTMLSelectElement)) {
    throw new Error(`Expected select element for ${element.tagName}`);
  }

  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    "value",
  );

  const hasMatchingOption = Array.from(element.options).some(
    (option) => option.value === nextValue,
  );

  if (!hasMatchingOption) {
    return false;
  }

  if (!descriptor?.set) {
    throw new Error(
      `Could not resolve native value setter for ${element.tagName}`,
    );
  }

  descriptor.set.call(element, nextValue);

  return true;
};

const updateTextControl = async (page, selector, value) => {
  await applyTextValue(page, selector, value);
  await commitControlUpdate(page, selector);
};

const applyTextValue = (page, selector, nextValue) =>
  page.$eval(selector, setTextControlValue, nextValue);

const setTextControlValue = (element, nextValue) => {
  if (
    !(element instanceof HTMLInputElement) &&
    !(element instanceof HTMLTextAreaElement)
  ) {
    throw new Error(
      `Expected input or textarea element for ${element.tagName}`,
    );
  }

  const prototype =
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : HTMLTextAreaElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

  if (!descriptor?.set) {
    throw new Error(
      `Could not resolve native value setter for ${element.tagName}`,
    );
  }

  descriptor.set.call(element, nextValue);
};

const commitControlUpdate = (page, selector) =>
  page.$eval(selector, finalizeControlUpdate);

const finalizeControlUpdate = (element) => {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.blur();
};
