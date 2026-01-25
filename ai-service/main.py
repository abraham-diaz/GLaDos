from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from sentence_transformers import SentenceTransformer
from contextlib import asynccontextmanager

# Modelo global - se carga una sola vez
model: SentenceTransformer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: cargar modelo
    global model
    print("Loading embedding model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Model loaded!")
    yield
    # Shutdown: limpiar si es necesario
    print("Shutting down...")


app = FastAPI(title="GLaDOS AI Service", lifespan=lifespan)


class AnalyzeRequest(BaseModel):
    text: str


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    dimension: int


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "ai-service",
        "model_loaded": model is not None,
    }


@app.post("/analyze", response_model=EmbeddingResponse)
async def analyze(req: AnalyzeRequest):
    if model is None:
        raise RuntimeError("Model not loaded")

    # Generar embedding
    embedding = model.encode(req.text).tolist()

    return {
        "embedding": embedding,
        "dimension": len(embedding),
    }
