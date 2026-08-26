"""Shared public address constraints."""

from typing import Annotated

from pydantic import Field

type LitecoinTestnetAddress = Annotated[str, Field(min_length=14, max_length=128)]
