import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { expect, test } from "bun:test";

import {
  coverageInvalidations,
  coveragePublishDestinations,
  publishCoverage,
} from "./publish-coverage";
import { coveragePaths } from "../coverage/coverage-paths";

const publicationEnvironment: NodeJS.ProcessEnv = {
  ARTIFACTS_BUCKET: "live-artifacts",
  ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID: "distribution-123",
  ARTIFACTS_PREFIX: "portfolio",
  SOURCE_ARTIFACTS_BUCKET: "source-artifacts",
  SOURCE_ARTIFACTS_PREFIX: "source",
};

test("builds project-scoped coverage destinations", (): void => {
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

test("builds a project-scoped coverage invalidation", (): void => {
  expect(coverageInvalidations(publicationEnvironment)).toEqual([
    {
      distributionId: "distribution-123",
      path: "/portfolio/projects/cipher-wallet/coverage/*",
    },
  ]);
});

test("excludes and removes temporary coverage files during publication", async (): Promise<void> => {
  const workspaceRoot = mkdtempSync(
    join(tmpdir(), "cipher-wallet-coverage-publish-"),
  );
  const paths = coveragePaths(workspaceRoot);
  const requiredFiles = [
    paths.overview.html,
    paths.overview.pdf,
    paths.typescript.html,
    paths.typescript.pdf,
    paths.python.html,
    paths.python.pdf,
  ];
  for (const path of requiredFiles) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, "coverage");
  }

  const commands: Array<readonly string[]> = [];
  await publishCoverage({
    commandRunner: async (_command, args): Promise<void> => {
      commands.push(args);
    },
    env: publicationEnvironment,
    workspaceRoot,
  });

  expect(commands).toContainEqual([
    "s3",
    "sync",
    paths.directory,
    "s3://source-artifacts/source/projects/cipher-wallet/coverage/",
    "--delete",
    "--exclude",
    ".*.tmp",
  ]);
  expect(commands).toContainEqual([
    "s3",
    "rm",
    "s3://live-artifacts/portfolio/projects/cipher-wallet/coverage/",
    "--recursive",
    "--exclude",
    "*",
    "--include",
    ".*.tmp",
  ]);
});
