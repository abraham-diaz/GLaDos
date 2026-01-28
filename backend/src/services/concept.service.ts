import { randomUUID } from 'crypto';
import { postgresService } from './postgres.service';
import { aiService } from './ai.service';
import { SimilarConcept, ConceptAssociationResult, ConceptState } from '../types/concept.types';

// Umbral para similitud semántica (MPNet - embedding_topic)
const TOPIC_SIMILARITY_THRESHOLD = 0.55;

class ConceptService {
  /**
   * Busca conceptos similares basándose en embedding_topic (MPNet)
   * Retorna conceptos con similitud >= threshold, ordenados por similitud descendente
   */
  async findSimilarByTopic(embeddingTopic: number[], limit = 5): Promise<SimilarConcept[]> {
    const pool = postgresService.getPool();
    const embeddingStr = `[${embeddingTopic.join(',')}]`;

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
           1 - (embedding_topic <=> $1::vector) as similarity
         FROM concepts
         WHERE embedding_topic IS NOT NULL
       ) sub
       WHERE similarity >= $2
       ORDER BY similarity DESC
       LIMIT $3`,
      [embeddingStr, TOPIC_SIMILARITY_THRESHOLD, limit]
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
   * Crea un nuevo concepto con ambos embeddings y summary
   */
  async create(
    text: string,
    embeddingPhrase: number[],
    embeddingTopic: number[]
  ): Promise<string> {
    const pool = postgresService.getPool();
    const id = randomUUID();
    const title = this.generateTitle(text);
    const embeddingPhraseStr = `[${embeddingPhrase.join(',')}]`;
    const embeddingTopicStr = `[${embeddingTopic.join(',')}]`;

    // Generar summary con KeyBERT
    let summary: string | null = null;
    try {
      const { summary: generatedSummary, keywords } = await aiService.getSummary(text);
      summary = generatedSummary;
      console.log(`[Concept] Keywords extracted: [${keywords.join(', ')}]`);
    } catch (error) {
      console.error('[Concept] Error generating summary:', error);
    }

    await pool.query(
      `INSERT INTO concepts (id, title, type, state, weight, embedding, embedding_topic, summary)
       VALUES ($1, $2, 'idea', 'cruda', 1, $3, $4, $5)`,
      [id, title, embeddingPhraseStr, embeddingTopicStr, summary]
    );

    console.log(`[Concept] CREATED new concept: "${title}" (${id})`);
    if (summary) {
      console.log(`[Concept] Summary: "${summary}"`);
    }
    return id;
  }

  /**
   * Refuerza un concepto existente:
   * - Incrementa weight
   * - Actualiza last_seen_at
   * - Cambia estado a 'recurrente' si weight >= 2
   */
  async reinforce(conceptId: string): Promise<void> {
    const pool = postgresService.getPool();

    // Incrementar weight y actualizar estado si corresponde
    const result = await pool.query<{ weight: number; state: string }>(
      `UPDATE concepts
       SET weight = weight + 1,
           last_seen_at = NOW(),
           state = CASE WHEN weight + 1 >= 2 THEN 'recurrente' ELSE state END
       WHERE id = $1
       RETURNING weight, state`,
      [conceptId]
    );

    const { weight, state } = result.rows[0];
    console.log(`[Concept] REINFORCED concept: ${conceptId} (weight: ${weight}, state: ${state})`);
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

  // TODO: Activar cuando termines de calibrar
  // private shouldReturnContext(concept: SimilarConcept): boolean {
  //   return concept.weight >= 2 && concept.state !== 'cruda';
  // }

  /**
   * Procesa automáticamente una entry para asociarla/crear concepto
   * Usa embedding_topic (MPNet) para encontrar similitud semántica
   */
  async processEntry(
    entryId: string,
    text: string,
    embeddingPhrase: number[],
    embeddingTopic: number[]
  ): Promise<ConceptAssociationResult> {
    // Buscar conceptos similares por tema (solo el mejor match)
    const similar = await this.findSimilarByTopic(embeddingTopic, 1);

    if (similar.length > 0) {
      // Caso: concepto similar encontrado -> asociar y reforzar
      const match = similar[0];

      await this.linkEntry(entryId, match.id, match.similarity);
      await this.reinforce(match.id);

      console.log(`[Concept] Entry matched existing concept: "${match.title}" (topic similarity: ${match.similarity.toFixed(3)}, weight: ${match.weight}, state: ${match.state})`);

      // MODO INSTRUMENTACIÓN: siempre devolver contexto para calibrar
      return {
        action: 'associated',
        conceptId: match.id,
        conceptTitle: match.title,
        similarity: match.similarity,
        context: {
          conceptId: match.id,
          title: match.title,
          state: match.state,
          summary: match.summary,
          similarity: match.similarity,
          weight: match.weight + 1, // +1 porque ya se reforzó
        },
      };
    } else {
      // Caso: no hay concepto similar -> crear nuevo
      const conceptId = await this.create(text, embeddingPhrase, embeddingTopic);
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

  /**
   * Lista todos los conceptos con sus estadísticas
   */
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

    const result = await pool.query(`
      SELECT
        c.id,
        c.title,
        c.type,
        c.state,
        c.weight,
        c.summary,
        c.created_at,
        c.last_seen_at,
        COUNT(ec.entry_id)::int as entry_count
      FROM concepts c
      LEFT JOIN entry_concept ec ON c.id = ec.concept_id
      GROUP BY c.id
      ORDER BY c.last_seen_at DESC
    `);

    return result.rows;
  }
}

export const conceptService = new ConceptService();
