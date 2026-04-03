import { authFetch } from './client';
import type { Concept, ConceptSearchResult, ConceptDetail } from '../types';

export async function getConcepts(): Promise<Concept[]> {
  const res = await authFetch('/api/concepts');
  const data = await res.json();
  return Array.isArray(data) ? data : data.concepts || [];
}

export async function getConceptDetail(id: string): Promise<ConceptDetail> {
  const res = await authFetch(`/api/concepts/${id}`);
  if (!res.ok) throw new Error('Concept not found');
  return res.json();
}

export async function searchConcepts(query: string, limit = 10): Promise<ConceptSearchResult[]> {
  const res = await authFetch('/api/concepts/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en busqueda');
  return data.concepts || [];
}

export async function deleteConcept(id: string): Promise<void> {
  const res = await authFetch(`/api/concepts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar concepto');
}

export async function reclassifyAll(): Promise<{ total: number; updated: number }> {
  const res = await authFetch('/api/concepts/reclassify', { method: 'POST' });
  return res.json();
}
