# Changelog

## [0.1.0-alpha.1] - 2026-08-26

### Added

- A self-custodial Litecoin Testnet browser and FastAPI gateway foundation.
- Shared Python and TypeScript contracts that reject recovery material and private keys.
- Matching TypeScript and Python coverage reports with 95% line and function gates.
- Local CodeQL scans, dependency policy checks, pinned toolchains, and shared quality checks.

### Changed

- Repository documentation now links to the published Cipher Wallet project view.
- TypeScript type checks use `tsgo`, and the ESLint flat config is written in TypeScript.

### Known limits

- This is a repository foundation, not a working wallet release.
- Wallet creation, recovery, local vault storage, provider access, balance views, transaction building, signing, and broadcast are not implemented yet.
- Cipher Wallet supports Litecoin Testnet only and makes no production security claim.
