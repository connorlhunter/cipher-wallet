# Infrastructure boundary

Infrastructure is intentionally deferred until wallet and gateway contracts are tested. The target topology is API Gateway HTTP API, FastAPI/Mangum on Lambda, AWS CDK, a configured Litecoin Testnet provider, rate limiting, redacted logs, and least-privilege IAM.

The gateway reads public chain data and broadcasts signed transactions. It has no user accounts, seed storage, private-key access, cloud wallet sync, or password recovery path.
