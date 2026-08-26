# Wallet contracts

The executable contracts live in:

- `packages/python/cipher-wallet-core`
- `packages/typescript/wallet-contracts`

They validate public Litecoin Testnet gateway data only. The published Cipher Wallet docs define the approved wallet protocol.

The contracts do not create wallets, derive keys, encrypt vaults, sign transactions, call providers, or broadcast transactions.

They must reject recovery phrases, private keys, WIF values, passphrases, and vault plaintext.
