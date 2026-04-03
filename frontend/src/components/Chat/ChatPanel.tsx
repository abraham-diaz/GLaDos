import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { sendMessage } from '../../api/chat';
import type { ChatMessage, ChatSource } from '../../types';
import ChatBubble from './ChatBubble';
import SaveEntryModal from './SaveEntryModal';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  isTyping?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConceptClick: (id: string) => void;
  onEntryCreated: () => void;
}

export default function ChatPanel({ isOpen, onClose, onConceptClick, onEntryCreated }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [saveText, setSaveText] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    function handleKey(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  async function handleSend() {
    const message = input.trim();
    if (!message || sending) return;

    const userMsg: DisplayMessage = { role: 'user', content: message };
    const typingMsg: DisplayMessage = { role: 'assistant', content: 'Pensando...', isTyping: true };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setInput('');
    setSending(true);

    try {
      const data = await sendMessage(message, history);

      const assistantMsg: DisplayMessage = {
        role: 'assistant',
        content: data.reply,
        sources: data.sources,
      };

      setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
      setHistory(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      const errorMsg: DisplayMessage = {
        role: 'assistant',
        content: err instanceof Error && err.message !== 'Session expired'
          ? `Error: ${err.message}`
          : 'Error de conexion',
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="chat-panel">
        <div className="chat-header">
          <span className="chat-header-title">Chat con GLaDOS</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="chat-messages" ref={messagesRef}>
          {messages.map((msg, i) => (
            <ChatBubble
              key={i}
              role={msg.role}
              content={msg.content}
              isTyping={msg.isTyping}
              sources={msg.sources}
              onConceptClick={onConceptClick}
              onSave={msg.role === 'assistant' && !msg.isTyping ? setSaveText : undefined}
            />
          ))}
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre tu conocimiento..."
            rows={2}
          />
          <button className="btn-chat-send" onClick={handleSend} disabled={sending}>
            Enviar
          </button>
        </div>
      </div>

      {saveText !== null && (
        <SaveEntryModal
          initialText={saveText}
          onClose={() => setSaveText(null)}
          onSaved={onEntryCreated}
        />
      )}
    </>
  );
}
