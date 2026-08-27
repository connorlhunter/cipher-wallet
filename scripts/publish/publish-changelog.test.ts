import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "bun:test";
import { changelogPaths } from "../changelog/changelog-artifact";
import {
  publishChangelog,
  publishChangelogPublication,
} from "./publish-changelog";
import type { CommandRunner } from "./command-runner";

const publicationEnvironment: NodeJS.ProcessEnv = {
  ARTIFACTS_BUCKET: "live-artifacts",
  ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID: "distribution-123",
  ARTIFACTS_PREFIX: "portfolio",
  SOURCE_ARTIFACTS_BUCKET: "source-artifacts",
  SOURCE_ARTIFACTS_PREFIX: "source",
};
let workspaceRoot = "";

afterEach(() => {
  if (workspaceRoot) rmSync(workspaceRoot, { force: true, recursive: true });
  workspaceRoot = "";
});

function writePublicationArtifacts(): string {
  workspaceRoot = mkdtempSync(
    join(tmpdir(), "cipher-wallet-changelog-publish-"),
  );
  const paths = changelogPaths(workspaceRoot);
  mkdirSync(paths.directory, { recursive: true });
  writeFileSync(paths.markdown, "# Changelog\n");
  writeFileSync(paths.pdf, "%PDF-1.4\n");
  return workspaceRoot;
}

function recordingRunner(calls: string[][]): CommandRunner {
  return async (_command, args): Promise<void> => {
    calls.push([...args]);
  };
}

test("publishes changelog artifacts to both project-scoped destinations", async () => {
  const root = writePublicationArtifacts();
  const paths = changelogPaths(root);
  const calls: string[][] = [];

  await publishChangelog({
    commandRunner: recordingRunner(calls),
    env: publicationEnvironment,
    workspaceRoot: root,
  });

  expect(calls).toEqual([
    [
      "s3",
      "sync",
      paths.directory,
      "s3://source-artifacts/source/projects/cipher-wallet/changelog/",
      "--delete",
    ],
    [
      "s3",
      "sync",
      paths.directory,
      "s3://live-artifacts/portfolio/projects/cipher-wallet/changelog/",
      "--delete",
    ],
    [
      "cloudfront",
      "create-invalidation",
      "--distribution-id",
      "distribution-123",
      "--paths",
      "/portfolio/projects/cipher-wallet/changelog/*",
    ],
  ]);
});

test("builds changelog artifacts before publishing them", async () => {
  workspaceRoot = mkdtempSync(
    join(tmpdir(), "cipher-wallet-changelog-publication-"),
  );
  writeFileSync(
    join(workspaceRoot, "package.json"),
    JSON.stringify({ version: "0.1.0-alpha.2" }),
  );
  writeFileSync(
    join(workspaceRoot, "CHANGELOG.md"),
    "## [0.1.0-alpha.2] - 2026-08-27\n\n- Published project artifacts.\n",
  );
  const paths = changelogPaths(workspaceRoot);
  const calls: string[][] = [];

  await publishChangelogPublication({
    commandRunner: recordingRunner(calls),
    env: { ARTIFACTS_BUCKET: "live-artifacts" },
    workspaceRoot,
  });

  expect(existsSync(paths.markdown)).toBe(true);
  expect(existsSync(paths.pdf)).toBe(true);
  expect(calls[0]).toEqual([
    "s3",
    "sync",
    paths.directory,
    "s3://live-artifacts/projects/cipher-wallet/changelog/",
    "--delete",
  ]);
});
