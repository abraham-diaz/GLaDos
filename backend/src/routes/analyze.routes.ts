import { Router, Request, Response } from 'express';
import { aiService } from '../services/ai.service';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  try {
    const result = await aiService.getEmbedding(text);
    res.json({
      source: 'node',
      ai_response: result,
    });
  } catch (error) {
    res.status(502).json({
      error: 'AI service failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
