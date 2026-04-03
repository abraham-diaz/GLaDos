export type ConceptType = 'idea' | 'error' | 'aprendizaje' | 'decision';
export type ConceptState = 'cruda' | 'recurrente' | 'importante' | 'dormida' | 'resuelta';

export interface Concept {
  id: string;
  title: string;
  type: ConceptType;
  concept_type?: ConceptType;
  state: ConceptState;
  summary: string | null;
  keywords?: string;
  weight: number;
  created_at: string;
  last_seen_at: string;
  entry_count?: number;
}

export interface ConceptSearchResult extends Concept {
  similarity: number;
}

export interface ConceptDetailEntry {
  id: string;
  raw_text: string;
  created_at: string;
  similarity: number;
  entry_type: ConceptType | null;
}

export interface ConceptDetail {
  concept: Concept;
  entries: ConceptDetailEntry[];
}

export interface ConceptContext {
  conceptId: string;
  title: string;
  state: ConceptState;
  summary: string | null;
  similarity: number;
  weight: number;
  entryType?: ConceptType;
  entryConfidence?: number;
}

export interface CreateEntryResponse {
  id: string;
  status: string;
  context?: ConceptContext;
  concept?: ConceptContext;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSource {
  id: string;
  title: string;
  type: string;
  similarity: number;
}

export interface ChatResponse {
  reply: string;
  sources: ChatSource[];
}
