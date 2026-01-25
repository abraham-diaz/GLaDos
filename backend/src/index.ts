import express from 'express';
import { config } from './config';
import healthRoutes from './routes/health.routes';
import entryRoutes from './routes/entry.routes';
import analyzeRoutes from './routes/analyze.routes';

const app = express();

app.use(express.json());

// Rutas
app.use('/health', healthRoutes);
app.use('/api/entries', entryRoutes);
app.use('/api/analyze', analyzeRoutes);

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
