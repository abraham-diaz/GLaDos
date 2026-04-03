import { useState, useEffect } from 'react';
import { getConcepts } from '../../api/concepts';
import type { Concept } from '../../types';

interface Props {
  currentConceptId: string;
  onReassign: (conceptId: string) => void;
  onCancel: () => void;
}

export default function ReassignPicker({ currentConceptId, onReassign, onCancel }: Props) {
  const [concepts, setConcepts] = useState<Concept[]>([]);

  useEffect(() => {
    getConcepts().then(all => {
      setConcepts(all.filter(c => c.id !== currentConceptId));
    });
  }, [currentConceptId]);

  if (concepts.length === 0) {
    return (
      <div className="reassign-picker">
        <div className="reassign-picker-title">No hay otros conceptos disponibles.</div>
        <button className="btn-action btn-cancel" onClick={onCancel}>Cerrar</button>
      </div>
    );
  }

  return (
    <div className="reassign-picker">
      <div className="reassign-picker-title">Selecciona el concepto destino:</div>
      <div className="reassign-picker-list">
        {concepts.map(c => (
          <div key={c.id} className="reassign-picker-item" onClick={() => onReassign(c.id)}>
            <span className="concept-title">{c.summary || c.title}</span>
            {' '}
            <span className="badge badge-type">{c.type || ''}</span>
          </div>
        ))}
      </div>
      <button className="btn-action btn-cancel" onClick={onCancel}>Cancelar</button>
    </div>
  );
}
