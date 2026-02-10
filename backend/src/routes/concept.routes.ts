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

router.post('/reclassify', async (_req: Request, res: Response) => {
  try {
    const result = await conceptService.reclassifyAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reclassify concepts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const detail = await conceptService.getDetail(req.params.id);
    if (!detail) {
      res.status(404).json({ error: 'Concept not found' });
      return;
    }
    res.json(detail);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get concept detail',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, limit } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const concepts = await conceptService.search(query.trim(), limit || 10);
    res.json({
      query: query.trim(),
      count: concepts.length,
      concepts,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search concepts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
