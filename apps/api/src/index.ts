import { app, findWebDistPath } from './app.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';

const webDist = findWebDistPath();
if (webDist) {
  logger.info(`Frontend SPA assets configured from: ${webDist}`);
} else {
  logger.warn('Frontend SPA assets not found in standard directories');
}

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

