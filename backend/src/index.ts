import express from 'express';
import path from 'path';
import { config } from './config';
import { authMiddleware } from './middleware/auth.middleware';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import entryRoutes from './routes/entry.routes';
import analyzeRoutes from './routes/analyze.routes';
import conceptRoutes from './routes/concept.routes';

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

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
