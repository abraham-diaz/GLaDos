import { config } from '../config';
import { HealthChecker, ServiceStatus } from '../types/health.types';

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
        signal: AbortSignal.timeout(5000), // Timeout de 5s
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
}

export const aiService = new AiService();
