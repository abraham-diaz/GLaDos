from datetime import datetime
from fastapi import APIRouter
from . import models
from .schemas import (
    AnalyzeRequest, EmbeddingResponse, DualEmbeddingResponse,
    SummaryResponse, ClassifyResponse, ClassifyDebugResponse,
)
from .classifier import classify_zero_shot, classify_with_debug

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "ai-service",
        "models_loaded": {
            "phrase": models.model_phrase is not None,
            "topic": models.model_topic is not None,
        },
    }


@router.post("/analyze", response_model=EmbeddingResponse)
async def analyze(req: AnalyzeRequest):
    """Embedding de frase (MiniLM) - retrocompatible"""
    if models.model_phrase is None:
        raise RuntimeError("Phrase model not loaded")

    embedding = models.model_phrase.encode(req.text).tolist()
    return {
        "embedding": embedding,
        "dimension": len(embedding),
    }


@router.post("/analyze/dual", response_model=DualEmbeddingResponse)
async def analyze_dual(req: AnalyzeRequest):
    """Ambos embeddings: frase (MiniLM) + tema (MPNet)"""
    if models.model_phrase is None or models.model_topic is None:
        raise RuntimeError("Models not loaded")

    embedding_phrase = models.model_phrase.encode(req.text).tolist()
    embedding_topic = models.model_topic.encode(req.text).tolist()
    return {
        "embedding_phrase": embedding_phrase,
        "embedding_topic": embedding_topic,
        "dimension_phrase": len(embedding_phrase),
        "dimension_topic": len(embedding_topic),
    }


@router.post("/summarize", response_model=SummaryResponse)
async def summarize(req: AnalyzeRequest):
    """Genera un summary basado en keywords extraídos con KeyBERT"""
    if models.kw_model is None:
        raise RuntimeError("KeyBERT not loaded")

    keywords_raw = models.kw_model.extract_keywords(
        req.text,
        keyphrase_ngram_range=(1, 2),
        stop_words=None,
        top_n=5,
        use_mmr=True,
        diversity=0.5,
    )

    keywords = [kw for kw, score in keywords_raw if score > 0.1]

    if len(keywords) >= 2:
        summary = f"Relacionado con: {', '.join(keywords)}"
    else:
        words = req.text.strip().split()[:8]
        summary = ' '.join(words)
        if len(req.text.strip().split()) > 8:
            summary += "..."

    return {
        "summary": summary,
        "keywords": keywords,
    }


@router.post("/classify", response_model=ClassifyResponse)
async def classify(req: AnalyzeRequest):
    """Clasifica el texto en: idea, error, aprendizaje, decision"""
    concept_type, confidence = classify_zero_shot(req.text)
    return {
        "concept_type": concept_type,
        "confidence": confidence,
    }


@router.post("/classify/debug", response_model=ClassifyDebugResponse)
async def classify_debug(req: AnalyzeRequest):
    """Clasificación con info de debug — útil para afinar el sistema"""
    return classify_with_debug(req.text)
