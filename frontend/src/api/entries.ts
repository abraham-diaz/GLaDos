import { authFetch } from './client';
import type { CreateEntryResponse } from '../types';

export async function createEntry(rawText: string): Promise<CreateEntryResponse> {
  const res = await authFetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_text: rawText }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al crear entry');
  return data;
}

export async function updateEntryConcept(
  entryId: string,
  action: 'unlink' | 'create' | 'reassign',
  conceptId?: string
): Promise<void> {
  const body = action === 'reassign'
    ? { conceptId }
    : { action };

  const res = await authFetch(`/api/entries/${entryId}/concept`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Error al actualizar entry');
  }
}
