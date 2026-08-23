import { app } from './app.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';

const port = Number(env.PORT || process.env.PORT || 3000);

try {
  app.listen(port, '0.0.0.0', () => {
    logger.info('API server started', {
      port,
      host: '0.0.0.0',
      environment: env.NODE_ENV,
      authRequired: env.AUTH_REQUIRED,
    });
  });
} catch (error) {
  logger.error('Failed to start server', error);
  process.exit(1);
}


