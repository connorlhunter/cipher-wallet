"""Expose FastAPI through API Gateway and Lambda."""

from mangum import Mangum

from app.main import app

# Mangum adapts API Gateway events to ASGI.
handler = Mangum(app, lifespan="off")
