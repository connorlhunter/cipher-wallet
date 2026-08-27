import { resolve } from "node:path";

/** Fixed coverage inputs and published artifacts beneath a Cipher Wallet checkout. */
export interface CoveragePaths {
  readonly directory: string;
  readonly json: string;
  readonly pdf: string;
  readonly pythonLcov: string;
  readonly typescriptLcov: string;
}

/** Resolves coverage inputs and the JSON/PDF publication pair. */
export function coveragePaths(workspaceRoot = process.cwd()): CoveragePaths {
  const directory = resolve(workspaceRoot, "coverage");
  return {
    directory,
    json: resolve(directory, "index.json"),
    pdf: resolve(directory, "coverage.pdf"),
    pythonLcov: resolve(directory, "python.lcov"),
    typescriptLcov: resolve(directory, "lcov.info"),
  };
}
