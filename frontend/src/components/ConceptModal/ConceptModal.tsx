import { useState, useEffect, useCallback } from 'react';
import { getConceptDetail } from '../../api/concepts';
import type { ConceptDetail } from '../../types';
import WeightChart from './WeightChart';
import EntryItem from './EntryItem';

interface Props {
  conceptId: string;
  onClose: () => void;
  onChanged: () => void;
}

export default function ConceptModal({ conceptId, onClose, onChanged }: Props) {
  const [detail, setDetail] = useState<ConceptDetail | null>(null);
  const [error, setError] = useState('');

  const loadDetail = useCallback(async () => {
    try {
      const data = await getConceptDetail(conceptId);
      setDetail(data);
      setError('');
    } catch {
      setError('Error al cargar concepto');
    }
  }, [conceptId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleEntryChanged() {
    loadDetail();
    onChanged();
  }

  const concept = detail?.concept;
  const entries = detail?.entries || [];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{error || (concept ? (concept.summary || concept.title || 'Sin titulo') : 'Cargando...')}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {concept && (
          <>
            <div className="modal-badges">
              <span className="badge badge-state" data-state={concept.state}>{concept.state}</span>
              <span className="badge badge-type">{concept.type || ''}</span>
              <span className="concept-weight">Peso: {concept.weight}</span>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">Resumen</div>
              <div className="modal-summary">{concept.summary || 'Sin resumen disponible.'}</div>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">Evolucion de peso</div>
              <WeightChart entries={entries} />
            </div>

            <div className="modal-section">
              <div className="modal-section-title">Entries relacionadas</div>
              <div className="modal-entries">
                {entries.length === 0 ? (
                  <div className="empty-state">No hay entries vinculadas.</div>
                ) : (
                  entries.map(e => (
                    <EntryItem
                      key={e.id}
                      entry={e}
                      conceptId={conceptId}
                      onChanged={handleEntryChanged}
                    />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
