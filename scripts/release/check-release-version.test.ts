import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "bun:test";
import {
  checkReleaseVersion,
  pythonReleaseVersion,
} from "./check-release-version";

let workspaceRoot = "";

afterEach(() => {
  if (workspaceRoot) rmSync(workspaceRoot, { force: true, recursive: true });
  workspaceRoot = "";
});

function writeReleaseFiles(
  version: string,
  changelogVersion = version,
): string {
  workspaceRoot = mkdtempSync(join(tmpdir(), "cipher-wallet-release-"));
  mkdirSync(join(workspaceRoot, "apps/web"), { recursive: true });
  mkdirSync(join(workspaceRoot, "packages/typescript/wallet-contracts"), {
    recursive: true,
  });
  mkdirSync(join(workspaceRoot, "packages/python/cipher-wallet-core"), {
    recursive: true,
  });
  for (const manifest of [
    "package.json",
    "apps/web/package.json",
    "packages/typescript/wallet-contracts/package.json",
  ])
    writeFileSync(join(workspaceRoot, manifest), JSON.stringify({ version }));
  for (const manifest of [
    "pyproject.toml",
    "packages/python/cipher-wallet-core/pyproject.toml",
  ])
    writeFileSync(
      join(workspaceRoot, manifest),
      `version = "${pythonReleaseVersion(version)}"\n`,
    );
  writeFileSync(
    join(workspaceRoot, "CHANGELOG.md"),
    `# Changelog\n\n## [${changelogVersion}] - 2026-08-27\n`,
  );
  return workspaceRoot;
}

test("requires every shipped version declaration to match", () => {
  expect(() =>
    checkReleaseVersion(writeReleaseFiles("0.1.0-alpha.2")),
  ).not.toThrow();
  writeFileSync(
    join(workspaceRoot, "apps/web/package.json"),
    JSON.stringify({ version: "0.1.0-alpha.1" }),
  );
  expect(() => checkReleaseVersion(workspaceRoot)).toThrow(
    "apps/web/package.json must use release version 0.1.0-alpha.2.",
  );
});

test("maps npm prereleases to Python releases", () => {
  expect(pythonReleaseVersion("1.2.3-alpha.4")).toBe("1.2.3a4");
  expect(pythonReleaseVersion("1.2.3-beta.4")).toBe("1.2.3b4");
  expect(pythonReleaseVersion("1.2.3-rc.4")).toBe("1.2.3rc4");
});
