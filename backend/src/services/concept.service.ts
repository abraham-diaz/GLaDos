import { randomUUID } from 'crypto';
import { postgresService } from './postgres.service';
import { SimilarConcept, ConceptAssociationResult, ConceptState } from '../types/concept.types';

const CONCEPT_SIMILARITY_THRESHOLD = 0.7;

class ConceptService {
  /**
   * Busca conceptos similares basándose en similitud coseno del embedding
   * Retorna conceptos con similitud >= threshold, ordenados por similitud descendente
   */
  async findSimilar(embedding: number[], limit = 5): Promise<SimilarConcept[]> {
    const pool = postgresService.getPool();
    const embeddingStr = `[${embedding.join(',')}]`;

    // Usar 1 - distancia coseno = similitud coseno
    // pgvector usa <=> para distancia coseno
    const result = await pool.query<SimilarConcept>(
      `SELECT id, title, state, summary, weight, similarity
       FROM (
         SELECT
           id,
           title,
           state,
           summary,
           weight,
           1 - (embedding <=> $1::vector) as similarity
         FROM concepts
         WHERE embedding IS NOT NULL
       ) sub
       WHERE similarity >= $2
       ORDER BY similarity DESC
       LIMIT $3`,
      [embeddingStr, CONCEPT_SIMILARITY_THRESHOLD, limit]
    );

    return result.rows;
  }

  /**
   * Genera un título simple a partir del texto
   * Usa las primeras palabras (máximo 5 palabras o 50 caracteres)
   */
  private generateTitle(text: string): string {
    const words = text.trim().split(/\s+/).slice(0, 5);
    let title = words.join(' ');

    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }

    return title || 'Sin título';
  }

  /**
   * Crea un nuevo concepto
   */
  async create(text: string, embedding: number[]): Promise<string> {
    const pool = postgresService.getPool();
    const id = randomUUID();
    const title = this.generateTitle(text);
    const embeddingStr = `[${embedding.join(',')}]`;

    await pool.query(
      `INSERT INTO concepts (id, title, type, state, weight, embedding)
       VALUES ($1, $2, 'idea', 'cruda', 1, $3)`,
      [id, title, embeddingStr]
    );

    console.log(`[Concept] CREATED new concept: "${title}" (${id})`);
    return id;
  }

  /**
   * Refuerza un concepto existente:
   * - Incrementa weight
   * - Actualiza last_seen_at
   */
  async reinforce(conceptId: string): Promise<void> {
    const pool = postgresService.getPool();

    await pool.query(
      `UPDATE concepts
       SET weight = weight + 1,
           last_seen_at = NOW()
       WHERE id = $1`,
      [conceptId]
    );

    console.log(`[Concept] REINFORCED concept: ${conceptId}`);
  }

  /**
   * Asocia una entry a un concepto
   */
  async linkEntry(entryId: string, conceptId: string, similarity: number): Promise<void> {
    const pool = postgresService.getPool();

    await pool.query(
      `INSERT INTO entry_concept (entry_id, concept_id, similarity)
       VALUES ($1, $2, $3)
       ON CONFLICT (entry_id, concept_id) DO NOTHING`,
      [entryId, conceptId, similarity]
    );

    console.log(`[Concept] LINKED entry ${entryId} -> concept ${conceptId} (similarity: ${similarity.toFixed(3)})`);
  }

  /**
   * Determina si un concepto debe devolver contexto al usuario
   * Regla: weight >= 2 AND state != 'cruda'
   */
  private shouldReturnContext(concept: SimilarConcept): boolean {
    return concept.weight >= 2 && concept.state !== 'cruda';
  }

  /**
   * Procesa automáticamente una entry para asociarla/crear concepto
   * Esta es la función principal que se llama después de crear una entry
   */
  async processEntry(
    entryId: string,
    text: string,
    embedding: number[]
  ): Promise<ConceptAssociationResult> {
    // Buscar conceptos similares (solo el mejor match)
    const similar = await this.findSimilar(embedding, 1);

    if (similar.length > 0) {
      // Caso: concepto similar encontrado -> asociar y reforzar
      const match = similar[0];

      await this.linkEntry(entryId, match.id, match.similarity);
      await this.reinforce(match.id);

      console.log(`[Concept] Entry matched existing concept: "${match.title}" (similarity: ${match.similarity.toFixed(3)}, weight: ${match.weight}, state: ${match.state})`);

      const result: ConceptAssociationResult = {
        action: 'associated',
        conceptId: match.id,
        conceptTitle: match.title,
        similarity: match.similarity,
      };

      // Solo devolver contexto si cumple las condiciones
      if (this.shouldReturnContext(match)) {
        result.context = {
          conceptId: match.id,
          title: match.title,
          state: match.state,
          summary: match.summary,
        };
        console.log(`[Concept] Context returned for concept: "${match.title}"`);
      } else {
        console.log(`[Concept] No context returned (weight: ${match.weight}, state: ${match.state})`);
      }

      return result;
    } else {
      // Caso: no hay concepto similar -> crear nuevo
      const conceptId = await this.create(text, embedding);
      const title = this.generateTitle(text);

      // Vincular la entry al nuevo concepto
      await this.linkEntry(entryId, conceptId, 1.0);

      return {
        action: 'created',
        conceptId,
        conceptTitle: title,
      };
    }
  }
}

export const conceptService = new ConceptService();
