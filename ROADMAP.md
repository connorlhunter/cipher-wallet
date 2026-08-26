# Cipher Wallet Roadmap

Cipher Wallet will be a self-custodial Litecoin Testnet browser wallet. The order matters. Wallet features must not outrun local key protection, transaction rules, or test evidence.

Published docs and diagrams:

<https://connorhunter.me/projects/cipher-wallet?viewer=docs#project-viewer>

Live issue hierarchy:

<https://github.com/connorlhunter/cipher-wallet/issues>

## Operating rules

- The GitHub Project is the ordered implementation record. Each phase has a parent issue and focused child issues.
- Issue, branch, and pull-request titles use `feat`, `fix`, `chore`, `docs`, `test`, or `refactor` followed by an imperative summary.
- A change to custody, recovery, derivation, signing, provider boundaries, network support, data model, deployment shape, or wallet claims starts with an architecture decision issue.
- Recovery phrases, private keys, WIF values, passphrases, and vault plaintext must never enter gateway requests, Lambda logs, analytics, error reports, or cloud storage.
- Each phase ends with automated evidence. A feature is not done because it compiles.

## Phase 0: Scope and threat model

Define self-custody claims, browser risks, user backup duties, visible gateway data, and Testnet limits.

Exit gate: reviewed claim matrix and architecture decisions confirm local key custody, no cloud recovery, no accounts, and no mainnet support.

## Phase 1: Repository and safe contracts

Create the browser, FastAPI, CDK, Python, and TypeScript foundation. Pin toolchains and reject secret fields at every service boundary.

Exit gate: bootstrap, CI, coverage, and local security scans pass. Public contracts reject secret wallet fields.

## Phase 2: Local vault and derivation

Build a passphrase-encrypted local vault with BIP39 recovery and BIP84 Litecoin Testnet derivation. Use reviewed libraries and versioned test vectors.

Exit gate: create, lock, unlock, recover, corrupt-vault, and no-reset cases have repeatable tests.

## Phase 3: Testnet gateway and chain data

Select a Litecoin Testnet provider through an architecture decision. Add a narrow FastAPI adapter for public address facts, UTXOs, fee data, and signed transaction broadcast.

Exit gate: provider errors, rate limits, malformed responses, and chain reorganization cases are handled without secret logging.

## Phase 4: Receive and wallet overview

Add address discovery, receive addresses, balance, UTXOs, confirmations, transaction history, and clear Testnet status.

Exit gate: the browser shows public chain state accurately and explains pending or reorganization states.

## Phase 5: Build, sign, and broadcast

Add transaction construction, fee review, local signing, signed broadcast, and broadcast result handling.

Exit gate: a user reviews the destination, amount, and fee before local signing. The gateway never receives a recovery phrase or private key.

## Phase 6: Browser safety and accessibility

Add lock behavior, secret-screen protections, clear recovery warnings, accessible forms, and safe error reporting.

Exit gate: user-facing failure states explain the limit without exposing wallet secrets.

## Phase 7: AWS operations

Provision CDK infrastructure for API Gateway, FastAPI Lambda, rate limiting, CORS, provider credentials, redacted logs, metrics, alerts, and recovery runbooks.

Exit gate: least privilege and redaction checks pass in deployed Testnet infrastructure.

## Phase 8: Testnet alpha readiness

Run wallet vectors, browser integration tests, provider failure tests, dependency review, security review planning, and release checks.

Exit gate: the Testnet alpha has clear limits, evidence, rollback criteria, and no mainnet claim.

## Deferred

- Litecoin mainnet or another currency
- Exchange, purchase, sale, swap, lending, custody, or payment processing
- Cloud wallet sync, accounts, password reset, seed backup, or key recovery
- Hardware wallet support
- Custom cryptography or a custom recovery format

The [GitHub Project](https://github.com/users/connorlhunter/projects/17) is the live roadmap. Parent issues and subissues are linked to the main Cipher Wallet repository.
