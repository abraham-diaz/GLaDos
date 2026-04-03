import type { ConceptState, ConceptType } from '../../types';

interface Props {
  stateFilter: string;
  typeFilter: string;
  onStateChange: (state: ConceptState | '') => void;
  onTypeChange: (type: ConceptType | '') => void;
}

export default function FilterBar({ stateFilter, typeFilter, onStateChange, onTypeChange }: Props) {
  return (
    <div className="filter-bar">
      <select value={stateFilter} onChange={e => onStateChange(e.target.value as ConceptState | '')}>
        <option value="">Estado: Todos</option>
        <option value="cruda">Cruda</option>
        <option value="recurrente">Recurrente</option>
        <option value="importante">Importante</option>
        <option value="dormida">Dormida</option>
        <option value="resuelta">Resuelta</option>
      </select>
      <select value={typeFilter} onChange={e => onTypeChange(e.target.value as ConceptType | '')}>
        <option value="">Tipo: Todos</option>
        <option value="idea">Idea</option>
        <option value="error">Error</option>
        <option value="aprendizaje">Aprendizaje</option>
        <option value="decision">Decision</option>
      </select>
    </div>
  );
}
