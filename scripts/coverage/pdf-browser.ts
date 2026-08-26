import type { LaunchOptions } from "puppeteer";

/**
 * Return browser options for local and hosted PDF rendering.
 *
 * @param continuousIntegration Whether Chromium runs in a CI environment.
 * @returns Launch options safe for the current environment.
 */
export function pdfBrowserLaunchOptions(
  continuousIntegration: boolean,
): LaunchOptions {
  return {
    args: continuousIntegration
      ? ["--no-sandbox", "--disable-setuid-sandbox"]
      : [],
    headless: true,
  };
}
