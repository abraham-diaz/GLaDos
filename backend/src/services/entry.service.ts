import { randomUUID } from 'crypto';
import { postgresService } from './postgres.service';
import { aiService } from './ai.service';
import { conceptService } from './concept.service';
import { CreateEntryRequest, CreateEntryResponse } from '../types/entry.types';
import { entryQueries } from '../queries/entry.queries';

interface ReassignResult {
  action: 'reassigned' | 'created' | 'unlinked';
  entryId: string;
  oldConceptId?: string;
  newConceptId?: string;
}

class EntryService {
  /**
   * Desasocia una entry de su concepto actual
   */
  async unlinkFromConcept(entryId: string): Promise<ReassignResult> {
    const pool = postgresService.getPool();

    const linked = await pool.query(entryQueries.getLinkedConcept, [entryId]);
    const oldConceptId = linked.rows[0]?.concept_id;

    await pool.query(entryQueries.unlinkConcept, [entryId]);

    if (oldConceptId) {
      await conceptService.decrementWeight(oldConceptId);
    }

    console.log(`[Entry] UNLINKED entry ${entryId} from concept ${oldConceptId || 'none'}`);
    return { action: 'unlinked', entryId, oldConceptId };
  }

  /**
   * Reasigna una entry a otro concepto existente
   */
  async reassignToConcept(entryId: string, newConceptId: string): Promise<ReassignResult> {
    const pool = postgresService.getPool();

    const entry = await pool.query(entryQueries.getById, [entryId]);
    if (entry.rows.length === 0) throw new Error('Entry not found');

    const linked = await pool.query(entryQueries.getLinkedConcept, [entryId]);
    const oldConceptId = linked.rows[0]?.concept_id;

    // Desasociar del concepto anterior
    await pool.query(entryQueries.unlinkConcept, [entryId]);
    if (oldConceptId) {
      await conceptService.decrementWeight(oldConceptId);
    }

    // Asociar al nuevo concepto
    await conceptService.linkEntry(entryId, newConceptId, 1.0);
    await conceptService.reinforce(newConceptId);

    console.log(`[Entry] REASSIGNED entry ${entryId}: ${oldConceptId || 'none'} -> ${newConceptId}`);
    return { action: 'reassigned', entryId, oldConceptId, newConceptId };
  }

  /**
   * Crea un concepto nuevo a partir de una entry existente
   */
  async createConceptFromEntry(entryId: string): Promise<ReassignResult> {
    const pool = postgresService.getPool();

    const entry = await pool.query(entryQueries.getById, [entryId]);
    if (entry.rows.length === 0) throw new Error('Entry not found');

    const { raw_text } = entry.rows[0];

    // Desasociar del concepto anterior
    const linked = await pool.query(entryQueries.getLinkedConcept, [entryId]);
    const oldConceptId = linked.rows[0]?.concept_id;

    await pool.query(entryQueries.unlinkConcept, [entryId]);
    if (oldConceptId) {
      await conceptService.decrementWeight(oldConceptId);
    }

    // Generar embeddings y crear concepto nuevo
    const { embedding_phrase, embedding_topic } = await aiService.getDualEmbedding(raw_text);
    const newConceptId = await conceptService.create(raw_text, embedding_phrase, embedding_topic);
    await conceptService.linkEntry(entryId, newConceptId, 1.0);

    console.log(`[Entry] CREATED new concept from entry ${entryId}: ${newConceptId}`);
    return { action: 'created', entryId, oldConceptId, newConceptId };
  }

  async create(data: CreateEntryRequest): Promise<CreateEntryResponse> {
    const id = randomUUID();
    const pool = postgresService.getPool();

    console.log(`[Entry] Creating entry: ${id}`);

    // Obtener ambos embeddings del servicio AI
    const { embedding_phrase, embedding_topic } = await aiService.getDualEmbedding(data.raw_text);

    // Formato para pgvector: '[0.1, 0.2, ...]'
    const embeddingStr = `[${embedding_phrase.join(',')}]`;

    await pool.query(entryQueries.create, [id, data.raw_text, embeddingStr]);

    console.log(`[Entry] Entry created successfully: ${id}`);

    // Procesar asociación automática de conceptos (usa embedding_topic para similitud)
    let context;
    try {
      const conceptResult = await conceptService.processEntry(
        id,
        data.raw_text,
        embedding_phrase,
        embedding_topic
      );
      console.log(`[Entry] Concept ${conceptResult.action}: "${conceptResult.conceptTitle}"`);
      context = conceptResult.context;
    } catch (error) {
      // Log pero no fallar la creación de entry
      console.error('[Entry] Error processing concept association:', error);
    }

    const response: CreateEntryResponse = { id, status: 'created' };
    if (context) {
      response.context = context;
    }
    return response;
  }
}

export const entryService = new EntryService();
