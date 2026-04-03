import type { Concept } from '../../types';

interface Props {
  concept: Concept;
  showSimilarity?: boolean;
  similarity?: number;
  onClick: (id: string) => void;
}

export default function ConceptCard({ concept, showSimilarity, similarity, onClick }: Props) {
  const displayType = concept.concept_type || concept.type || '';

  return (
    <div className="concept-card" onClick={() => onClick(concept.id)}>
      <div className="concept-header">
        <span className="concept-title">
          {concept.summary || concept.title || 'Sin titulo'}
        </span>
        {showSimilarity && similarity !== undefined && (
          <span className="similarity-score">{(similarity * 100).toFixed(1)}%</span>
        )}
        <span className="badge badge-state" data-state={concept.state || ''}>
          {concept.state || ''}
        </span>
        <span className="badge badge-type">{displayType}</span>
      </div>
      {concept.keywords && (
        <div className="concept-summary">{concept.keywords}</div>
      )}
      <div className="concept-weight">Peso: {concept.weight || 1}</div>
    </div>
  );
}
