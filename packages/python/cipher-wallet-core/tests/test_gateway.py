from typing import Any

import pytest
from cipher_wallet_core import (
    AddressRequest,
    ChainNetwork,
    SignedTransactionBroadcast,
    assert_no_wallet_secrets,
    find_prohibited_field_paths,
)


def valid_address_request() -> dict[str, Any]:
    return {
        "address": "tltc1qtestnetaddress000000000000000000000000000",
        "network": "litecoin-testnet",
        "schema_version": "1",
    }


def valid_broadcast_request() -> dict[str, Any]:
    return {
        "network": "litecoin-testnet",
        "raw_transaction": "00aaff",
        "schema_version": "1",
    }


def test_address_request_accepts_public_testnet_data() -> None:
    request = AddressRequest.model_validate(valid_address_request())

    assert request.network is ChainNetwork.LITECOIN_TESTNET


def test_signed_transaction_broadcast_accepts_hex() -> None:
    request = SignedTransactionBroadcast.model_validate(valid_broadcast_request())

    assert request.raw_transaction == "00aaff"


def test_gateway_contract_rejects_wallet_secret_fields() -> None:
    payload = valid_address_request()
    payload["mnemonic"] = "not allowed"

    with pytest.raises(ValueError, match="mnemonic"):
        assert_no_wallet_secrets(payload)


def test_gateway_contract_finds_nested_wallet_secret_fields() -> None:
    payload: dict[str, object] = {
        "request": {"recovery-phrase": "not allowed"},
        "attempts": [{"address": "public"}, {" Private-Key ": "not allowed"}],
    }

    assert find_prohibited_field_paths(payload) == (
        "request.recovery-phrase",
        "attempts[1]. Private-Key ",
    )


def test_gateway_contract_rejects_non_hex_signed_transaction() -> None:
    payload = valid_broadcast_request()
    payload["raw_transaction"] = "signed"

    with pytest.raises(ValueError):
        SignedTransactionBroadcast.model_validate(payload)
