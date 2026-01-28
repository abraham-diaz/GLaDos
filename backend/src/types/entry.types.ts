import { ConceptContext } from './concept.types';

export interface CreateEntryRequest {
  raw_text: string;
}

export interface CreateEntryResponse {
  id: string;
  status: 'created';
  context?: ConceptContext;
}
