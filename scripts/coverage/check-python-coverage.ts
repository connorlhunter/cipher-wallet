import { assertCoverageFile } from "./assert-coverage";

/** Validate the Python LCOV report against the shared coverage floor. */
assertCoverageFile("coverage/python.lcov", "Python");
