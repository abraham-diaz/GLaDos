import type { ChatSource } from '../../types';
import ChatSources from './ChatSources';

interface Props {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
  sources?: ChatSource[];
  onConceptClick: (id: string) => void;
  onSave?: (text: string) => void;
}

export default function ChatBubble({ role, content, isTyping, sources, onConceptClick, onSave }: Props) {
  const className = `chat-bubble chat-bubble-${role}${isTyping ? ' chat-bubble-typing' : ''}`;

  return (
    <div className={className}>
      <div>{content}</div>
      {sources && sources.length > 0 && (
        <ChatSources sources={sources} onConceptClick={onConceptClick} />
      )}
      {role === 'assistant' && !isTyping && onSave && (
        <button
          className="btn-chat-save"
          onClick={() => onSave(content)}
        >
          Guardar como entry
        </button>
      )}
    </div>
  );
}
