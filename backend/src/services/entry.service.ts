import { randomUUID } from 'crypto';
import { postgresService } from './postgres.service';
import { aiService } from './ai.service';
import { CreateEntryRequest, CreateEntryResponse } from '../types/entry.types';

class EntryService {
  async create(data: CreateEntryRequest): Promise<CreateEntryResponse> {
    const id = randomUUID();
    const pool = postgresService.getPool();

    // Obtener embedding del servicio AI
    const { embedding } = await aiService.getEmbedding(data.raw_text);

    // Formato para pgvector: '[0.1, 0.2, ...]'
    const embeddingStr = `[${embedding.join(',')}]`;

    await pool.query(
      'INSERT INTO entries (id, raw_text, embedding) VALUES ($1, $2, $3)',
      [id, data.raw_text, embeddingStr]
    );

    return { id, status: 'created' };
  }
}

export const entryService = new EntryService();
