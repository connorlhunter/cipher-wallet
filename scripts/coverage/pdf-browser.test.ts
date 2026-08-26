import { expect, test } from "bun:test";

import { pdfBrowserLaunchOptions } from "./pdf-browser";

test("adds sandbox flags only in continuous integration", (): void => {
  expect(pdfBrowserLaunchOptions(false)).toEqual({ args: [], headless: true });
  expect(pdfBrowserLaunchOptions(true)).toEqual({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });
});
