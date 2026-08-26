import { join } from "node:path";

import { expect, test } from "bun:test";

import { coveragePaths } from "./coverage-paths";

test("resolves overview, TypeScript, and Python coverage files", (): void => {
  expect(coveragePaths("/workspace/cipher-wallet")).toEqual({
    directory: join("/workspace/cipher-wallet", "coverage"),
    pythonLcov: join("/workspace/cipher-wallet", "coverage", "python.lcov"),
    typescriptLcov: join("/workspace/cipher-wallet", "coverage", "lcov.info"),
    overview: {
      html: join("/workspace/cipher-wallet", "coverage", "index.html"),
      pdf: join("/workspace/cipher-wallet", "coverage", "index.pdf"),
    },
    python: {
      html: join(
        "/workspace/cipher-wallet",
        "coverage",
        "python",
        "index.html",
      ),
      pdf: join("/workspace/cipher-wallet", "coverage", "python", "index.pdf"),
    },
    typescript: {
      html: join(
        "/workspace/cipher-wallet",
        "coverage",
        "typescript",
        "index.html",
      ),
      pdf: join(
        "/workspace/cipher-wallet",
        "coverage",
        "typescript",
        "index.pdf",
      ),
    },
  });
});
