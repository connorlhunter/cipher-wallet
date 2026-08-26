import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";

import {
  applyPinnedOverrides,
  applyReleaseAgeExcludes,
  syncDependencyPolicy,
} from "./sync-dependency-policy.ts";

describe("dependency policy sync", () => {
  test("applies sorted pins and removes stale overrides when the policy is empty", () => {
    const packageJson = JSON.stringify(
      {
        name: "cipher-wallet",
        overrides: { old: "1.0.0" },
      },
      null,
      2,
    );

    expect(
      applyPinnedOverrides(packageJson, {
        ws: { reason: "Fix a security advisory.", version: "8.21.0" },
        "tar-fs": { reason: "Fix a security advisory.", version: "2.1.4" },
      }),
    ).toBe(
      JSON.stringify(
        {
          name: "cipher-wallet",
          overrides: { "tar-fs": "2.1.4", ws: "8.21.0" },
        },
        null,
        2,
      ) + "\n",
    );

    expect(applyPinnedOverrides(packageJson, {})).toBe(
      JSON.stringify({ name: "cipher-wallet" }, null, 2) + "\n",
    );
  });

  test("adds, sorts, and removes reviewed release-age exceptions", () => {
    const bunfig =
      '[install]\nminimumReleaseAge = 604800\n\n[test]\ncoverageDir = "coverage"\n';

    expect(applyReleaseAgeExcludes(bunfig, ["ws", "mermaid"])).toBe(
      '[install]\nminimumReleaseAge = 604800\nminimumReleaseAgeExcludes = ["mermaid","ws"]\n\n[test]\ncoverageDir = "coverage"\n',
    );
    expect(
      applyReleaseAgeExcludes(
        '[install]\nminimumReleaseAge = 604800\nminimumReleaseAgeExcludes = ["mermaid"]\n\n[test]\ncoverageDir = "coverage"\n',
        [],
      ),
    ).toBe(bunfig);
  });

  test("checks and synchronizes the policy files in an isolated repository", () => {
    const root = mkdtempSync(
      join(tmpdir(), "cipher-wallet-dependency-policy-"),
    );

    try {
      writeFileSync(
        root + "/package.json",
        JSON.stringify({ name: "cipher-wallet" }, null, 2) + "\n",
      );
      writeFileSync(
        root + "/bunfig.toml",
        "[install]\nminimumReleaseAge = 604800\n",
      );
      writeFileSync(
        root + "/dependency-policy.toml",
        `[pins.ws]
version = "8.21.0"
reason = "Fix a security advisory."

[releaseAgeExcludes.ws]
reason = "Allow a reviewed fix before the seven-day release-age window."
`,
      );

      expect(() => syncDependencyPolicy({ checkOnly: true, root })).toThrow(
        "Dependency policy is out of sync",
      );
      expect(syncDependencyPolicy({ root })).toBe(true);
      expect(syncDependencyPolicy({ checkOnly: true, root })).toBe(false);
      expect(
        JSON.parse(readFileSync(root + "/package.json", "utf8")),
      ).toMatchObject({
        overrides: { ws: "8.21.0" },
      });
      expect(readFileSync(root + "/bunfig.toml", "utf8")).toContain(
        'minimumReleaseAgeExcludes = ["ws"]',
      );
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });
});
