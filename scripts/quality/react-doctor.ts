import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const environment = { ...process.env };

// Git hooks pin commands to the repository root. Let Git rediscover the worktree
// when React Doctor enumerates files from the nested browser application.
for (const name of ["GIT_DIR", "GIT_WORK_TREE", "GIT_COMMON_DIR", "GIT_PREFIX"]) {
  delete environment[name];
}

const result = spawnSync(
  "react-doctor",
  ["apps/web", "--yes", "--no-telemetry", "--no-supply-chain", ...process.argv.slice(2)],
  { cwd: repositoryRoot, env: environment, stdio: "inherit" },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
