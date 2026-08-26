import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TOML } from "bun";

const packageJsonFile = "package.json";
const bunfigFile = "bunfig.toml";
const dependencyPolicyFile = "dependency-policy.toml";

export interface DependencyPin {
  reason: string;
  version: string;
}

export interface ReleaseAgeExclude {
  reason: string;
}

export type DependencyPins = Record<string, DependencyPin>;
export type ReleaseAgeExcludes = Record<string, ReleaseAgeExclude>;

interface DependencyPolicy {
  pins: DependencyPins;
  releaseAgeExcludes: ReleaseAgeExcludes;
}

interface PackageJson {
  overrides?: Record<string, string>;
  [key: string]: unknown;
}

function parseObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(label + " must be a TOML table.");
  }
  return value as Record<string, unknown>;
}

function parsePinTable(value: unknown): DependencyPins {
  return Object.fromEntries(
    Object.entries(parseObject(value, "pins")).map(([name, pin]) => {
      const entry = parseObject(pin, "pins." + name);
      if (
        typeof entry.version !== "string" ||
        typeof entry.reason !== "string"
      ) {
        throw new Error(
          "pins." + name + " must contain string version and reason values.",
        );
      }
      return [name, { reason: entry.reason, version: entry.version }];
    }),
  );
}

function parseReleaseAgeExcludeTable(value: unknown): ReleaseAgeExcludes {
  return Object.fromEntries(
    Object.entries(parseObject(value, "releaseAgeExcludes")).map(
      ([name, exclude]) => {
        const entry = parseObject(exclude, "releaseAgeExcludes." + name);
        if (typeof entry.reason !== "string") {
          throw new Error(
            "releaseAgeExcludes." +
              name +
              " must contain a string reason value.",
          );
        }
        return [name, { reason: entry.reason }];
      },
    ),
  );
}

function parsePolicy(contents: string): DependencyPolicy {
  const parsed = parseObject(TOML.parse(contents), dependencyPolicyFile);
  return {
    pins: parsePinTable(parsed.pins ?? {}),
    releaseAgeExcludes: parseReleaseAgeExcludeTable(
      parsed.releaseAgeExcludes ?? {},
    ),
  };
}

function parsePackageJson(contents: string): PackageJson {
  try {
    return JSON.parse(contents) as PackageJson;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error("Unable to parse " + packageJsonFile + ": " + detail);
  }
}

/**
 * Apply reviewed exact JavaScript overrides to package.json.
 *
 * @param packageJson Current package.json contents.
 * @param pins Approved package versions keyed by package name.
 * @returns Formatted package.json contents with matching overrides.
 * @throws {Error} When packageJson is invalid JSON.
 */
export function applyPinnedOverrides(
  packageJson: string,
  pins: DependencyPins,
): string {
  const parsed = parsePackageJson(packageJson);
  const entries = Object.entries(pins)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, pin]) => [name, pin.version]);

  if (entries.length === 0) {
    delete parsed.overrides;
  } else {
    parsed.overrides = Object.fromEntries(entries);
  }

  return JSON.stringify(parsed, null, 2) + "\n";
}

/**
 * Apply reviewed Bun release-age exceptions to bunfig.toml.
 *
 * @param bunfig Current bunfig.toml contents.
 * @param excludes Package names approved to bypass the release-age delay.
 * @returns bunfig.toml contents with matching exclusions.
 */
export function applyReleaseAgeExcludes(
  bunfig: string,
  excludes: string[],
): string {
  const withoutExistingExcludes = bunfig.replace(
    /^minimumReleaseAgeExcludes\s*=.*\n?/mu,
    "",
  );
  const sortedExcludes = [...excludes].sort((left, right) =>
    left.localeCompare(right),
  );
  if (sortedExcludes.length === 0) return withoutExistingExcludes;

  const excludesLine =
    "minimumReleaseAgeExcludes = " + JSON.stringify(sortedExcludes) + "\n";
  if (/^minimumReleaseAge\s*=.*$/mu.test(withoutExistingExcludes)) {
    return withoutExistingExcludes.replace(
      /^(minimumReleaseAge\s*=.*\n)/mu,
      "$1" + excludesLine,
    );
  }

  return withoutExistingExcludes.trimEnd() + "\n" + excludesLine;
}

export interface SyncDependencyPolicyOptions {
  checkOnly?: boolean;
  root?: string;
}

/**
 * Sync the reviewed dependency policy into package-manager configuration.
 *
 * @param options Select check-only mode or a repository root.
 * @returns `true` when sync mode changed configuration files.
 * @throws {Error} When the policy is invalid or check-only mode finds drift.
 */
export function syncDependencyPolicy(
  options: SyncDependencyPolicyOptions = {},
): boolean {
  const root = options.root ?? process.cwd();
  const policy = parsePolicy(
    readFileSync(join(root, dependencyPolicyFile), "utf8"),
  );
  const packageJsonPath = join(root, packageJsonFile);
  const bunfigPath = join(root, bunfigFile);
  const packageJson = readFileSync(packageJsonPath, "utf8");
  const bunfig = readFileSync(bunfigPath, "utf8");
  const nextPackageJson = applyPinnedOverrides(packageJson, policy.pins);
  const nextBunfig = applyReleaseAgeExcludes(
    bunfig,
    Object.keys(policy.releaseAgeExcludes),
  );
  const changedPaths: string[] = [];

  if (nextPackageJson !== packageJson) changedPaths.push(packageJsonFile);
  if (nextBunfig !== bunfig) changedPaths.push(bunfigFile);

  if (options.checkOnly) {
    if (changedPaths.length > 0) {
      throw new Error(
        "Dependency policy is out of sync. Run bun run deps:policy. Changed files: " +
          changedPaths.join(", "),
      );
    }
    return false;
  }

  if (nextPackageJson !== packageJson)
    writeFileSync(packageJsonPath, nextPackageJson);
  if (nextBunfig !== bunfig) writeFileSync(bunfigPath, nextBunfig);
  return changedPaths.length > 0;
}

if (import.meta.main) {
  try {
    const changed = syncDependencyPolicy({
      checkOnly: process.argv.includes("--check"),
    });
    console.log(
      changed
        ? "Synced dependency policy."
        : "Dependency policy already in sync.",
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown dependency policy failure.";
    console.error("Dependency policy check failed: " + message);
    process.exitCode = 1;
  }
}
