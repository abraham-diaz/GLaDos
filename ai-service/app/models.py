from sentence_transformers import SentenceTransformer
from keybert import KeyBERT

# Estado global de los modelos ML — se cargan una sola vez en el lifespan
model_phrase: SentenceTransformer | None = None  # MiniLM: similitud de frase (384 dims)
model_topic: SentenceTransformer | None = None   # MPNet: similitud semántica (768 dims)
kw_model: KeyBERT | None = None                  # KeyBERT: extracción de keywords
classifier = None                                 # Zero-shot classification (mDeBERTa)
