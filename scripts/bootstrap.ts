/** Run one required bootstrap command and stop on failure.
 *
 * @param command Executable available on the developer's PATH.
 * @param arguments_ Arguments passed directly to the executable.
 * @throws {Error} When the command exits unsuccessfully.
 */
function runCommand(command: string, arguments_: readonly string[]): void {
  const result = Bun.spawnSync([command, ...arguments_], {
    stderr: "inherit",
    stdout: "inherit",
  });

  if (result.exitCode !== 0) {
    throw new Error("Failed to run " + command + " " + arguments_.join(" ") + ".");
  }
}

runCommand("bun", ["install"]);
runCommand("uv", ["sync", "--all-groups"]);
runCommand("bun", ["run", "hooks:setup"]);
