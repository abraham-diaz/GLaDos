import type { ChatSource } from '../../types';

interface Props {
  sources: ChatSource[];
  onConceptClick: (id: string) => void;
}

export default function ChatSources({ sources, onConceptClick }: Props) {
  return (
    <div className="chat-sources">
      {sources.map(s => (
        <span
          key={s.id}
          className="chat-source-badge"
          onClick={() => onConceptClick(s.id)}
        >
          {s.title} ({(s.similarity * 100).toFixed(0)}%)
        </span>
      ))}
    </div>
  );
}
