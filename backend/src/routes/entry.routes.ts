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

router.put('/:id/concept', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, conceptId } = req.body;

  try {
    let result;

    if (action === 'unlink') {
      result = await entryService.unlinkFromConcept(id);
    } else if (action === 'create') {
      result = await entryService.createConceptFromEntry(id);
    } else if (conceptId) {
      result = await entryService.reassignToConcept(id, conceptId);
    } else {
      res.status(400).json({ error: 'Provide "action" (unlink|create) or "conceptId"' });
      return;
    }

    res.json(result);
  } catch (error) {
    const status = error instanceof Error && error.message === 'Entry not found' ? 404 : 500;
    res.status(status).json({
      error: 'Failed to reassign entry',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
