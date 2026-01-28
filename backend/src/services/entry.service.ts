import { randomUUID } from 'crypto';
import { postgresService } from './postgres.service';
import { aiService } from './ai.service';
import { conceptService } from './concept.service';
import { CreateEntryRequest, CreateEntryResponse } from '../types/entry.types';

class EntryService {
  async create(data: CreateEntryRequest): Promise<CreateEntryResponse> {
    const id = randomUUID();
    const pool = postgresService.getPool();

    console.log(`[Entry] Creating entry: ${id}`);

    // Obtener ambos embeddings del servicio AI
    const { embedding_phrase, embedding_topic } = await aiService.getDualEmbedding(data.raw_text);

    // Formato para pgvector: '[0.1, 0.2, ...]'
    const embeddingStr = `[${embedding_phrase.join(',')}]`;

    await pool.query(
      'INSERT INTO entries (id, raw_text, embedding) VALUES ($1, $2, $3)',
      [id, data.raw_text, embeddingStr]
    );

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
