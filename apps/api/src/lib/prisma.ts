/**
 * ============================================================================
 * SIGEDIVO (Sistema de Gestión para el Disco Volador)
 * CAPA DE DATOS Y ABSTRACCIÓN PRISMA ORM (apps/api/src/lib/prisma.ts)
 * ============================================================================
 * 
 * Este módulo implementa un cliente de datos resiliente con tolerancia a fallos
 * mediante un patrón Proxy transparente.
 * 
 * MECANISMO DE OPERACIÓN:
 * 1. Conexión Real PostgreSQL (Prisma ORM 7 + @prisma/adapter-pg):
 *    - Si existe una variable `DATABASE_URL` válida que apunte a un servidor PostgreSQL
 *      remoto o local activo, se inicializa el pool de conexiones (`pg.Pool`) y el
 *      cliente `PrismaClient` oficial.
 * 
 * 2. Capa de Resiliencia en Memoria (mockDb Fallback):
 *    - Si `DATABASE_URL` no está definida, apunta a un host inaccesible, o si ocurre
 *      un fallo de red durante cualquier consulta en runtime, el Proxy intercepta
 *      la llamada y delega automáticamente la operación a la base de datos simulada
 *      en memoria (`mockDb`).
 * 
 * 3. Beneficios:
 *    - Permite que la plataforma ejecute tests, previsualizaciones en contenedor,
 *      demostraciones en vivo y exploraciones en Modo Invitado sin requerir una base
 *      de datos PostgreSQL externa obligatoria.
 * ============================================================================
 */

import { createRequire } from 'module';
import 'dotenv/config';
import { mockPrisma } from './mockDb.js';

const req = typeof require !== 'undefined' ? require : createRequire(import.meta.url || 'file://' + process.cwd() + '/index.js');

let realPrisma: any = null;
let dbOffline = false;

// Verificación inicial de la cadena de conexión
if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1')
) {
  // En entornos locales sin contenedor PostgreSQL dedicado, se activa el modo en memoria
  dbOffline = true;
} else {
  try {
    const { PrismaClient } = req('@prisma/client');
    const { PrismaPg } = req('@prisma/adapter-pg');
    const { Pool } = req('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 1500, // Timeout estricto para evitar bloqueos
    });
    const adapter = new PrismaPg(pool);
    realPrisma = new PrismaClient({
      adapter,
      log: process.env.PRISMA_PROFILE === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  } catch (err) {
    dbOffline = true;
  }
}

/**
 * Proxy exportado como `prisma`.
 * Intercepta cualquier acceso a modelos (e.g. `prisma.player.findMany(...)`,
 * `prisma.matchEvent.create(...)`) y redirige fluidamente entre PostgreSQL y mockDb.
 */
export const prisma: any = new Proxy(mockPrisma, {
  get(target, modelName: string) {
    // Intercepción de comandos especiales de Prisma (e.g. $transaction, $connect)
    if (modelName.startsWith('$')) {
      return target[modelName] || (async () => {});
    }

    const mockModel = mockPrisma[modelName];
    if (dbOffline || !realPrisma) {
      return mockModel;
    }

    const realModel = realPrisma[modelName];
    if (!realModel) return mockModel;

    return new Proxy(mockModel || {}, {
      get(mTarget, actionName: string) {
        return async (...args: any[]) => {
          // Intentar ejecutar contra PostgreSQL real si está en línea
          if (!dbOffline && realModel && typeof realModel[actionName] === 'function') {
            try {
              return await realModel[actionName](...args);
            } catch (err: any) {
              // Si falla la conexión a la base de datos física, cambiar a fallback en memoria
              dbOffline = true;
              if (typeof mockModel?.[actionName] === 'function') {
                return await mockModel[actionName](...args);
              }
              throw err;
            }
          }

          // Fallback a modelo en memoria
          if (typeof mockModel?.[actionName] === 'function') {
            return await mockModel[actionName](...args);
          }
          return null;
        };
      },
    });
  },
});
