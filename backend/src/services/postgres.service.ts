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

  async runMigrations(): Promise<void> {
    try {
      await this.pool.query(`
        ALTER TABLE entry_concept ADD COLUMN IF NOT EXISTS entry_type concept_type
      `);
      console.log('[Postgres] Migrations OK');
    } catch (error) {
      console.error('[Postgres] Migration error:', error);
    }
  }

  getPool(): Pool {
    return this.pool;
  }
}

export const postgresService = new PostgresService();
