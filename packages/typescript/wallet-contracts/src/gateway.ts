import { z } from "zod";

/** Fields that the chain gateway must never receive. */
export const forbiddenWalletFields = new Set<string>([
  "encryption_key",
  "key_material",
  "mnemonic",
  "passphrase",
  "private_key",
  "recovery_phrase",
  "seed",
  "seed_phrase",
  "vault_plaintext",
  "wallet_backup",
  "wif",
  "xpriv",
  "xprv",
]);

/** Testnet network supported by the first wallet contract. */
export const chainNetworkSchema = z.literal("litecoin-testnet");

/** A public Litecoin Testnet address string. */
export const litecoinTestnetAddressSchema = z.string().min(14).max(128);

/** A public address request for the chain gateway. */
export const addressRequestSchema = z
  .object({
    address: litecoinTestnetAddressSchema,
    network: chainNetworkSchema,
    schema_version: z.literal("1"),
  })
  .strict();

/** A locally signed transaction ready for Testnet broadcast. */
export const signedTransactionBroadcastSchema = z
  .object({
    network: chainNetworkSchema,
    raw_transaction: z
      .string()
      .min(2)
      .max(200000)
      .regex(/^[0-9A-Fa-f]+$/u),
    schema_version: z.literal("1"),
  })
  .strict();

/** A valid public gateway network. */
export type ChainNetwork = z.infer<typeof chainNetworkSchema>;
/** A valid Litecoin Testnet address. */
export type LitecoinTestnetAddress = z.infer<
  typeof litecoinTestnetAddressSchema
>;
/** A public address request. */
export type AddressRequest = z.infer<typeof addressRequestSchema>;
/** A signed transaction broadcast request. */
export type SignedTransactionBroadcast = z.infer<
  typeof signedTransactionBroadcastSchema
>;

/**
 * Find recovery or private-key fields in a nested gateway payload.
 *
 * @param payload Value to inspect.
 * @param path Current nested field path.
 * @returns Secret-like field paths in traversal order.
 */
export function findProhibitedFieldPaths(
  payload: unknown,
  path = "",
): string[] {
  if (Array.isArray(payload)) {
    return payload.flatMap((value, index): string[] =>
      findProhibitedFieldPaths(value, path + "[" + String(index) + "]"),
    );
  }

  if (!isRecord(payload)) {
    return [];
  }

  return Object.entries(payload).flatMap(([fieldName, value]): string[] => {
    const fieldPath = path === "" ? fieldName : path + "." + fieldName;
    const nestedPaths = findProhibitedFieldPaths(value, fieldPath);

    return forbiddenWalletFields.has(normaliseFieldName(fieldName))
      ? [fieldPath, ...nestedPaths]
      : nestedPaths;
  });
}

/**
 * Reject recovery or private-key fields before a request reaches the gateway.
 *
 * @param payload Value to inspect.
 * @throws {Error} When the payload contains a wallet secret field.
 */
export function assertNoWalletSecrets(payload: unknown): void {
  const prohibitedPaths = findProhibitedFieldPaths(payload);

  if (prohibitedPaths.length > 0) {
    throw new Error(
      "Gateway payload contains wallet secrets: " + prohibitedPaths.join(", "),
    );
  }
}

/**
 * Parse a public Testnet address request.
 *
 * @param payload Untrusted request value.
 * @returns A validated address request.
 */
export function parseAddressRequest(payload: unknown): AddressRequest {
  assertNoWalletSecrets(payload);
  return addressRequestSchema.parse(payload);
}

/**
 * Parse a signed Testnet broadcast request.
 *
 * @param payload Untrusted request value.
 * @returns A validated signed transaction request.
 */
export function parseSignedTransactionBroadcast(
  payload: unknown,
): SignedTransactionBroadcast {
  assertNoWalletSecrets(payload);
  return signedTransactionBroadcastSchema.parse(payload);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normaliseFieldName(fieldName: string): string {
  return fieldName.trim().toLocaleLowerCase("en-US").replaceAll("-", "_");
}
