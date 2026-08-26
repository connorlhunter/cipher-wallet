import { requiredToolchains } from "./toolchains.ts";

/**
 * Read the version reported by a required executable.
 *
 * @param command Executable available on PATH.
 * @param arguments_ Arguments used to request its version.
 * @returns The trimmed version output.
 * @throws {Error} When the executable cannot run successfully.
 */
function commandVersion(
  command: string,
  arguments_: readonly string[],
): string {
  const result = Bun.spawnSync([command, ...arguments_], {
    stderr: "pipe",
    stdout: "pipe",
  });

  if (result.exitCode !== 0) {
    throw new Error(
      command + " is required. Install the documented toolchain and try again.",
    );
  }

  return new TextDecoder().decode(result.stdout).trim();
}

/**
 * Require the supported Python major and minimum minor version.
 *
 * @param versionOutput Output from `python3 --version`.
 * @throws {Error} When the installed Python version is unsupported.
 */
function assertPythonVersion(versionOutput: string): void {
  const match = /^Python (?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$/u.exec(
    versionOutput,
  );
  const major = Number(match?.groups?.major);
  const minor = Number(match?.groups?.minor);

  if (!match || major !== 3 || minor < 12) {
    throw new Error(
      "Cipher Wallet requires Python " +
        requiredToolchains.python +
        "+; found " +
        versionOutput +
        ".",
    );
  }
}

if (!Bun.semver.satisfies(Bun.version, requiredToolchains.bun)) {
  throw new Error(
    "Cipher Wallet requires Bun " +
      requiredToolchains.bun +
      "; found " +
      Bun.version +
      ".",
  );
}

const pythonVersion = commandVersion("python3", ["--version"]);
assertPythonVersion(pythonVersion);

console.log("Bun " + Bun.version);
console.log(pythonVersion);
