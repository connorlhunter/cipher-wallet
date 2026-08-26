# Contributing

Create a branch from main, keep the change focused, and open a pull request.

Every pull request except one opened by Dependabot must link a Cipher Wallet issue with a recognized phrase such as Closes #<issue-number> or Related to #<issue-number>.

Install Bun 1.3.14, Python 3.12, uv 0.12.6, and CodeQL CLI 2.26.3. Run bun run bootstrap once after cloning, then bun run verify before opening or updating a pull request. The command validates repository naming, linked contracts, formatting, TypeScript, Python, tests, and local CodeQL findings without cloud credentials. CodeQL must resolve to the exact pinned version on your PATH.

Branches use <type>/<kebab-case-name>. Commit, issue, and pull-request subjects use <type>[(scope)][!]: <imperative summary>, where <type> is feat, fix, chore, docs, test, or refactor. Issue forms supply the appropriate prefix.

Release branches use release/<version>, release-preparation commits use chore(release): prepare <version>, and release tags use v<version>. Dependabot branches are accepted as dependabot/*. These rules apply to new work; existing Git history remains unchanged.

Do not commit credentials, tokens, recovery phrases, private keys, WIF values, wallet backups, local environment files, or generated build output.

Open an architecture decision issue before changing key custody, recovery, derivation, transaction signing, network support, provider boundaries, data model, deployment shape, or supported platforms. A passing build is not permission to publish a release.
