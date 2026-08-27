import { readFileSync } from "node:fs";
import { join } from "node:path";

const packageManifests = [
  "package.json",
  "apps/web/package.json",
  "packages/typescript/wallet-contracts/package.json",
] as const;
const pythonManifests = [
  "pyproject.toml",
  "packages/python/cipher-wallet-core/pyproject.toml",
] as const;
const releaseHeading = /^##\s+\[?([^\]\s]+)\]?\s+-\s+\d{4}-\d{2}-\d{2}\s*$/mu;

/** Requires every shipped version declaration to match the changelog release. */
export function checkReleaseVersion(workspaceRoot = process.cwd()): void {
  const version = packageVersion(join(workspaceRoot, packageManifests[0]));
  const changelog = readFileSync(join(workspaceRoot, "CHANGELOG.md"), "utf8");
  const changelogVersion = releaseHeading.exec(changelog)?.[1];
  if (changelogVersion !== version)
    throw new Error(
      "CHANGELOG.md must begin with the package.json release version.",
    );
  for (const manifest of packageManifests.slice(1))
    assertVersion(
      manifest,
      packageVersion(join(workspaceRoot, manifest)),
      version,
    );
  const pythonVersion = pythonReleaseVersion(version);
  for (const manifest of pythonManifests)
    assertVersion(
      manifest,
      assignedVersion(join(workspaceRoot, manifest)),
      pythonVersion,
    );
}

/** Converts the repository's npm release format to its Python counterpart. */
export function pythonReleaseVersion(version: string): string {
  const match = /^(\d+\.\d+\.\d+)(?:-(alpha|beta|rc)\.(\d+))?$/u.exec(version);
  if (!match) throw new Error(`Unsupported release version: ${version}.`);
  const prerelease = match[2];
  if (!prerelease) return match[1] ?? version;
  const suffix = { alpha: "a", beta: "b", rc: "rc" }[prerelease];
  return `${match[1]}${suffix}${match[3]}`;
}

function packageVersion(path: string): string {
  const packageJson = JSON.parse(readFileSync(path, "utf8")) as {
    version?: unknown;
  };
  if (typeof packageJson.version !== "string")
    throw new Error(`${path} must contain a release version.`);
  return packageJson.version;
}

function assignedVersion(path: string): string {
  const version = /^version\s*=\s*"([^"]+)"\s*$/mu.exec(
    readFileSync(path, "utf8"),
  )?.[1];
  if (!version) throw new Error(`${path} must contain a release version.`);
  return version;
}

function assertVersion(path: string, actual: string, expected: string): void {
  if (actual !== expected)
    throw new Error(`${path} must use release version ${expected}.`);
}

if (import.meta.main) checkReleaseVersion();
