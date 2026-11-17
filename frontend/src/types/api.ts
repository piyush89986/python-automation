export interface StandardResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  status: 'success' | 'error';
  data: T[];
  pagination: PaginationMeta;
}

export interface HealthComponentStatus {
  status: 'healthy' | 'unhealthy';
  latency_ms?: number;
  details?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  uptime_seconds: number;
  services: {
    database: HealthComponentStatus;
    redis: HealthComponentStatus;
    [key: string]: HealthComponentStatus;
  };
}
