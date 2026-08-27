/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * SERVIDOR PRINCIPAL Y ENTRADA DE LA APLICACIÓN (server.ts)
 * ============================================================================
 * 
 * Este archivo actúa como el punto de entrada unificado para el despliegue tanto
 * en entornos de desarrollo local como en producción (Cloud Run / VPS / PaaS).
 * 
 * ARQUITECTURA DE SERVICIO:
 * 1. API Express (/api/*, /health, /uploads, /api-docs) servida a través de `app`.
 * 2. En DESARROLLO (NODE_ENV !== 'production'):
 *    - Se monta Vite en modo middleware para transformar y servir módulos TSX/CSS
 *      en caliente de forma nativa sobre el puerto 3000.
 * 3. En PRODUCCIÓN (NODE_ENV === 'production'):
 *    - Se buscan y sirven los artefactos estáticos compilados en `dist/` o `apps/web/dist/`
 *    - Todas las rutas no-API son redirigidas a `index.html` (SPA Fallback) para que
 *      React Router maneje la navegación del cliente sin errores 404.
 * 
 * PUERTO Y SEGURIDAD:
 * - Escucha estrictamente en '0.0.0.0' y puerto 3000 (o process.env.PORT si se define).
 * ============================================================================
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express, { Request, Response, NextFunction } from 'express';
import { app } from './apps/api/src/app.js';

// Determinación segura de __filename y __dirname para compatibilidad ESM / Node.js
const currentFilename = typeof __filename !== 'undefined' 
  ? __filename 
  : (process.argv && process.argv[1]) || path.resolve(process.cwd(), 'server.js');
const currentDir = typeof __dirname !== 'undefined' 
  ? __dirname 
  : path.dirname(currentFilename);

/**
 * Resuelve dinámicamente las rutas del frontend tanto en mono-repositorio
 * como en entornos de despliegue empaquetados.
 */
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

  // Candidatos para encontrar el index.html compilado en producción
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

/**
 * Inicializador asíncrono del servidor web y API REST.
 */
async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const { webDir, distPath, distIndexPath, sourceIndexPath } = getWebPaths();

  const isProduction = 
    process.env.NODE_ENV === 'production' || 
    !fs.existsSync(path.resolve(webDir, 'src')) || 
    fs.existsSync(distIndexPath);

  if (!isProduction) {
    try {
      // ========================================================================
      // MODO DESARROLLO: Vite Server Middleware
      // ========================================================================
      const { createServer: createViteServer } = await import("vite"); 
      const vite = await createViteServer({
        server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
        appType: 'custom',
        root: webDir,
      });

      // 1. Inyectar middlewares de Vite para servir módulos HMR/ESM bajo demanda
      app.use(vite.middlewares);

      // 2. Servir e inyectar scripts en index.html para cualquier ruta GET del frontend
      app.use(async (req: Request, res: Response, next: NextFunction) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();

        const url = req.originalUrl || req.url;
        // Omitir endpoints de backend para que continúen al enrutador de Express
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
    }
  }

  // Inicio de escucha en la interfaz de red
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] SIGEDIVO (Sistema de Gestión para el Disco Volador) activo en http://0.0.0.0:${PORT}`);
  });
}

// Ejecución con captura de excepciones fatales
startServer().catch((err) => {
  console.error('[Server Error Fatal]', err);
  process.exit(1);
});
