"""Public Litecoin Testnet gateway contracts."""

from collections.abc import Iterator, Mapping
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from cipher_wallet_core.identifiers import LitecoinTestnetAddress

FORBIDDEN_WALLET_FIELDS = frozenset(
    {
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
    }
)


class ChainNetwork(StrEnum):
    """Networks accepted by the first gateway contract."""

    LITECOIN_TESTNET = "litecoin-testnet"


class AddressRequest(BaseModel):
    """A request for public address facts."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    schema_version: Literal["1"]
    network: ChainNetwork
    address: LitecoinTestnetAddress


class SignedTransactionBroadcast(BaseModel):
    """A signed Litecoin Testnet transaction ready to broadcast."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    schema_version: Literal["1"]
    network: ChainNetwork
    raw_transaction: str = Field(min_length=2, max_length=200000, pattern=r"^[0-9A-Fa-f]+$")


def find_prohibited_field_paths(payload: Mapping[str, object]) -> tuple[str, ...]:
    """List secret-like field paths in a nested payload.

    Args:
        payload: Gateway payload to inspect.

    Returns:
        Field paths in traversal order.
    """

    return tuple(_find_prohibited_field_paths(payload))


def assert_no_wallet_secrets(payload: Mapping[str, object]) -> None:
    """Reject recovery or private-key fields.

    Args:
        payload: Gateway payload to inspect.

    Raises:
        ValueError: If a secret-like field is present.
    """

    prohibited_paths = find_prohibited_field_paths(payload)
    if prohibited_paths:
        raise ValueError("Gateway payload contains wallet secrets: " + ", ".join(prohibited_paths))


def _find_prohibited_field_paths(value: object, path: str = "") -> Iterator[str]:
    if isinstance(value, Mapping):
        for raw_name, nested_value in value.items():
            if not isinstance(raw_name, str):
                continue

            field_path = raw_name if not path else path + "." + raw_name
            if _normalise_field_name(raw_name) in FORBIDDEN_WALLET_FIELDS:
                yield field_path

            yield from _find_prohibited_field_paths(nested_value, field_path)
    elif isinstance(value, list):
        for index, nested_value in enumerate(value):
            yield from _find_prohibited_field_paths(nested_value, path + "[" + str(index) + "]")


def _normalise_field_name(field_name: str) -> str:
    return field_name.strip().casefold().replace("-", "_")
