import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import { app } from './app.js';
import { env } from './lib/env.js';
import { logger } from './lib/logger.js';

const currentFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url || 'file://' + process.cwd() + '/index.js');
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);

// Find frontend dist directory if available
function getWebDistPath(): string | null {
  const possibleDistDirs = [
    path.resolve(process.cwd(), 'apps', 'web', 'dist'),
    path.resolve(process.cwd(), '..', 'web', 'dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(currentDir, '..', '..', 'web', 'dist'),
    path.resolve(currentDir, '..', '..', 'apps', 'web', 'dist'),
    path.resolve(currentDir, '..', 'apps', 'web', 'dist'),
    path.resolve(currentDir, 'dist'),
  ];

  for (const dir of possibleDistDirs) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

const webDist = getWebDistPath();
if (webDist) {
  logger.info(`Serving static frontend SPA from ${webDist}`);
  app.use(express.static(webDist));

  // SPA fallback for all non-API GET requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const url = req.originalUrl || req.url;
    if (
      url.startsWith('/api') ||
      url.startsWith('/health') ||
      url.startsWith('/uploads') ||
      url.startsWith('/api-docs')
    ) {
      return next();
    }
    const indexPath = path.join(webDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return next();
  });
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

