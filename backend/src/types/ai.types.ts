export interface EmbeddingResponse {
  embedding: number[];
  dimension: number;
}

export interface DualEmbeddingResponse {
  embedding_phrase: number[];
  embedding_topic: number[];
  dimension_phrase: number;
  dimension_topic: number;
}

export interface SummaryResponse {
  summary: string;
  keywords: string[];
}

export interface ClassifyResponse {
  concept_type: string;
  confidence: number;
}
