import { expect, test } from "bun:test";

import {
  assertNoWalletSecrets,
  findProhibitedFieldPaths,
  parseAddressRequest,
  parseSignedTransactionBroadcast,
  type AddressRequest,
  type SignedTransactionBroadcast,
} from "../src/index.ts";

function validAddressRequest(): AddressRequest {
  return {
    address: "tltc1qtestnetaddress000000000000000000000000000",
    network: "litecoin-testnet",
    schema_version: "1",
  };
}

function validBroadcastRequest(): SignedTransactionBroadcast {
  return {
    network: "litecoin-testnet",
    raw_transaction: "00aaff",
    schema_version: "1",
  };
}

test("parses a public Testnet address request", (): void => {
  expect(parseAddressRequest(validAddressRequest()).network).toBe(
    "litecoin-testnet",
  );
});

test("parses a signed Testnet broadcast request", (): void => {
  expect(
    parseSignedTransactionBroadcast(validBroadcastRequest()).raw_transaction,
  ).toBe("00aaff");
});

test("rejects wallet secret fields before parsing", (): void => {
  expect((): AddressRequest =>
    parseAddressRequest({ ...validAddressRequest(), mnemonic: "not allowed" }),
  ).toThrow("mnemonic");
});

test("finds nested wallet secret fields", (): void => {
  expect(
    findProhibitedFieldPaths({
      request: { "recovery-phrase": "not allowed" },
    }),
  ).toEqual(["request.recovery-phrase"]);
});

test("rejects wallet secret fields in arrays", (): void => {
  const payload = {
    attempts: [{ address: "public" }, { " Private-Key ": "not allowed" }],
  };

  expect(findProhibitedFieldPaths(payload)).toEqual([
    "attempts[1]. Private-Key ",
  ]);
  expect((): void => assertNoWalletSecrets(payload)).toThrow(
    "attempts[1]. Private-Key ",
  );
});

test("rejects non-hex signed transaction data", (): void => {
  expect((): SignedTransactionBroadcast =>
    parseSignedTransactionBroadcast({
      ...validBroadcastRequest(),
      raw_transaction: "signed",
    }),
  ).toThrow();
});
