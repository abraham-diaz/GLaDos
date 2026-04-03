import { authFetch } from './client';
import type { ChatMessage, ChatResponse } from '../types';

export async function sendMessage(
  message: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  const res = await authFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.details || 'Error en chat');
  return data;
}
