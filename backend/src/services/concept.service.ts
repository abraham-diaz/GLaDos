import { randomUUID } from 'crypto';
import { postgresService } from './postgres.service';
import { SimilarConcept, ConceptState, ConceptDetail, ConceptDetailEntry } from '../types/concept.types';
import { CONCEPT } from '../constants';
import { conceptQueries } from '../queries/concept.queries';

interface CreateConceptData {
  text: string;
  embeddingPhrase: number[];
  embeddingTopic: number[];
  type: string;
  summary: string | null;
}

class ConceptService {

  generateTitle(text: string): string {
    const words = text.trim().split(/\s+/).slice(0, 5);
    let title = words.join(' ');

    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    return title || 'Sin título';
  }

  //Search for similar concepts based on embedding_topic (MPNet)

  async findSimilarByTopic(embeddingTopic: number[], limit = 5): Promise<SimilarConcept[]> {
    const pool = postgresService.getPool();
    const embeddingStr = `[${embeddingTopic.join(',')}]`;

    const result = await pool.query<SimilarConcept>(
      conceptQueries.findSimilarByTopic,
      [embeddingStr, CONCEPT.TOPIC_SIMILARITY_THRESHOLD, limit]
    );

    return result.rows;
  }

  //Create a new concept with pre-computed data

  async create(data: CreateConceptData): Promise<string> {
    const pool = postgresService.getPool();
    const id = randomUUID();
    const title = this.generateTitle(data.text);
    const embeddingPhraseStr = `[${data.embeddingPhrase.join(',')}]`;
    const embeddingTopicStr = `[${data.embeddingTopic.join(',')}]`;

    await pool.query(conceptQueries.create, [id, title, data.type, embeddingPhraseStr, embeddingTopicStr, data.summary]);

    console.log(`[Concept] CREATED new concept: "${title}" (${id})`);
    if (data.summary) {
      console.log(`[Concept] Summary: "${data.summary}"`);
    }
    return id;
  }

  //Strengthen an existing concept

  async reinforce(conceptId: string): Promise<void> {
    const pool = postgresService.getPool();

    const result = await pool.query<{ weight: number; state: string }>(
      conceptQueries.reinforce,
      [conceptId, CONCEPT.MIN_WEIGHT_FOR_RECURRENT]
    );

    const { weight, state } = result.rows[0];
    console.log(`[Concept] REINFORCED concept: ${conceptId} (weight: ${weight}, state: ${state})`);
  }

  //Associates an entry to a concept

  async linkEntry(entryId: string, conceptId: string, similarity: number, entryType?: string): Promise<void> {
    const pool = postgresService.getPool();

    await pool.query(conceptQueries.linkEntry, [entryId, conceptId, similarity, entryType || null]);

    console.log(`[Concept] LINKED entry ${entryId} -> concept ${conceptId} (similarity: ${similarity.toFixed(3)}, type: ${entryType || 'n/a'})`);
  }

  //Search concepts by pre-computed embedding

  async searchByEmbedding(embeddingTopic: number[], limit: number, query: string): Promise<{
    id: string;
    title: string;
    type: string;
    state: ConceptState;
    summary: string | null;
    weight: number;
    similarity: number;
  }[]> {
    const pool = postgresService.getPool();
    const embeddingStr = `[${embeddingTopic.join(',')}]`;

    const result = await pool.query(conceptQueries.search, [embeddingStr, limit]);

    console.log(`[Concept] SEARCH for "${query}" returned ${result.rows.length} results`);
    return result.rows;
  }

  //Get the detail of a concept with its linked entries

  async getDetail(id: string): Promise<ConceptDetail | null> {
    const pool = postgresService.getPool();

    const conceptResult = await pool.query(conceptQueries.getById, [id]);
    if (conceptResult.rows.length === 0) return null;

    const entriesResult = await pool.query<ConceptDetailEntry>(conceptQueries.getLinkedEntries, [id]);

    return {
      concept: conceptResult.rows[0],
      entries: entriesResult.rows,
    };
  }

  async list(): Promise<{
    id: string;
    title: string;
    type: string;
    state: ConceptState;
    weight: number;
    summary: string | null;
    created_at: Date;
    last_seen_at: Date;
    entry_count: number;
  }[]> {
    const pool = postgresService.getPool();
    const result = await pool.query(conceptQueries.list);
    return result.rows;
  }

  async decrementWeight(conceptId: string): Promise<void> {
    const pool = postgresService.getPool();
    const result = await pool.query(conceptQueries.decrementWeight, [conceptId]);
    if (result.rows.length > 0) {
      const { weight, state } = result.rows[0];
      console.log(`[Concept] DECREMENTED weight: ${conceptId} (weight: ${weight}, state: ${state})`);
    }
  }

  async delete(id: string): Promise<boolean> {
    const pool = postgresService.getPool();
    const result = await pool.query(conceptQueries.delete, [id]);
    const deleted = (result.rowCount ?? 0) > 0;
    if (deleted) {
      console.log(`[Concept] DELETED concept: ${id}`);
    }
    return deleted;
  }

  async getAllWithTopEntry(): Promise<{ id: string; raw_text: string }[]> {
    const pool = postgresService.getPool();
    const result = await pool.query<{ id: string; raw_text: string }>(conceptQueries.getAllWithTopEntry);
    return result.rows;
  }

  async getTypeById(id: string): Promise<string> {
    const pool = postgresService.getPool();
    const result = await pool.query(conceptQueries.getById, [id]);
    return result.rows[0]?.type || 'idea';
  }

  async updateType(id: string, type: string): Promise<void> {
    const pool = postgresService.getPool();
    await pool.query(conceptQueries.updateType, [id, type]);
  }
}

export const conceptService = new ConceptService();
