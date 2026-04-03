import { aiService } from './ai.service';
import { conceptService } from './concept.service';
import { ConceptAssociationResult, ConceptType, ConceptState } from '../types/concept.types';
import { CONCEPT } from '../constants';

class ConceptProcessor {

  //Process an entry to automatically associate it with an existing concept or create a new one

  async processEntry(
    entryId: string,
    text: string,
    embeddingPhrase: number[],
    embeddingTopic: number[]
  ): Promise<ConceptAssociationResult> {
    let entryType: ConceptType | undefined;
    let entryConfidence: number | undefined;
    try {
      const classifyResult = await aiService.classifyType(text);
      entryType = classifyResult.concept_type as ConceptType;
      entryConfidence = classifyResult.confidence;
      console.log(`[Concept] Entry classified as: ${entryType} (confidence: ${entryConfidence})`);
    } catch (error) {
      console.error('[Concept] Error classifying entry:', error);
    }

    //Look for candidates (fetch more to allow filtering after penalization)
    const candidates = await conceptService.findSimilarByTopic(embeddingTopic, 5);

    //Penalize similarity if the type does not match
    const scored = candidates.map(c => {
      const typeMismatch = entryType && c.type && entryType !== c.type;
      const effectiveSimilarity = typeMismatch
        ? c.similarity - CONCEPT.TYPE_MISMATCH_PENALTY
        : c.similarity;

      if (typeMismatch) {
        console.log(`[Concept] Type mismatch penalty: "${c.title}" (${c.type}) vs entry (${entryType}), similarity ${c.similarity.toFixed(3)} -> ${effectiveSimilarity.toFixed(3)}`);
      }

      return { ...c, effectiveSimilarity };
    });

    //Filter by effective threshold and take the best one
    const match = scored
      .filter(c => c.effectiveSimilarity >= CONCEPT.TOPIC_SIMILARITY_THRESHOLD)
      .sort((a, b) => b.effectiveSimilarity - a.effectiveSimilarity)[0];

    if (match) {
      await conceptService.linkEntry(entryId, match.id, match.similarity, entryType);
      await conceptService.reinforce(match.id);

      console.log(`[Concept] Entry matched existing concept: "${match.title}" (topic similarity: ${match.similarity.toFixed(3)}, effective: ${match.effectiveSimilarity.toFixed(3)}, weight: ${match.weight}, state: ${match.state})`);

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
          entryType,
          entryConfidence,
        },
      };
    } else {
      const conceptId = await this.createEnrichedConcept(text, embeddingPhrase, embeddingTopic);
      const title = conceptService.generateTitle(text);

      await conceptService.linkEntry(entryId, conceptId, 1.0);

      return {
        action: 'created',
        conceptId,
        conceptTitle: title,
      };
    }
  }

  //Create a concept with AI enrichment (summary + classification)

  async createEnrichedConcept(
    text: string,
    embeddingPhrase: number[],
    embeddingTopic: number[]
  ): Promise<string> {
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

    return conceptService.create({ text, embeddingPhrase, embeddingTopic, type: conceptType, summary });
  }

  async search(query: string, limit = 10): Promise<{
    id: string;
    title: string;
    type: string;
    state: ConceptState;
    summary: string | null;
    weight: number;
    similarity: number;
  }[]> {
    const { embedding_topic } = await aiService.getDualEmbedding(query);
    return conceptService.searchByEmbedding(embedding_topic, limit, query);
  }

  async reclassifyAll(): Promise<{ total: number; updated: number; results: { id: string; from: string; to: string }[] }> {
    const concepts = await conceptService.getAllWithTopEntry();
    const results: { id: string; from: string; to: string }[] = [];
    let updated = 0;

    for (const row of concepts) {
      const currentType = await conceptService.getTypeById(row.id);

      try {
        const { concept_type } = await aiService.classifyType(row.raw_text);

        if (concept_type !== currentType) {
          await conceptService.updateType(row.id, concept_type);
          updated++;
          console.log(`[Reclassify] ${row.id}: ${currentType} -> ${concept_type}`);
        }

        results.push({ id: row.id, from: currentType, to: concept_type });
      } catch (error) {
        console.error(`[Reclassify] Error for ${row.id}:`, error);
        results.push({ id: row.id, from: currentType, to: currentType });
      }
    }

    return { total: concepts.length, updated, results };
  }
}

export const conceptProcessor = new ConceptProcessor();
