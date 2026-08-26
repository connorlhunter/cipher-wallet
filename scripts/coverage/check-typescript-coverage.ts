import { assertCoverageFile } from "./assert-coverage";

/** Validate the TypeScript LCOV report against the shared coverage floor. */
assertCoverageFile("coverage/lcov.info", "TypeScript");
