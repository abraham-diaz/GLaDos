from sentence_transformers import SentenceTransformer
from keybert import KeyBERT

# Global state for ML models — loaded once at lifespan startup

model_phrase: SentenceTransformer | None = None  # MiniLM: similitud de frase (384 dims)
model_topic: SentenceTransformer | None = None   # MPNet: similitud semántica (768 dims)
kw_model: KeyBERT | None = None                  # KeyBERT: extracción de keywords
classifier = None                                 # Zero-shot classification (mDeBERTa)
groq_client = None                                # Groq API client para chat
