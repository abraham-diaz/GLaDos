from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
from contextlib import asynccontextmanager

# Modelos globales - se cargan una sola vez
model_phrase: SentenceTransformer | None = None  # MiniLM: similitud de frase
model_topic: SentenceTransformer | None = None   # MPNet: similitud semántica
kw_model: KeyBERT | None = None                  # KeyBERT: extracción de keywords


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_phrase, model_topic, kw_model

    # Startup: cargar modelos
    print("Loading phrase embedding model (MiniLM)...")
    model_phrase = SentenceTransformer('all-MiniLM-L6-v2')
    print("MiniLM loaded! (384 dims)")

    print("Loading topic embedding model (MPNet)...")
    model_topic = SentenceTransformer('all-mpnet-base-v2')
    print("MPNet loaded! (768 dims)")

    # KeyBERT reutiliza el modelo MPNet (0 MB extra)
    print("Initializing KeyBERT with MPNet...")
    kw_model = KeyBERT(model=model_topic)
    print("KeyBERT ready!")

    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(title="GLaDOS AI Service", lifespan=lifespan)


class AnalyzeRequest(BaseModel):
    text: str


class EmbeddingResponse(BaseModel):
    embedding: list[float]
    dimension: int


class DualEmbeddingResponse(BaseModel):
    embedding_phrase: list[float]
    embedding_topic: list[float]
    dimension_phrase: int
    dimension_topic: int


class SummaryResponse(BaseModel):
    summary: str
    keywords: list[str]


class ClassifyResponse(BaseModel):
    concept_type: str
    confidence: float


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "ai-service",
        "models_loaded": {
            "phrase": model_phrase is not None,
            "topic": model_topic is not None,
        },
    }


@app.post("/analyze", response_model=EmbeddingResponse)
async def analyze(req: AnalyzeRequest):
    """Embedding de frase (MiniLM) - retrocompatible"""
    if model_phrase is None:
        raise RuntimeError("Phrase model not loaded")

    embedding = model_phrase.encode(req.text).tolist()

    return {
        "embedding": embedding,
        "dimension": len(embedding),
    }


@app.post("/analyze/dual", response_model=DualEmbeddingResponse)
async def analyze_dual(req: AnalyzeRequest):
    """Ambos embeddings: frase (MiniLM) + tema (MPNet)"""
    if model_phrase is None or model_topic is None:
        raise RuntimeError("Models not loaded")

    embedding_phrase = model_phrase.encode(req.text).tolist()
    embedding_topic = model_topic.encode(req.text).tolist()

    return {
        "embedding_phrase": embedding_phrase,
        "embedding_topic": embedding_topic,
        "dimension_phrase": len(embedding_phrase),
        "dimension_topic": len(embedding_topic),
    }


@app.post("/summarize", response_model=SummaryResponse)
async def summarize(req: AnalyzeRequest):
    """Genera un summary basado en keywords extraídos con KeyBERT"""
    if kw_model is None:
        raise RuntimeError("KeyBERT not loaded")

    # Extraer keywords (máximo 5, usando n-gramas de 1-2 palabras)
    keywords_raw = kw_model.extract_keywords(
        req.text,
        keyphrase_ngram_range=(1, 2),
        stop_words=None,  # Sin filtro de idioma para mejor cobertura
        top_n=5,
        use_mmr=True,     # Maximal Marginal Relevance para diversidad
        diversity=0.5,
    )

    # keywords_raw es lista de tuplas: [("keyword", score), ...]
    # Usar umbral bajo (0.1) para capturar más keywords
    keywords = [kw for kw, score in keywords_raw if score > 0.1]

    # Generar summary basado en keywords
    if len(keywords) >= 2:
        summary = f"Relacionado con: {', '.join(keywords)}"
    else:
        # Fallback: usar primeras palabras del texto
        words = req.text.strip().split()[:8]
        summary = ' '.join(words)
        if len(req.text.strip().split()) > 8:
            summary += "..."

    return {
        "summary": summary,
        "keywords": keywords,
    }


# Patrones para clasificación por keywords
import re

CONCEPT_TYPE_PATTERNS: dict[str, list[str]] = {
    "error": [
        r"\berror\b", r"\bbug\b", r"\bcrash", r"\bfallo\b", r"\bfalla\b",
        r"\broto\b", r"\brompe", r"\bexcep", r"\btype\s?error",
        r"\bnull\b", r"\bno funciona", r"\bno anda", r"\bse cae\b",
        r"\bse rompe", r"\bse cierra", r"\bpantalla.*(azul|negra)",
        r"\bproblema\b", r"\bcuelga", r"\bpeta\b",
    ],
    "aprendizaje": [
        r"\baprend", r"\bdescubr", r"\bentend[ií]", r"\bme di cuenta",
        r"\bresulta que\b", r"\bhoy s[eé]", r"\btil\b",
        r"\bno sab[ií]a", r"\bahora entiendo", r"\bme enter[eé]",
        r"\bcomprendí", r"\bfunciona porque\b", r"\bla clave es\b",
    ],
    "decision": [
        r"\bdecid", r"\bvamos a\b", r"\bmigrar", r"\bcambiar de\b",
        r"\busar\b.*\ben vez de\b", r"\badoptamos\b", r"\belegimos\b",
        r"\boptamos\b", r"\bel plan es\b", r"\bla estrategia\b",
        r"\bpasarnos a\b", r"\bswitche", r"\breemplazar\b",
    ],
    "idea": [
        r"\bse me ocurr", r"\bpodr[ií]amos", r"\bqu[eé] tal si\b",
        r"\bestar[ií]a bien\b", r"\bpropongo\b", r"\bimagina\b",
        r"\by si\b.*\b\?\b", r"\bser[ií]a.*(bueno|genial|interesante)",
        r"\ba[ñn]adir\b", r"\bmodo\b.*\bnuevo", r"\bfeature\b",
    ],
}


def classify_by_patterns(text: str) -> tuple[str, float]:
    """Clasifica texto por patrones regex. Retorna (tipo, confianza)."""
    text_lower = text.lower()
    scores: dict[str, int] = {t: 0 for t in CONCEPT_TYPE_PATTERNS}

    for concept_type, patterns in CONCEPT_TYPE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                scores[concept_type] += 1

    total_matches = sum(scores.values())
    if total_matches == 0:
        return "idea", 0.0

    best_type = max(scores, key=lambda k: scores[k])
    confidence = scores[best_type] / max(total_matches, 1)
    return best_type, round(confidence, 4)


@app.post("/classify", response_model=ClassifyResponse)
async def classify(req: AnalyzeRequest):
    """Clasifica el texto en: idea, error, aprendizaje, decision"""
    concept_type, confidence = classify_by_patterns(req.text)
    return {
        "concept_type": concept_type,
        "confidence": confidence,
    }
