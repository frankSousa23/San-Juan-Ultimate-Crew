// API Types and Interfaces

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface HealthResponse {
  ok: boolean;
  time: string;
  uptime: number;
  version: string;
  environment: string;
}

export interface DatabaseHealthResponse {
  ok: boolean;
  database: string;
  responseTime: string;
  counts: {
    players: number;
    events: number;
    users: number;
    transactions: number;
  };
}

export interface SystemHealthResponse {
  ok: boolean;
  system: {
    uptime: number;
    memory: {
      rss: string;
      heapTotal: string;
      heapUsed: string;
      external: string;
    };
    nodeVersion: string;
    platform: string;
    arch: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiError {
  error: string;
  issues?: ValidationError[];
  stack?: string;
  details?: any;
}

// Request/Response types for middleware
export interface AuthenticatedRequest extends Request {
  user?: {
    sub: number;
    email: string;
    roles?: string[];
    playerId?: number;
  };
}

export interface RequestWithUser extends Request {
  user?: {
    id: number;
    email: string;
    name?: string;
    roles: string[];
    playerId?: number | null;
  };
}

// Common query parameters
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface SearchParams {
  q?: string;
  search?: string;
}

export interface SortParams {
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DateRangeParams {
  from?: string;
  to?: string;
  startDate?: string;
  endDate?: string;
}

// File upload types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

export interface FileUploadResponse {
  id: number;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  url: string;
  createdAt: string;
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// Logging types
export interface LogEntry {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ip: string;
  userId?: number;
}

export interface ErrorLogEntry extends LogEntry {
  error: string;
  stack?: string;
}

// Configuration types
export interface DatabaseConfig {
  url: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  corsOrigin: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
  security: SecurityConfig;
}
