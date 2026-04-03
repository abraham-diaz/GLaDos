import { useState } from 'react';
import { updateEntryConcept } from '../../api/entries';
import { formatDate } from '../../utils/formatDate';
import type { ConceptDetailEntry } from '../../types';
import ReassignPicker from './ReassignPicker';

interface Props {
  entry: ConceptDetailEntry;
  conceptId: string;
  onChanged: () => void;
}

export default function EntryItem({ entry, conceptId, onChanged }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  async function handleUnlink() {
    if (!confirm('Desasociar esta entry del concepto?')) return;
    try {
      await updateEntryConcept(entry.id, 'unlink');
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleCreateConcept() {
    if (!confirm('Crear un nuevo concepto a partir de esta entry?')) return;
    try {
      await updateEntryConcept(entry.id, 'create');
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleReassign(newConceptId: string) {
    try {
      await updateEntryConcept(entry.id, 'reassign', newConceptId);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  }

  return (
    <div className="modal-entry">
      <div className="modal-entry-text">{entry.raw_text}</div>
      <div className="modal-entry-meta">
        <span>{formatDate(entry.created_at)}</span>
        {entry.entry_type && (
          <span className="badge badge-type">{entry.entry_type}</span>
        )}
        <span>Similitud: {(entry.similarity * 100).toFixed(1)}%</span>
      </div>
      <div className="modal-entry-actions">
        <button className="btn-action btn-reassign" onClick={() => setShowPicker(!showPicker)}>
          Reasignar
        </button>
        <button className="btn-action btn-create" onClick={handleCreateConcept}>
          Nuevo concepto
        </button>
        <button className="btn-action btn-unlink" onClick={handleUnlink}>
          Desasociar
        </button>
      </div>
      {showPicker && (
        <ReassignPicker
          currentConceptId={conceptId}
          onReassign={handleReassign}
          onCancel={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
