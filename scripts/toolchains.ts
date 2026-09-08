import { readFileSync } from "node:fs";

/** Root manifest fields used to derive repository tool requirements. */
interface PackageManifest {
  packageManager?: string;
  toolchain?: {
    codeql?: string;
  };
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(label + " must be a non-empty string.");
  }
  return value;
}

function bunVersion(packageManager: string): string {
  const match = /^bun@(.+)$/u.exec(packageManager);
  if (match?.[1] === undefined) {
    throw new Error("package.json must pin Bun with packageManager.");
  }
  return match[1];
}

const packageManifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as PackageManifest;

/**
 * Toolchain requirements read from the repository's canonical manifests.
 *
 * Bun and CodeQL are exact pins. Python is a supported minimum version.
 */
export const requiredToolchains = Object.freeze({
  bun: bunVersion(requiredString(packageManifest.packageManager, "packageManager")),
  codeql: requiredString(packageManifest.toolchain?.codeql, "toolchain.codeql"),
  python: "3.12",
});
