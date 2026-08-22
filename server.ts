import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import { app } from './apps/api/src/app.js';


const currentFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url || 'file://' + process.cwd() + '/index.js');
const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(currentFilename);

function getWebPaths() {
  const possibleWebDirs = [
    path.resolve(process.cwd(), 'apps', 'web'),
    path.resolve(currentDir, 'apps', 'web'),
    path.resolve(currentDir, '..', 'apps', 'web'),
  ];
  
  let webDir = possibleWebDirs[0];
  for (const dir of possibleWebDirs) {
    if (fs.existsSync(dir)) {
      webDir = dir;
      break;
    }
  }

  const possibleDistDirs = [
    path.join(webDir, 'dist'),
    path.resolve(process.cwd(), 'apps', 'web', 'dist'),
    path.resolve(currentDir, 'dist'),
  ];

  let distPath = possibleDistDirs[0];
  for (const dir of possibleDistDirs) {
    if (fs.existsSync(dir)) {
      distPath = dir;
      break;
    }
  }

  return {
    webDir,
    distPath,
    distIndexPath: path.join(distPath, 'index.html'),
    sourceIndexPath: path.join(webDir, 'index.html'),
  };
}

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const { webDir, distPath, distIndexPath, sourceIndexPath } = getWebPaths();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import("vite"); 
    const vite = await createViteServer({
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
        const indexPath = fs.existsSync(sourceIndexPath) ? sourceIndexPath : path.resolve(webDir, 'index.html');
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
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
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
      if (fs.existsSync(distIndexPath)) {
        return res.sendFile(distIndexPath);
      }
      if (fs.existsSync(sourceIndexPath)) {
        return res.sendFile(sourceIndexPath);
      }
      return next();
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
