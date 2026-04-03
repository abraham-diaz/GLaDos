import { useState, type KeyboardEvent } from 'react';

interface Props {
  onSearch: (query: string) => void;
  onClear: () => void;
}

export default function SearchBar({ onSearch, onClear }: Props) {
  const [query, setQuery] = useState('');

  function handleSearch() {
    if (query.trim()) {
      onSearch(query.trim());
    } else {
      onClear();
    }
  }

  function handleClear() {
    setQuery('');
    onClear();
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="search-box">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Buscar semanticamente..."
      />
      <button onClick={handleSearch}>Buscar</button>
      <button className="btn-clear" onClick={handleClear}>Limpiar</button>
    </div>
  );
}
