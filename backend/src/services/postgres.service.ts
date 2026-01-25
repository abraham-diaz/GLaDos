import { Pool } from 'pg';
import { config } from '../config';
import { HealthChecker, ServiceStatus } from '../types/health.types';

class PostgresService implements HealthChecker {
  name = 'postgres';
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
    });
  }

  async check(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return {
        status: 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  getPool(): Pool {
    return this.pool;
  }
}

export const postgresService = new PostgresService();
