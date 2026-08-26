import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "bun:test";

import {
  coverageUpdatedAt,
  parseLcov,
  renderCoverageReport,
} from "./render-coverage-report";

test("renders labeled coverage pages from TypeScript and Python LCOV", (): void => {
  const directory = mkdtempSync(join(tmpdir(), "cipher-wallet-coverage-"));
  const typescriptLcovPath = join(directory, "typescript.lcov");
  const pythonLcovPath = join(directory, "python.lcov");
  writeFileSync(
    typescriptLcovPath,
    "SF:packages/example.ts\nFNF:2\nFNH:2\nLF:4\nLH:4\nend_of_record\n",
  );
  writeFileSync(
    pythonLcovPath,
    `SF:${join(process.cwd(), "apps/api/app/main.py")}\nFNF:1\nFNH:1\nLF:2\nLH:2\nend_of_record\n`,
  );

  expect(parseLcov(readFileSync(typescriptLcovPath, "utf8"))).toEqual([
    {
      functions: { covered: 2, found: 2 },
      lines: { covered: 4, found: 4 },
      path: "packages/example.ts",
    },
  ]);

  renderCoverageReport(
    typescriptLcovPath,
    pythonLcovPath,
    join(directory, "coverage"),
    "2026-08-25T14:42:31.123-04:00",
  );
  const index = readFileSync(join(directory, "coverage", "index.html"), "utf8");
  const typescript = readFileSync(
    join(directory, "coverage", "typescript", "index.html"),
    "utf8",
  );
  const python = readFileSync(
    join(directory, "coverage", "python", "index.html"),
    "utf8",
  );

  expect(index).toContain("Cipher Wallet coverage");
  expect(index).toContain('href="python/index.html"');
  expect(index).toContain("requires at least 95% line and function coverage");
  expect(index).toContain(
    'Updated <time datetime="2026-08-25T18:42:31.123Z">Aug 25, 2026</time>',
  );
  expect(index).toContain("connorhunter.theme.scheme");
  expect(typescript).toContain("100.00% (4/4)");
  expect(typescript).toContain("Generated from the Bun contract test suite.");
  expect(python).toContain("100.00% (2/2)");
  expect(python).toContain(
    "Generated from the FastAPI and shared-contract test suite.",
  );
  expect(python).toContain("apps/api/app/main.py");
  expect(python).not.toContain(process.cwd());
});

test("normalizes the project-owned coverage timestamp", (): void => {
  expect(coverageUpdatedAt("2026-08-25T14:42:31.123-04:00")).toBe(
    "2026-08-25T18:42:31.123Z",
  );
  expect((): string => coverageUpdatedAt("not-a-date")).toThrow(
    "Invalid coverage publication date",
  );
});
