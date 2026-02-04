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
  auth: {
    username: process.env.AUTH_USERNAME || 'admin',
    password: process.env.AUTH_PASSWORD || 'changeme',
    jwtSecret: process.env.JWT_SECRET || 'glados-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '90d',
  },
} as const;
