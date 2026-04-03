import { useState, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import EntryPanel from './components/EntryPanel';
import ConceptsPanel from './components/ConceptsPanel/ConceptsPanel';
import ConceptModal from './components/ConceptModal/ConceptModal';
import ChatPanel from './components/Chat/ChatPanel';
import ChatFab from './components/Chat/ChatFab';

export default function App() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const refreshConcepts = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div id="appContainer">
      <Header />
      <main>
        <EntryPanel onEntryCreated={refreshConcepts} />
        <ConceptsPanel
          refreshKey={refreshKey}
          onConceptClick={setSelectedConceptId}
        />
      </main>

      {selectedConceptId && (
        <ConceptModal
          conceptId={selectedConceptId}
          onClose={() => setSelectedConceptId(null)}
          onChanged={refreshConcepts}
        />
      )}

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onConceptClick={setSelectedConceptId}
        onEntryCreated={refreshConcepts}
      />

      <ChatFab
        isOpen={chatOpen}
        onClick={() => setChatOpen(true)}
      />
    </div>
  );
}
