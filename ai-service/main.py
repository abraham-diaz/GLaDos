from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="GLaDOS AI Service")


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "ai-service",
    }
