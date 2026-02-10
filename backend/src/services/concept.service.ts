import { randomUUID } from 'crypto';
import { postgresService } from './postgres.service';
import { aiService } from './ai.service';
import { SimilarConcept, ConceptAssociationResult, ConceptState, ConceptDetail, ConceptDetailEntry } from '../types/concept.types';
import { CONCEPT } from '../constants';
import { conceptQueries } from '../queries/concept.queries';

class ConceptService {
  /**
   * Busca conceptos similares basándose en embedding_topic (MPNet)
   */
  async findSimilarByTopic(embeddingTopic: number[], limit = 5): Promise<SimilarConcept[]> {
    const pool = postgresService.getPool();
    const embeddingStr = `[${embeddingTopic.join(',')}]`;

    const result = await pool.query<SimilarConcept>(
      conceptQueries.findSimilarByTopic,
      [embeddingStr, CONCEPT.TOPIC_SIMILARITY_THRESHOLD, limit]
    );

    return result.rows;
  }

  /**
   * Genera un título simple a partir del texto
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

    // Clasificar tipo y generar summary en paralelo
    let summary: string | null = null;
    let conceptType = 'idea';
    try {
      const [summaryResult, classifyResult] = await Promise.all([
        aiService.getSummary(text),
        aiService.classifyType(text),
      ]);
      summary = summaryResult.summary;
      conceptType = classifyResult.concept_type;
      console.log(`[Concept] Keywords extracted: [${summaryResult.keywords.join(', ')}]`);
      console.log(`[Concept] Classified as: ${conceptType} (confidence: ${classifyResult.confidence})`);
    } catch (error) {
      console.error('[Concept] Error generating summary/classifying:', error);
    }

    await pool.query(conceptQueries.create, [id, title, conceptType, embeddingPhraseStr, embeddingTopicStr, summary]);

    console.log(`[Concept] CREATED new concept: "${title}" (${id})`);
    if (summary) {
      console.log(`[Concept] Summary: "${summary}"`);
    }
    return id;
  }

  /**
   * Refuerza un concepto existente
   */
  async reinforce(conceptId: string): Promise<void> {
    const pool = postgresService.getPool();

    const result = await pool.query<{ weight: number; state: string }>(
      conceptQueries.reinforce,
      [conceptId, CONCEPT.MIN_WEIGHT_FOR_RECURRENT]
    );

    const { weight, state } = result.rows[0];
    console.log(`[Concept] REINFORCED concept: ${conceptId} (weight: ${weight}, state: ${state})`);
  }

  /**
   * Asocia una entry a un concepto
   */
  async linkEntry(entryId: string, conceptId: string, similarity: number): Promise<void> {
    const pool = postgresService.getPool();

    await pool.query(conceptQueries.linkEntry, [entryId, conceptId, similarity]);

    console.log(`[Concept] LINKED entry ${entryId} -> concept ${conceptId} (similarity: ${similarity.toFixed(3)})`);
  }

  /**
   * Procesa automáticamente una entry para asociarla/crear concepto
   */
  async processEntry(
    entryId: string,
    text: string,
    embeddingPhrase: number[],
    embeddingTopic: number[]
  ): Promise<ConceptAssociationResult> {
    const similar = await this.findSimilarByTopic(embeddingTopic, 1);

    if (similar.length > 0) {
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
          weight: match.weight + 1,
        },
      };
    } else {
      const conceptId = await this.create(text, embeddingPhrase, embeddingTopic);
      const title = this.generateTitle(text);

      await this.linkEntry(entryId, conceptId, 1.0);

      return {
        action: 'created',
        conceptId,
        conceptTitle: title,
      };
    }
  }

  /**
   * Búsqueda semántica de conceptos por texto
   */
  async search(query: string, limit = 10): Promise<{
    id: string;
    title: string;
    type: string;
    state: ConceptState;
    summary: string | null;
    weight: number;
    similarity: number;
  }[]> {
    const pool = postgresService.getPool();

    // Obtener embedding del query
    const { embedding_topic } = await aiService.getDualEmbedding(query);
    const embeddingStr = `[${embedding_topic.join(',')}]`;

    const result = await pool.query(conceptQueries.search, [embeddingStr, limit]);

    console.log(`[Concept] SEARCH for "${query}" returned ${result.rows.length} results`);
    return result.rows;
  }

  /**
   * Obtiene el detalle de un concepto con sus entries vinculadas
   */
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
    const result = await pool.query(conceptQueries.list);
    return result.rows;
  }
  /**
   * Reclasifica todos los conceptos existentes según el texto de su entry más relevante
   */
  async reclassifyAll(): Promise<{ total: number; updated: number; results: { id: string; from: string; to: string }[] }> {
    const pool = postgresService.getPool();

    const conceptsResult = await pool.query<{ id: string; raw_text: string }>(conceptQueries.getAllWithTopEntry);
    const results: { id: string; from: string; to: string }[] = [];
    let updated = 0;

    for (const row of conceptsResult.rows) {
      const currentType = (await pool.query(conceptQueries.getById, [row.id])).rows[0]?.type || 'idea';

      try {
        const { concept_type } = await aiService.classifyType(row.raw_text);

        if (concept_type !== currentType) {
          await pool.query(conceptQueries.updateType, [row.id, concept_type]);
          updated++;
          console.log(`[Reclassify] ${row.id}: ${currentType} -> ${concept_type}`);
        }

        results.push({ id: row.id, from: currentType, to: concept_type });
      } catch (error) {
        console.error(`[Reclassify] Error for ${row.id}:`, error);
        results.push({ id: row.id, from: currentType, to: currentType });
      }
    }

    return { total: conceptsResult.rows.length, updated, results };
  }
}

export const conceptService = new ConceptService();
