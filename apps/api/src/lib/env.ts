import { z } from 'zod'
import 'dotenv/config'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(1).default('development-jwt-secret-key-change-in-prod'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  AUTH_REQUIRED: z.preprocess(
    (val) => String(val || '').toLowerCase() === 'true',
    z.boolean()
  ).default(false),
  DATABASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  API_URL: z.string().optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

let validatedEnv: EnvConfig

try {
  validatedEnv = envSchema.parse(process.env)
  if (validatedEnv.NODE_ENV === 'production' && validatedEnv.JWT_SECRET === 'development-jwt-secret-key-change-in-prod') {
    console.warn('⚠️ [SECURITY WARNING]: Running in production with default JWT_SECRET. Set a strong JWT_SECRET in environment variables.')
  }
} catch (error) {
  console.error('❌ [CONFIG ERROR]: Invalid environment configuration:', error)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
  validatedEnv = envSchema.parse({})
}

export const env = validatedEnv
