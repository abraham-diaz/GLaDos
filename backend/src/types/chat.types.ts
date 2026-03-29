export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSource {
  id: string;
  title: string;
  type: string;
  similarity: number;
}
