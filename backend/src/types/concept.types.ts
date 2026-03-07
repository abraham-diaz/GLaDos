export type ConceptType = 'idea' | 'error' | 'aprendizaje' | 'decision';
export type ConceptState = 'cruda' | 'recurrente' | 'importante' | 'dormida' | 'resuelta';

export interface Concept {
  id: string;
  title: string;
  type: ConceptType;
  state: ConceptState;
  summary: string | null;
  weight: number;
  embedding: number[];
  created_at: Date;
  last_seen_at: Date;
}

export interface SimilarConcept {
  id: string;
  title: string;
  state: ConceptState;
  summary: string | null;
  weight: number;
  similarity: number;
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

export interface ConceptAssociationResult {
  action: 'created' | 'associated';
  conceptId: string;
  conceptTitle: string;
  similarity?: number;
  context?: ConceptContext;
}

export interface ConceptDetailEntry {
  id: string;
  raw_text: string;
  created_at: Date;
  similarity: number;
  entry_type: ConceptType | null;
}

export interface ConceptDetail {
  concept: Omit<Concept, 'embedding'>;
  entries: ConceptDetailEntry[];
}
