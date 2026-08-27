import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "bun:test";
import { buildChangelogArtifact, parseChangelog } from "./changelog-artifact";

let workspaceRoot = "";

afterEach(() => {
  if (workspaceRoot) rmSync(workspaceRoot, { force: true, recursive: true });
  workspaceRoot = "";
});

function writeReleaseSource(version = "0.1.0-alpha.2"): string {
  workspaceRoot = mkdtempSync(join(tmpdir(), "cipher-wallet-changelog-"));
  writeFileSync(
    join(workspaceRoot, "package.json"),
    JSON.stringify({ version }),
  );
  writeFileSync(
    join(workspaceRoot, "CHANGELOG.md"),
    `# Changelog\n\n## [${version}] - 2026-08-27\n\n### Added\n\n- Published project artifacts.\n\n## [0.1.0-alpha.1] - 2026-08-26\n\n- Foundation release.\n`,
  );
  return workspaceRoot;
}

test("parses canonical releases and their sections", () => {
  expect(
    parseChangelog(
      "## [1.2.0] - 2026-08-27\n\n### Added\n\n- First item\n\n- Second item\n",
    ),
  ).toEqual([
    {
      date: "2026-08-27",
      sections: [{ entries: ["First item", "Second item"], title: "Added" }],
      version: "1.2.0",
    },
  ]);
});

test("builds Markdown and PDF artifacts from the canonical changelog", async () => {
  const root = writeReleaseSource();
  const paths = await buildChangelogArtifact(root, "2026-08-27T16:00:00.000Z");

  expect(readFileSync(paths.markdown, "utf8")).toBe(
    readFileSync(join(root, "CHANGELOG.md"), "utf8"),
  );
  expect(readFileSync(paths.pdf).subarray(0, 4).toString()).toBe("%PDF");
});

test("refuses a changelog whose newest release differs from package.json", async () => {
  const root = writeReleaseSource("0.1.0-alpha.2");
  writeFileSync(
    join(root, "CHANGELOG.md"),
    "## [0.1.0-alpha.1] - 2026-08-26\n",
  );

  await expect(buildChangelogArtifact(root)).rejects.toThrow(
    "CHANGELOG.md must begin with 0.1.0-alpha.2.",
  );
});
