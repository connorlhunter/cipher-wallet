import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "bun:test";
import { coveragePaths } from "../coverage/coverage-paths";
import {
  coveragePublishDestinations,
  publishCoverage,
} from "./publish-coverage";
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

function recordingRunner(calls: string[][]): CommandRunner {
  return async (_command, args): Promise<void> => {
    calls.push([...args]);
  };
}

test("builds project-scoped coverage destinations", () => {
  expect(
    coveragePublishDestinations(
      publicationEnvironment,
      "/workspace/cipher-wallet",
    ),
  ).toEqual([
    {
      label: "Source coverage copy",
      source: join("/workspace/cipher-wallet", "coverage"),
      target: "s3://source-artifacts/source/projects/cipher-wallet/coverage/",
    },
    {
      label: "Live coverage artifact",
      source: join("/workspace/cipher-wallet", "coverage"),
      target: "s3://live-artifacts/portfolio/projects/cipher-wallet/coverage/",
    },
  ]);
});

test("publishes the JSON/PDF coverage pair and invalidates the project path", async () => {
  workspaceRoot = mkdtempSync(
    join(tmpdir(), "cipher-wallet-coverage-publish-"),
  );
  const paths = coveragePaths(workspaceRoot);
  mkdirSync(paths.directory, { recursive: true });
  writeFileSync(paths.json, "{}\n");
  writeFileSync(paths.pdf, "%PDF-1.4\n");
  const calls: string[][] = [];

  await publishCoverage({
    commandRunner: recordingRunner(calls),
    env: publicationEnvironment,
    workspaceRoot,
  });

  expect(calls).toEqual([
    [
      "s3",
      "sync",
      paths.directory,
      "s3://source-artifacts/source/projects/cipher-wallet/coverage/",
      "--delete",
    ],
    [
      "s3",
      "sync",
      paths.directory,
      "s3://live-artifacts/portfolio/projects/cipher-wallet/coverage/",
      "--delete",
    ],
    [
      "cloudfront",
      "create-invalidation",
      "--distribution-id",
      "distribution-123",
      "--paths",
      "/portfolio/projects/cipher-wallet/coverage/*",
    ],
  ]);
});
