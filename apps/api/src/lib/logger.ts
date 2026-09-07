type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

const SENSITIVE_KEY_REGEX = /^(password|token|secret|authorization|cookie|apiKey|key|pass|jwt)$/i;

export function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 3 || data === null || data === undefined) {
    return data;
  }
  if (typeof data === 'string') {
    if (/^Bearer\s+[A-Za-z0-9\-._~+/]+=*$/i.test(data.trim())) {
      return 'Bearer [REDACTED]';
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }
  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value, depth + 1);
      }
    }
    return sanitized;
  }
  return data;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    this.logLevel = ['debug', 'info', 'warn', 'error'].includes(envLevel)
      ? (envLevel as LogLevel)
      : 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    const sanitizedMeta = (meta ? sanitizeLogData(meta) : {}) as Record<string, unknown>;
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...sanitizedMeta,
    };
  }

  private output(entry: LogEntry): void {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(entry));
    } else {
      const { level, message, timestamp, ...meta } = entry;
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
      console.warn(`[${timestamp}] ${level.toUpperCase()}:`, message, metaStr);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatLog('debug', message, meta));
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      this.output(this.formatLog('info', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatLog('warn', message, meta));
    }
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const errorMeta: Record<string, unknown> = { ...meta };
      
      if (error instanceof Error) {
        errorMeta.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else if (error) {
        errorMeta.error = error;
      }

      this.output(this.formatLog('error', message, errorMeta));
    }
  }
}

export const logger = new Logger();
