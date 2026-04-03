import { Router, Request, Response } from 'express';
import { HealthChecker, HealthResponse } from '../types/health.types';
import { postgresService } from '../services/postgres.service';
import { aiService } from '../services/ai.service';

const router = Router();

// Each service must implement the HealthChecker interface
const healthCheckers: HealthChecker[] = [
  postgresService,
  aiService,
];

router.get('/', async (_req: Request, res: Response) => {
  const results = await Promise.all(
    healthCheckers.map(async (checker) => ({
      name: checker.name,
      status: await checker.check(),
    }))
  );

  const services = results.reduce(
    (acc, { name, status }) => ({ ...acc, [name]: status }),
    {}
  );

  const allHealthy = results.every((r) => r.status.status === 'healthy');

  const response: HealthResponse = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services,
  };

  res.status(allHealthy ? 200 : 503).json(response);
});

export default router;
