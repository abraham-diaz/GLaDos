from pydantic import BaseModel


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


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []
    context: str = ""


class ChatResponse(BaseModel):
    reply: str
    model: str


class ClassifyDebugResponse(BaseModel):
    concept_type: str
    confidence: float
    raw_type: str
    margin: float
    all_scores: dict[str, float]
    keyword_scores: dict[str, int]
    was_overridden: bool
