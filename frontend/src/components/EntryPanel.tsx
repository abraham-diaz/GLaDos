import { useState, useRef, type KeyboardEvent } from 'react';
import { createEntry } from '../api/entries';
import type { ConceptContext } from '../types';

interface Props {
  onEntryCreated: () => void;
}

export default function EntryPanel({ onEntryCreated }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConceptContext | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await createEntry(trimmed);
      const context = data.context || data.concept;
      if (context) {
        setResult(context);
      }
      setText('');
      onEntryCreated();
    } catch (err) {
      if (err instanceof Error && err.message !== 'Session expired') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit();
    }
  }

  return (
    <section className="panel entry-panel">
      <div className="panel-title">Nueva entrada</div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe una idea, error, aprendizaje o decision..."
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Procesando...' : 'Enviar'}
      </button>

      {(result || error) && (
        <div className="response-box visible">
          <div className="label">Resultado</div>
          {error ? (
            <div>{error}</div>
          ) : result && (
            <div>
              <strong>{result.summary || result.title || 'Concepto procesado'}</strong>
              {' '}
              <span className="badge badge-state" data-state={result.state}>{result.state}</span>
              {' '}
              <span className="badge badge-type">{result.entryType || ''}</span>
              <br />
              <span style={{ color: '#555' }}>Peso: {result.weight || 1}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
