"""FastAPI chain-gateway skeleton."""

from fastapi import FastAPI

app = FastAPI(
    title="Cipher Wallet API",
    version="0.1.0a1",
    description="Public Litecoin Testnet gateway. It never receives wallet secrets.",
)


@app.get("/health", tags=["operational"])
async def health() -> dict[str, str]:
    """Return a public liveness response."""

    return {"status": "ok"}
