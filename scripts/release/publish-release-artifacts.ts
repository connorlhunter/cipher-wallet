import { buildChangelogArtifact } from "../changelog/changelog-artifact";
import { prepareCoveragePublication } from "../coverage/prepare-coverage-publication";
import {
  publishChangelog,
  type PublishChangelogOptions,
} from "../publish/publish-changelog";
import {
  publishCoverage,
  type PublishCoverageOptions,
} from "../publish/publish-coverage";
import {
  defaultCommandRunner,
  type CommandRunner,
} from "../publish/command-runner";
import { checkReleaseVersion } from "./check-release-version";

export interface ReleasePublicationDependencies {
  readonly buildChangelogArtifact: typeof buildChangelogArtifact;
  readonly checkReleaseVersion: typeof checkReleaseVersion;
  readonly prepareCoveragePublication: typeof prepareCoveragePublication;
  readonly publishChangelog: (
    options: PublishChangelogOptions,
  ) => Promise<void>;
  readonly publishCoverage: (options: PublishCoverageOptions) => Promise<void>;
}

export interface PublishReleaseArtifactsOptions {
  readonly commandRunner?: CommandRunner;
  readonly dependencies?: Partial<ReleasePublicationDependencies>;
  readonly env?: NodeJS.ProcessEnv;
  readonly updatedAt?: string;
  readonly workspaceRoot?: string;
}

const defaultDependencies: ReleasePublicationDependencies = {
  buildChangelogArtifact,
  checkReleaseVersion,
  prepareCoveragePublication,
  publishChangelog,
  publishCoverage,
};

/** Builds both artifacts before upload and invalidates both paths at the end. */
export async function publishReleaseArtifacts(
  options: PublishReleaseArtifactsOptions = {},
): Promise<void> {
  const dependencies = { ...defaultDependencies, ...options.dependencies };
  const workspaceRoot = options.workspaceRoot ?? process.cwd();
  const updatedAt = options.updatedAt ?? new Date().toISOString();
  const env = options.env ?? process.env;
  const commandRunner = options.commandRunner ?? defaultCommandRunner;
  dependencies.checkReleaseVersion(workspaceRoot);
  await Promise.all([
    dependencies.prepareCoveragePublication(workspaceRoot, updatedAt),
    dependencies.buildChangelogArtifact(workspaceRoot, updatedAt),
  ]);
  await dependencies.publishCoverage({
    commandRunner,
    env,
    invalidate: false,
    workspaceRoot,
  });
  await dependencies.publishChangelog({
    commandRunner,
    env,
    invalidate: false,
    workspaceRoot,
  });
  await invalidateReleaseArtifacts(env, commandRunner);
}

async function invalidateReleaseArtifacts(
  env: NodeJS.ProcessEnv,
  commandRunner: CommandRunner,
): Promise<void> {
  const distributionId = envValue(env.ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID);
  if (!distributionId) return;
  const prefix = envValue(env.ARTIFACTS_PREFIX);
  await commandRunner(
    "aws",
    [
      "cloudfront",
      "create-invalidation",
      "--distribution-id",
      distributionId,
      "--paths",
      `/${keyPath(prefix, "projects", "cipher-wallet", "coverage", "*")}`,
      `/${keyPath(prefix, "projects", "cipher-wallet", "changelog", "*")}`,
    ],
    "Release artifact CloudFront invalidation",
  );
}

function envValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

function keyPath(...parts: ReadonlyArray<string>): string {
  return parts
    .map((part) => part.trim().replace(/^\/+|\/+$/gu, ""))
    .filter(Boolean)
    .join("/");
}

if (import.meta.main) {
  try {
    await publishReleaseArtifacts();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
