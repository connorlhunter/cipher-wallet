import { coveragePaths } from "./coverage-paths";
import { renderCoveragePdfs } from "./render-coverage-pdf";
import {
  coverageUpdatedAt,
  renderCoverageReport,
} from "./render-coverage-report";

export interface PreparedCoveragePublication {
  readonly json: string;
  readonly pdf: string;
  readonly updatedAt: string;
}
/** Builds Cipher Wallet's JSON/PDF coverage pair before publishing. */
export async function prepareCoveragePublication(
  workspaceRoot = process.cwd(),
  updatedAt = new Date().toISOString(),
): Promise<PreparedCoveragePublication> {
  const paths = coveragePaths(workspaceRoot);
  const publicationDate = coverageUpdatedAt(updatedAt);
  const json = renderCoverageReport(
    paths.typescriptLcov,
    paths.pythonLcov,
    paths.directory,
    publicationDate,
  );
  const { overview: pdf } = await renderCoveragePdfs(workspaceRoot);
  return { json, pdf, updatedAt: publicationDate };
}
if (import.meta.main) {
  try {
    await prepareCoveragePublication();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
