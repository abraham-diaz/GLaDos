import { useState } from 'react';
import { createEntry } from '../../api/entries';

interface Props {
  initialText: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveEntryModal({ initialText, onClose, onSaved }: Props) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSaving(true);
    setError('');

    try {
      await createEntry(trimmed);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content chat-save-modal">
        <div className="modal-header">
          <h2>Guardar como entry</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <textarea
          className="chat-save-modal-textarea"
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
        />
        {error && <div style={{ color: '#ff4444', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{error}</div>}
        <div className="chat-save-modal-actions">
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button className="btn-action btn-cancel" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
