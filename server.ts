import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import { app } from './apps/api/src/app.js';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = 3000;
  const webDir = path.resolve(__dirname, 'apps', 'web');

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'custom',
      root: webDir,
    });

    // 1. Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // 2. Serve index.html for all non-API GET requests
    app.use(async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') return next();

      const url = req.originalUrl || req.url;
      if (
        url.startsWith('/api') ||
        url.startsWith('/health') ||
        url.startsWith('/uploads') ||
        url.startsWith('/api-docs')
      ) {
        return next();
      }

      try {
        const indexPath = path.resolve(webDir, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(webDir, 'dist');
    app.use(express.static(distPath));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') return next();
      const url = req.originalUrl || req.url;
      if (
        url.startsWith('/api') ||
        url.startsWith('/health') ||
        url.startsWith('/uploads') ||
        url.startsWith('/api-docs')
      ) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] SIGEDIVO (Sistema de Gestión para el Disco Volador) running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error]', err);
  process.exit(1);
});
