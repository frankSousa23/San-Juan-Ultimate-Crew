import { app } from './app.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';

try {
  app.listen(env.PORT, () => {
    logger.info('API server started', {
      port: env.PORT,
      environment: env.NODE_ENV,
      authRequired: env.AUTH_REQUIRED,
    });
  });
} catch (error) {
  logger.error('Failed to start server', error);
  process.exit(1);
}


