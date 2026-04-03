import { useState, useEffect, useCallback } from 'react';
import { getConcepts, searchConcepts } from '../../api/concepts';
import type { Concept, ConceptSearchResult, ConceptState, ConceptType } from '../../types';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import ConceptCard from './ConceptCard';

interface Props {
  refreshKey: number;
  onConceptClick: (id: string) => void;
}

export default function ConceptsPanel({ refreshKey, onConceptClick }: Props) {
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
  const [searchResults, setSearchResults] = useState<ConceptSearchResult[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<ConceptState | ''>('');
  const [typeFilter, setTypeFilter] = useState<ConceptType | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConcepts = useCallback(async () => {
    try {
      const concepts = await getConcepts();
      setAllConcepts(concepts);
      setError('');
    } catch (err) {
      if (err instanceof Error && err.message !== 'Session expired') {
        setError('Error al cargar conceptos.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearchResults(null);
    setSearchQuery('');
    loadConcepts();
  }, [refreshKey, loadConcepts]);

  async function handleSearch(query: string) {
    setLoading(true);
    try {
      const results = await searchConcepts(query);
      setSearchResults(results);
      setSearchQuery(query);
    } catch (err) {
      if (err instanceof Error && err.message !== 'Session expired') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setSearchResults(null);
    setSearchQuery('');
    setStateFilter('');
    setTypeFilter('');
    loadConcepts();
  }

  // Apply filters to all concepts (not search results)
  const displayConcepts = searchResults ?? allConcepts.filter(c => {
    if (stateFilter && c.state !== stateFilter) return false;
    if (typeFilter && (c.type || c.concept_type) !== typeFilter) return false;
    return true;
  });

  return (
    <section className="panel concepts-panel">
      <div className="panel-title">Conceptos</div>
      <SearchBar onSearch={handleSearch} onClear={handleClear} />

      {searchQuery && (
        <div className="search-info" style={{ display: 'flex' }}>
          Resultados para: <strong>&quot;{searchQuery}&quot;</strong> ({displayConcepts.length})
        </div>
      )}

      {!searchResults && (
        <FilterBar
          stateFilter={stateFilter}
          typeFilter={typeFilter}
          onStateChange={setStateFilter}
          onTypeChange={setTypeFilter}
        />
      )}

      <div className="concepts-list">
        {loading ? (
          <div className="loading">Cargando conceptos...</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : displayConcepts.length === 0 ? (
          <div className="empty-state">
            {allConcepts.length === 0
              ? 'No hay conceptos aun. Envia tu primera entrada.'
              : 'No hay conceptos con esos filtros.'}
          </div>
        ) : (
          displayConcepts.map(c => (
            <ConceptCard
              key={c.id}
              concept={c}
              showSimilarity={!!searchResults}
              similarity={(c as ConceptSearchResult).similarity}
              onClick={onConceptClick}
            />
          ))
        )}
      </div>
    </section>
  );
}
