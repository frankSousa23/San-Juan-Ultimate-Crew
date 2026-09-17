/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * SERVIDOR PRINCIPAL Y ENTRADA DE LA APLICACIÓN (server.ts)
 * ============================================================================
 */

import path from 'path';
import fs from 'fs';
import express, { Request, Response, NextFunction } from 'express';
import { app } from './apps/api/src/app.js';
import { errorLogger } from './apps/api/src/middleware/logging.js';
import { errorHandler } from './apps/api/src/middleware/errorHandler.js';

const currentFilename = typeof __filename !== 'undefined' 
  ? __filename 
  : (process.argv && process.argv[1]) || path.resolve(process.cwd(), 'server.js');
const currentDir = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(currentFilename);

const PORT = 3000;

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
    path.resolve(process.cwd(), 'apps', 'web', 'dist', 'index.html'),
    path.resolve(currentDir, 'dist', 'index.html'),
    path.resolve(currentDir, 'index.html'),
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
  const { webDir, distPath, distIndexPath, sourceIndexPath } = getWebPaths();
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        root: webDir,
        configFile: path.resolve(webDir, 'vite.config.ts'),
        server: {
          middlewareMode: true,
          host: '0.0.0.0',
          port: PORT,
          allowedHosts: true,
        },
        appType: 'custom',
      });

      // 1. Inyectar middlewares de Vite para servir módulos HMR/ESM bajo demanda
      app.use(vite.middlewares);

      // 2. Servir e inyectar scripts en index.html para cualquier ruta GET del frontend
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
          if (fs.existsSync(indexPath)) {
            let template = fs.readFileSync(indexPath, 'utf-8');
            template = await vite.transformIndexHtml(url, template);
            res.status(200).set({ 'Content-Type': 'text/html' });
            if (req.method === 'HEAD') {
              return res.end();
            }
            return res.end(template);
          }
          return next();
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
    } catch (viteErr) {
      console.warn('[Server Warning] No se pudo inicializar Vite Middleware en desarrollo, utilizando servicio estático:', viteErr);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath, { maxAge: '1h', index: false }));
        app.get('*all', (req: Request, res: Response) => {
          if (fs.existsSync(distIndexPath)) {
            return res.sendFile(distIndexPath);
          }
          res.status(200).send('SIGEDIVO backend activo.');
        });
      }
    }
  } else {
    // Modo producción
    const possibleStaticDirs = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(process.cwd(), 'apps', 'web', 'dist'),
      path.resolve(process.cwd(), 'apps', 'api', 'dist', 'web'),
      distPath,
    ];

    const registeredDirs = new Set<string>();
    for (const sDir of possibleStaticDirs) {
      if (sDir && fs.existsSync(sDir) && !registeredDirs.has(sDir)) {
        registeredDirs.add(sDir);
        app.use(express.static(sDir, { maxAge: '1h', index: false }));
      }
    }

    app.get('*all', (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(200).send('SIGEDIVO producción listo.');
    });
  }

  // Manejo de errores global
  app.use(errorLogger);
  app.use(errorHandler);

  // Inicio de escucha en la interfaz de red
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] SIGEDIVO activo en http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

// Ejecución con captura de excepciones fatales
startServer().catch((err) => {
  console.error('[Server Error Fatal]', err);
  process.exit(1);
});
