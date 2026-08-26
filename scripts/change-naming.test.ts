import { expect, test } from "bun:test";

import { isAllowedBranchName, isAllowedChangeTitle } from "./change-naming.ts";

test("accepts the Cipher Wallet branch convention", (): void => {
  expect(isAllowedBranchName("chore/shared-library-foundations")).toBe(true);
  expect(isAllowedBranchName("release/1.2.3-alpha.1")).toBe(true);
  expect(isAllowedBranchName("dependabot/bun/zod-4.5.0")).toBe(true);
  expect(isAllowedBranchName("feature/invalid-type")).toBe(false);
});

test("accepts the Cipher Wallet title convention", (): void => {
  expect(isAllowedChangeTitle("chore(contracts): add gateway contracts")).toBe(
    true,
  );
  expect(isAllowedChangeTitle("add gateway contracts")).toBe(false);
});
