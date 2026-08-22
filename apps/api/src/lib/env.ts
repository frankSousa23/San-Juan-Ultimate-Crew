function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function getBoolEnv(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function getIntEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    return secret && secret.length > 0 
      ? secret.padEnd(32, '0') 
      : 'sigedivo-production-jwt-secret-key-32-chars-minimum-fallback-2026';
  }
  return secret || 'dev-secret-sigedivo-ultimate-frisbee-32chars';
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getIntEnv('PORT', 3000),
  DATABASE_URL: getEnv('DATABASE_URL', 'postgresql://sju:sju@localhost:5432/sju_dev?schema=public'),
  AUTH_REQUIRED: getBoolEnv('AUTH_REQUIRED', false),
  JWT_SECRET: validateJwtSecret(),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', '*'),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:3000'),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
};
