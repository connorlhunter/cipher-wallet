import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "bun:test";
import { coveragePaths } from "./coverage-paths";
import {
  coverageArtifact,
  parseLcov,
  renderCoverageReport,
} from "./render-coverage-report";

let workspaceRoot = "";
afterEach(() => {
  if (workspaceRoot) rmSync(workspaceRoot, { force: true, recursive: true });
  workspaceRoot = "";
});
test("writes one structured coverage artifact for TypeScript and Python", () => {
  const lcov =
    "SF:packages/example.ts\nFNF:1\nFNH:1\nLF:2\nLH:2\nend_of_record\n";
  expect(
    coverageArtifact(
      parseLcov(lcov),
      parseLcov(lcov),
      "2026-08-26T18:42:31.123Z",
    ),
  ).toMatchObject({
    schemaVersion: 2,
    surfaces: [{ id: "typescript" }, { id: "python" }],
  });
  workspaceRoot = mkdtempSync(join(tmpdir(), "cipher-wallet-coverage-"));
  const paths = coveragePaths(workspaceRoot);
  mkdirSync(paths.directory, { recursive: true });
  writeFileSync(paths.typescriptLcov, lcov);
  writeFileSync(paths.pythonLcov, lcov);
  renderCoverageReport(
    paths.typescriptLcov,
    paths.pythonLcov,
    paths.directory,
    "2026-08-26T18:42:31.123Z",
  );
  expect(JSON.parse(readFileSync(paths.json, "utf8"))).toMatchObject({
    updatedAt: "2026-08-26T18:42:31.123Z",
  });
});
