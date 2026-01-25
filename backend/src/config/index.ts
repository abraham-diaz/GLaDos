export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || 'postgres://glados:glados@localhost:5432/glados',
  },
  services: {
    ai: {
      url: process.env.AI_SERVICE_URL || 'http://ai-service:8000',
    },
  },
} as const;
