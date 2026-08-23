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

  const candidateIndexPaths = [
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(currentDir, 'index.html'),
    path.resolve(process.cwd(), 'apps', 'web', 'dist', 'index.html'),
    path.resolve(currentDir, '..', 'apps', 'web', 'dist', 'index.html'),
    path.resolve(currentDir, 'apps', 'web', 'dist', 'index.html'),
    path.resolve(currentDir, 'dist', 'index.html'),
  ];

  let distIndexPath = '';
  let distPath = '';

  for (const candidate of candidateIndexPaths) {
    if (fs.existsSync(candidate)) {
      distIndexPath = candidate;
      distPath = path.dirname(candidate);
      break;
    }
  }

  if (!distPath) {
    distPath = path.resolve(process.cwd(), 'dist');
    distIndexPath = path.join(distPath, 'index.html');
  }

  return {
    webDir,
    distPath,
    distIndexPath,
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
    // Serve static assets from the found distPath and fallback dist directories
    const staticDirs = [
      distPath,
      path.resolve(process.cwd(), 'dist'),
      path.resolve(process.cwd(), 'apps', 'web', 'dist'),
      path.resolve(currentDir),
      path.resolve(currentDir, '..', 'apps', 'web', 'dist'),
    ];

    const registeredDirs = new Set<string>();
    for (const sDir of staticDirs) {
      if (sDir && fs.existsSync(sDir) && !registeredDirs.has(sDir)) {
        registeredDirs.add(sDir);
        app.use(express.static(sDir));
      }
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

      const candidateFiles = [
        distIndexPath,
        path.resolve(process.cwd(), 'dist', 'index.html'),
        path.resolve(process.cwd(), 'apps', 'web', 'dist', 'index.html'),
        path.resolve(currentDir, 'index.html'),
        path.resolve(currentDir, 'dist', 'index.html'),
        path.resolve(currentDir, '..', 'apps', 'web', 'dist', 'index.html'),
        sourceIndexPath,
      ];

      for (const filePath of candidateFiles) {
        if (filePath && fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
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
