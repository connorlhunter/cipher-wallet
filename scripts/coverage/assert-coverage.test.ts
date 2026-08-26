import { expect, test } from "bun:test";

import { assertCoverageThreshold, coverageTotals } from "./assert-coverage";

const passingLcov = [
  "SF:src/example.ts",
  "FNF:20",
  "FNH:19",
  "LF:100",
  "LH:98",
  "end_of_record",
].join("\n");

test("calculates line and function totals from LCOV", (): void => {
  expect(coverageTotals(passingLcov)).toEqual({
    functions: { covered: 19, found: 20 },
    lines: { covered: 98, found: 100 },
  });
  expect(assertCoverageThreshold(passingLcov, "TypeScript")).toEqual({
    functions: { covered: 19, found: 20 },
    lines: { covered: 98, found: 100 },
  });
});

test("reports the surface and failing metrics", (): void => {
  expect((): void => {
    assertCoverageThreshold(
      [
        "SF:src/example.py",
        "FNF:20",
        "FNH:18",
        "LF:100",
        "LH:94",
        "end_of_record",
      ].join("\n"),
      "Python",
    );
  }).toThrow(
    "Python coverage threshold failed: functions 90.00% < 95.00%, lines 94.00% < 95.00%",
  );
});
