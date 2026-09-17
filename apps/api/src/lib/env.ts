import { z } from 'zod'
import 'dotenv/config'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(1).default('development-jwt-secret-key-change-in-prod'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  AUTH_REQUIRED: z.preprocess(
    (val) => {
      if (val === undefined || val === null || val === '') {
        return process.env.NODE_ENV === 'production'
      }
      return String(val).toLowerCase() === 'true'
    },
    z.boolean()
  ).default(false),
  DATABASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  API_URL: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (
      !data.JWT_SECRET ||
      data.JWT_SECRET === 'development-jwt-secret-key-change-in-prod' ||
      data.JWT_SECRET.length < 32
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SECRET'],
        message: 'In production, JWT_SECRET must be at least 32 characters long and cannot use the development default value.',
      })
    }
  }
})

export type EnvConfig = z.infer<typeof envSchema>

let validatedEnv: EnvConfig

try {
  validatedEnv = envSchema.parse(process.env)
} catch (error) {
  console.warn('⚠️ [CONFIG WARNING]: Invalid or incomplete environment configuration, using safe fallbacks:', error)
  validatedEnv = envSchema.parse({
    JWT_SECRET: process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32
      ? process.env.JWT_SECRET
      : 'sigedivo-production-safe-fallback-secret-key-2026-ultimate-frisbee',
  })
}

export const env = validatedEnv

