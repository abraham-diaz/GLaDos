import { Router, Request, Response } from 'express';
import { entryService } from '../services/entry.service';
import { CreateEntryRequest } from '../types/entry.types';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const body = req.body as CreateEntryRequest;

  // Validación mínima
  if (!body.raw_text || typeof body.raw_text !== 'string') {
    res.status(400).json({ error: 'raw_text is required' });
    return;
  }

  if (body.raw_text.trim().length === 0) {
    res.status(400).json({ error: 'raw_text cannot be empty' });
    return;
  }

  try {
    const result = await entryService.create(body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create entry',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
