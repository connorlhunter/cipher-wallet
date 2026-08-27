import { expect, test } from "bun:test";

import { publishReleaseArtifacts } from "./publish-release-artifacts";

test("builds both artifacts before uploads and invalidates only at the end", async (): Promise<void> => {
  const events: string[] = [];
  await publishReleaseArtifacts({
    commandRunner: async (_command, args): Promise<void> => {
      if (args[0] === "cloudfront") events.push("invalidate");
    },
    env: { ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID: "distribution-123" },
    updatedAt: "2026-08-27T00:00:00.000Z",
    workspaceRoot: "/workspace/cipher-wallet",
    dependencies: {
      buildChangelogArtifact: async (_root, updatedAt) => {
        events.push(`build-changelog:${updatedAt}`);
        return { directory: "", markdown: "", pdf: "" };
      },
      checkReleaseVersion: (root) => {
        events.push(`check:${root}`);
      },
      prepareCoveragePublication: async (_root, updatedAt) => {
        events.push(`build-coverage:${updatedAt}`);
        return { json: "", pdf: "", updatedAt: updatedAt ?? "" };
      },
      publishChangelog: async (options) => {
        expect(options.invalidate).toBe(false);
        events.push("publish-changelog");
      },
      publishCoverage: async (options) => {
        expect(options.invalidate).toBe(false);
        events.push("publish-coverage");
      },
    },
  });

  expect(events[0]).toBe("check:/workspace/cipher-wallet");
  expect(events.indexOf("publish-coverage")).toBeGreaterThan(
    events.indexOf("build-coverage:2026-08-27T00:00:00.000Z"),
  );
  expect(events.indexOf("publish-changelog")).toBeGreaterThan(
    events.indexOf("build-changelog:2026-08-27T00:00:00.000Z"),
  );
  expect(events.at(-1)).toBe("invalidate");
});

test("does not publish when either artifact build fails", async (): Promise<void> => {
  const events: string[] = [];
  let failure: unknown;
  try {
    await publishReleaseArtifacts({
      dependencies: {
        buildChangelogArtifact: async () => {
          throw new Error("changelog build failed");
        },
        checkReleaseVersion: () => undefined,
        prepareCoveragePublication: async () => {
          events.push("build-coverage");
          return { json: "", pdf: "", updatedAt: "" };
        },
        publishChangelog: async () => {
          events.push("publish-changelog");
        },
        publishCoverage: async () => {
          events.push("publish-coverage");
        },
      },
    });
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(Error);
  if (failure instanceof Error)
    expect(failure.message).toBe("changelog build failed");
  expect(events).toEqual(["build-coverage"]);
});
