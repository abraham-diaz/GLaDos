import { config } from '../config';
import { HealthChecker, ServiceStatus } from '../types/health.types';
import {
  EmbeddingResponse,
  DualEmbeddingResponse,
  SummaryResponse,
  ClassifyResponse,
} from '../types/ai.types';

class AiService implements HealthChecker {
  name = 'ai-service';
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.services.ai.url;
  }

  async check(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        return {
          status: 'healthy',
          latency: Date.now() - start,
        };
      }

      return {
        status: 'unhealthy',
        error: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  async getEmbedding(text: string): Promise<EmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    return response.json() as Promise<EmbeddingResponse>;
  }

  async getDualEmbedding(text: string): Promise<DualEmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}/analyze/dual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    return response.json() as Promise<DualEmbeddingResponse>;
  }

  async classifyType(text: string): Promise<ClassifyResponse> {
    const response = await fetch(`${this.baseUrl}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    return response.json() as Promise<ClassifyResponse>;
  }

  async getSummary(text: string): Promise<SummaryResponse> {
    const response = await fetch(`${this.baseUrl}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    return response.json() as Promise<SummaryResponse>;
  }

  async chat(message: string, history: { role: string; content: string }[], context: string): Promise<{ reply: string; model: string }> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, context }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    return response.json() as Promise<{ reply: string; model: string }>;
  }
}

export const aiService = new AiService();
