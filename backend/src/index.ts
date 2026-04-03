import express from 'express';
import path from 'path';
import { config } from './config';
import { postgresService } from './services/postgres.service';
import { authMiddleware } from './middleware/auth.middleware';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import entryRoutes from './routes/entry.routes';
import analyzeRoutes from './routes/analyze.routes';
import conceptRoutes from './routes/concept.routes';
import chatRoutes from './routes/chat.routes';

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Public routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/entries', authMiddleware, entryRoutes);
app.use('/api/analyze', authMiddleware, analyzeRoutes);
app.use('/api/concepts', authMiddleware, conceptRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);

// SPA fallback — serve index.html for any non-API route
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(config.port, async () => {
  console.log(`Backend running on port ${config.port}`);
  await postgresService.runMigrations();
});
