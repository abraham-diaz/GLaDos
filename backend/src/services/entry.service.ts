import { randomUUID } from 'crypto';
import { postgresService } from './postgres.service';
import { CreateEntryRequest, CreateEntryResponse } from '../types/entry.types';

class EntryService {
  async create(data: CreateEntryRequest): Promise<CreateEntryResponse> {
    const id = randomUUID();
    const pool = postgresService.getPool();

    await pool.query(
      'INSERT INTO entries (id, raw_text) VALUES ($1, $2)',
      [id, data.raw_text]
    );

    return { id, status: 'created' };
  }
}

export const entryService = new EntryService();
