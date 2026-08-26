# Cipher Wallet web client

This is the browser base for Cipher Wallet. It uses React, TanStack Router, and Vite. The base has one local route and no wallet creation, recovery, API client, chain request, or signing behavior.

## Run locally

From the repository root:

```sh
bun install
bun run dev:web
```

Build the client with:

```sh
bun run --cwd apps/web build
```

The build uses `tsgo`, the native TypeScript compiler, before Vite creates the
browser bundle.

The router is code-based for this foundation. It has no generated route tree and no server-rendered routes. Add routes only when the related client and protocol issue is ready.

## Security boundary

The browser will own recovery phrases, private keys, local vault encryption, address derivation, and transaction signing.

Do not place recovery phrases, private keys, WIF values, vault plaintext, or passphrases in Vite environment values, route loaders, analytics, error reports, or gateway requests. The FastAPI service receives public chain requests and signed transactions only.
