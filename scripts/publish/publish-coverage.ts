import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

import { coveragePaths } from "../coverage/coverage-paths";
import { prepareCoveragePublication } from "../coverage/prepare-coverage-publication";

const projectSlug = "cipher-wallet";
const temporaryCoveragePattern = ".*.tmp";

export interface CoveragePublishDestination {
  readonly label: string;
  readonly source: string;
  readonly target: string;
}

export interface CoverageInvalidation {
  readonly distributionId: string;
  readonly path: string;
}

export type CommandRunner = (
  command: string,
  args: ReadonlyArray<string>,
  subject: string,
) => Promise<void>;

export interface PublishCoverageOptions {
  readonly commandRunner?: CommandRunner;
  readonly env?: NodeJS.ProcessEnv;
  readonly workspaceRoot?: string;
}

export interface PublishCoveragePublicationOptions extends PublishCoverageOptions {
  readonly updatedAt?: string;
}

/** Normalizes an optional environment value. */
function envValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** Joins S3 or CloudFront path parts without duplicate separators. */
function keyPath(...parts: ReadonlyArray<string>): string {
  return parts
    .map((part) => part.trim().replace(/^\/+|\/+$/gu, ""))
    .filter(Boolean)
    .join("/");
}

/** Returns an S3 URI with one trailing slash. */
function s3Uri(bucket: string, key: string): string {
  return key ? `s3://${bucket}/${key}/` : `s3://${bucket}/`;
}

/**
 * Build the optional durable-source and live destinations for coverage.
 *
 * @param env Publication environment values.
 * @param workspaceRoot Repository root containing coverage output.
 * @returns S3 destinations for generated coverage artifacts.
 * @throws {Error} When no configured artifact bucket is available.
 */
export function coveragePublishDestinations(
  env: NodeJS.ProcessEnv = process.env,
  workspaceRoot = process.cwd(),
): CoveragePublishDestination[] {
  const source = coveragePaths(workspaceRoot).directory;
  const destinations: CoveragePublishDestination[] = [];
  const sourceBucket = envValue(env.SOURCE_ARTIFACTS_BUCKET);
  const artifactsBucket = envValue(env.ARTIFACTS_BUCKET);

  if (sourceBucket) {
    destinations.push({
      label: "Source coverage copy",
      source,
      target: s3Uri(
        sourceBucket,
        keyPath(
          envValue(env.SOURCE_ARTIFACTS_PREFIX),
          "projects",
          projectSlug,
          "coverage",
        ),
      ),
    });
  }

  if (artifactsBucket) {
    destinations.push({
      label: "Live coverage artifact",
      source,
      target: s3Uri(
        artifactsBucket,
        keyPath(
          envValue(env.ARTIFACTS_PREFIX),
          "projects",
          projectSlug,
          "coverage",
        ),
      ),
    });
  }

  if (destinations.length === 0) {
    throw new Error(
      "Missing SOURCE_ARTIFACTS_BUCKET or ARTIFACTS_BUCKET for Cipher Wallet coverage publication.",
    );
  }

  return destinations;
}

/**
 * Build the project-scoped CloudFront invalidation.
 *
 * @param env Publication environment values.
 * @returns An empty list when no distribution is configured.
 */
export function coverageInvalidations(
  env: NodeJS.ProcessEnv = process.env,
): CoverageInvalidation[] {
  const distributionId = envValue(env.ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID);

  return distributionId
    ? [
        {
          distributionId,
          path: `/${keyPath(envValue(env.ARTIFACTS_PREFIX), "projects", projectSlug, "coverage", "*")}`,
        },
      ]
    : [];
}

/**
 * Run one publication command and include its output in failures.
 *
 * @param command Executable to run without a shell.
 * @param args Exact arguments passed to the executable.
 * @param subject Safe label included in failure messages.
 * @returns A promise that resolves only when the command succeeds.
 */
export const defaultCommandRunner: CommandRunner = (command, args, subject) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error: Error) => {
      reject(new Error(`${subject} failed: ${error.message}`));
    });
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          [
            `${subject} failed with exit code ${code ?? "unknown"}.`,
            stdout.trim(),
            stderr.trim(),
          ]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });

/**
 * Upload prepared coverage files to Cipher Wallet's project prefix.
 *
 * @param options Optional environment, command runner, and workspace root.
 * @returns A promise that resolves after uploads and invalidation finish.
 * @throws {Error} When generated coverage files or publication settings are missing.
 */
export async function publishCoverage(
  options: PublishCoverageOptions = {},
): Promise<void> {
  const env = options.env ?? process.env;
  const commandRunner = options.commandRunner ?? defaultCommandRunner;
  const paths = coveragePaths(options.workspaceRoot);
  const requiredFiles = [
    paths.overview.html,
    paths.overview.pdf,
    paths.typescript.html,
    paths.typescript.pdf,
    paths.python.html,
    paths.python.pdf,
  ];

  if (requiredFiles.some((path) => !existsSync(path))) {
    throw new Error(
      "Missing Cipher Wallet coverage HTML or PDF output. Prepare coverage first.",
    );
  }

  for (const destination of coveragePublishDestinations(
    env,
    options.workspaceRoot,
  )) {
    console.log(`Publishing ${destination.label}: ${destination.target}`);
    await commandRunner(
      "aws",
      [
        "s3",
        "sync",
        destination.source,
        destination.target,
        "--delete",
        "--exclude",
        temporaryCoveragePattern,
      ],
      destination.label,
    );
    await commandRunner(
      "aws",
      [
        "s3",
        "rm",
        destination.target,
        "--recursive",
        "--exclude",
        "*",
        "--include",
        temporaryCoveragePattern,
      ],
      `Remove temporary files from ${destination.label}`,
    );
  }

  for (const invalidation of coverageInvalidations(env)) {
    await commandRunner(
      "aws",
      [
        "cloudfront",
        "create-invalidation",
        "--distribution-id",
        invalidation.distributionId,
        "--paths",
        invalidation.path,
      ],
      "Coverage CloudFront invalidation",
    );
  }

  console.log("Published Cipher Wallet coverage artifacts.");
}

/**
 * Create one timestamp, render every page and PDF, then publish them.
 *
 * @param options Optional timestamp and publication collaborators.
 * @returns A promise that resolves when the publication is complete.
 */
export async function publishCoveragePublication(
  options: PublishCoveragePublicationOptions = {},
): Promise<void> {
  await prepareCoveragePublication(options.workspaceRoot, options.updatedAt);
  await publishCoverage(options);
}

if (import.meta.main) {
  try {
    await publishCoveragePublication();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
