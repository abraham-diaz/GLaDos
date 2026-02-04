import express from 'express';
import path from 'path';
import { config } from './config';
import healthRoutes from './routes/health.routes';
import entryRoutes from './routes/entry.routes';
import analyzeRoutes from './routes/analyze.routes';
import conceptRoutes from './routes/concept.routes';

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas
app.use('/health', healthRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/concepts', conceptRoutes);

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
