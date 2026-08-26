import { coveragePaths } from "./coverage-paths";
import {
  renderCoveragePdfs,
  type RenderCoveragePdfsOptions,
  type RenderedCoveragePdfs,
} from "./render-coverage-pdf";
import {
  coverageUpdatedAt,
  renderCoverageReport,
} from "./render-coverage-report";

/** Files and timestamp prepared immediately before coverage publication. */
export interface PreparedCoveragePublication {
  readonly html: {
    readonly overview: string;
    readonly python: string;
    readonly typescript: string;
  };
  readonly pdf: RenderedCoveragePdfs;
  readonly updatedAt: string;
}

/** Optional collaborators for coverage publication preparation. */
export interface PrepareCoveragePublicationOptions {
  readonly renderPdfs?: (
    workspaceRoot?: string,
    options?: RenderCoveragePdfsOptions,
  ) => Promise<RenderedCoveragePdfs>;
}

/**
 * Stamp every coverage page and render matching PDFs.
 *
 * @param workspaceRoot Repository root containing coverage inputs.
 * @param updatedAt ISO timestamp applied to every page.
 * @param options Optional renderer override for tests and automation.
 * @returns Paths and timestamp ready for publication.
 */
export async function prepareCoveragePublication(
  workspaceRoot = process.cwd(),
  updatedAt = new Date().toISOString(),
  options: PrepareCoveragePublicationOptions = {},
): Promise<PreparedCoveragePublication> {
  const paths = coveragePaths(workspaceRoot);
  const publicationDate = coverageUpdatedAt(updatedAt);
  renderCoverageReport(
    paths.typescriptLcov,
    paths.pythonLcov,
    paths.directory,
    publicationDate,
  );
  const pdf = await (options.renderPdfs ?? renderCoveragePdfs)(workspaceRoot);

  console.log(`Prepared coverage publication: ${publicationDate}`);

  return {
    html: {
      overview: paths.overview.html,
      python: paths.python.html,
      typescript: paths.typescript.html,
    },
    pdf,
    updatedAt: publicationDate,
  };
}

/**
 * Run coverage preparation and report a non-sensitive CLI failure.
 *
 * @param prepare Optional preparation callback for tests.
 * @param errorLog Destination for a safe failure message.
 * @returns `true` when preparation completes.
 */
export async function prepareCoveragePublicationCli(
  prepare: (() => Promise<unknown>) | undefined = undefined,
  errorLog: (message: string) => void = console.error,
): Promise<boolean> {
  try {
    await (prepare ?? prepareCoveragePublication)();
    return true;
  } catch (error) {
    errorLog(error instanceof Error ? error.message : String(error));
    return false;
  }
}

if (import.meta.main) {
  if (!(await prepareCoveragePublicationCli())) process.exit(1);
}
