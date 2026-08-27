# Cipher Wallet

Cipher Wallet is a self-custodial browser wallet for Litecoin Testnet. The browser creates and protects wallet secrets locally. The service reads public chain data and broadcasts already signed transactions.

Published docs and diagrams:

<https://connorhunter.me/projects/cipher-wallet/docs>

## Scope

- Litecoin Testnet is the only planned MVP network.
- Recovery phrases, private keys, local vault data, derivation, and signing stay in the browser.
- FastAPI on API Gateway and Lambda is a public chain gateway. It has no accounts, cloud sync, password reset, or key recovery.
- Litecoin Testnet is the source of truth for balances, UTXOs, and confirmations.
- Cipher Wallet is not an exchange, payment processor, custody service, or mainnet wallet.

## Repository layout

```text
apps/
  api/                         FastAPI chain-gateway Lambda
  web/                         React, TanStack Router, and Vite browser base
infra/                         AWS CDK deployment boundary
packages/python/               Python gateway contracts
packages/typescript/           TypeScript browser and gateway contracts
scripts/                       developer, security, coverage, and release checks
```

This is a foundation release. It does not create wallets, import recovery phrases, store a vault, call a chain provider, build transactions, sign, or broadcast.

## Development

Install Bun 1.3.14, Python 3.12, uv 0.12.6, and CodeQL CLI 2.26.3, then run:

```sh
bun run bootstrap
bun run verify
```

The checks validate naming, issue links, formatting, TypeScript, Python, tests, dependency policy, and local CodeQL scans. TypeScript checks use `tsgo`.

The FastAPI skeleton exposes only a health endpoint:

```sh
uv run uvicorn app.main:app --app-dir apps/api --reload
```

Start the browser base with `bun run dev:web`.

## Contracts

`cipher_wallet_core` and `@cipher-wallet/wallet-contracts` share small gateway contracts for public Litecoin Testnet addresses and signed transaction broadcasts. They reject recovery phrases, private keys, WIF values, passphrases, and vault data.

## Coverage

TypeScript and Python both require at least 95% line and function coverage.

```sh
bun run coverage:build
```

The command builds `coverage/index.json` and `coverage/coverage.pdf` for the live project view. The portfolio renders the JSON itself.

## Releases

`bun run release:publish` validates the package version against `CHANGELOG.md`, then publishes coverage JSON/PDF and changelog Markdown/PDF. The changelog comes directly from the repository’s canonical `CHANGELOG.md`.

## Roadmap

[ROADMAP.md](ROADMAP.md) describes the delivery order. The public GitHub Project is the live implementation record:

<https://github.com/users/connorlhunter/projects/17>

## Contribution rules

Use focused branches and linked pull requests. Branches use `<type>/<kebab-case-name>`. Commit, issue, and pull-request subjects use `<type>[(scope)][!]: <imperative summary>`.

Never commit recovery phrases, private keys, WIF values, wallet backups, credentials, Testnet funds, or generated build output. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
