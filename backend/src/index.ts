import express from 'express';
import { config } from './config';
import healthRoutes from './routes/health.routes';
import entryRoutes from './routes/entry.routes';

const app = express();

app.use(express.json());

// Rutas
app.use('/health', healthRoutes);
app.use('/api/entries', entryRoutes);

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
