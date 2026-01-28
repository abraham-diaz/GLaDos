import { Router, Request, Response } from 'express';
import { conceptService } from '../services/concept.service';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const concepts = await conceptService.list();
    res.json({
      count: concepts.length,
      concepts,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list concepts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
