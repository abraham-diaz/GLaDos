import { Router, Request, Response } from 'express';
import { conceptService } from '../services/concept.service';
import { aiService } from '../services/ai.service';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // 1. Buscar conceptos relevantes con búsqueda semántica
    const concepts = await conceptService.search(message.trim(), 5);

    // 2. Enriquecer con entries reales de los top 3 conceptos
    const details = await Promise.all(
      concepts.slice(0, 3).map(c => conceptService.getDetail(c.id))
    );

    // 3. Construir contexto rico para el LLM
    const context = details
      .filter(d => d !== null)
      .map(d => {
        const c = d.concept;
        const entriesText = d.entries
          .slice(0, 5)
          .map(e => `  - ${e.raw_text}`)
          .join('\n');
        return `[${c.type}] ${c.title}${c.summary ? ' — ' + c.summary : ''} (peso: ${c.weight})\nEntries:\n${entriesText}`;
      })
      .join('\n\n');

    // 4. Llamar al chat de Groq via ai-service
    const result = await aiService.chat(message.trim(), history || [], context);

    // 5. Responder con reply y fuentes
    res.json({
      reply: result.reply,
      sources: concepts.slice(0, 3).map(c => ({
        id: c.id,
        title: c.title,
        type: c.type,
        similarity: c.similarity,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Chat failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
