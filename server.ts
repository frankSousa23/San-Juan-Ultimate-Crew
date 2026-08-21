import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import { app } from './apps/api/src/app.js';


const currentFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url || 'file://' + process.cwd() + '/index.js');
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);

async function startServer() {
  const PORT = 3000;
  const webDir = path.resolve(currentDir, 'apps', 'web');

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import("vite"); const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'custom',
      root: webDir,
    });

    // 1. Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // 2. Serve index.html for all non-API GET/HEAD requests
    app.use(async (req: Request, res: Response, next: NextFunction) => {
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

      try {
        const indexPath = path.resolve(webDir, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' });
        if (req.method === 'HEAD') {
          return res.end();
        }
        res.end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(webDir, 'dist');
    app.use(express.static(distPath));
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
