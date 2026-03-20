from contextlib import asynccontextmanager
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from transformers import pipeline

from . import models
from .routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading phrase embedding model (MiniLM)...")
    models.model_phrase = SentenceTransformer('all-MiniLM-L6-v2')
    print("MiniLM loaded! (384 dims)")

    print("Loading topic embedding model (MPNet)...")
    models.model_topic = SentenceTransformer('all-mpnet-base-v2')
    print("MPNet loaded! (768 dims)")

    print("Initializing KeyBERT with MPNet...")
    models.kw_model = KeyBERT(model=models.model_topic)
    print("KeyBERT ready!")

    print("Loading zero-shot classifier (mDeBERTa)...")
    models.classifier = pipeline(
        "zero-shot-classification",
        model="MoritzLaurer/mDeBERTa-v3-base-mnli-xnli",
    )
    print("mDeBERTa loaded!")

    yield
    print("Shutting down...")


def create_app() -> FastAPI:
    app = FastAPI(title="GLaDOS AI Service", lifespan=lifespan)
    app.include_router(router)
    return app
