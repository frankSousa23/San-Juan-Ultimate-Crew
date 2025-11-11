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
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = process.env.JWT_SECRET || 'dev-secret';
  
  if (isProduction) {
    if (!process.env.JWT_SECRET || secret === 'dev-secret' || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }
  }
  
  return secret;
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: getIntEnv('PORT', 4000),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  AUTH_REQUIRED: getBoolEnv('AUTH_REQUIRED', false),
  JWT_SECRET: validateJwtSecret(),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
};
