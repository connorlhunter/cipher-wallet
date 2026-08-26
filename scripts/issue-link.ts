const issueReferencePattern = new RegExp(
  "\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|related\\s+to|track(?:s|ed)?|implement(?:s|ed)?|reference(?:s|d)?|refer(?:s|red)?\\s+to)\\s+(?:(?:connorlhunter/cipher-wallet)?#\\d+|https://github\\.com/connorlhunter/cipher-wallet/issues/\\d+)\\b",
  "iu",
);
const dependabotLogin = "dependabot[bot]";

type Environment = Readonly<Record<string, string | undefined>>;

/**
 * Check whether a pull request body links a Cipher Wallet issue.
 *
 * @param pullRequestBody Pull request description to inspect.
 * @returns `true` when a recognized issue reference is present.
 */
export function hasLinkedIssue(pullRequestBody: string): boolean {
  return issueReferencePattern.test(pullRequestBody);
}

/**
 * Check whether a pull request was opened by Dependabot.
 *
 * @param pullRequestAuthor GitHub login from the pull request event.
 * @returns `true` for Dependabot's expected login.
 */
export function isDependabotPullRequest(
  pullRequestAuthor: string | undefined,
): boolean {
  return pullRequestAuthor === dependabotLogin;
}

/**
 * Require a recognized issue reference in a pull request body.
 *
 * @param pullRequestBody Pull request description to inspect.
 * @throws {Error} When no accepted issue reference is present.
 */
export function assertLinkedIssue(pullRequestBody: string): void {
  if (!hasLinkedIssue(pullRequestBody)) {
    throw new Error(
      'Pull request descriptions must link a Cipher Wallet issue. Use a phrase such as "Closes #123" or "Related to #123".',
    );
  }
}

/**
 * Run the pull-request issue-link check from the command line.
 *
 * @param arguments_ CLI arguments selecting the pull request body check.
 * @param environment GitHub event values used by the check.
 * @throws {Error} When arguments are invalid or the pull request is unlinked.
 */
export async function runIssueLinkCheck(
  arguments_: readonly string[],
  environment: Environment,
): Promise<void> {
  if (arguments_.length === 1 && arguments_[0] === "--pull-request-body") {
    if (
      isDependabotPullRequest(environment.CIPHER_WALLET_PULL_REQUEST_AUTHOR)
    ) {
      return;
    }

    assertLinkedIssue(environment.CIPHER_WALLET_PULL_REQUEST_BODY ?? "");
    return;
  }

  throw new Error("Usage: issue-link.ts --pull-request-body");
}

if (import.meta.main) {
  await runIssueLinkCheck(process.argv.slice(2), process.env);
}
