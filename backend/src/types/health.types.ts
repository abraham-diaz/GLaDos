export interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: Record<string, ServiceStatus>;
}

export interface HealthChecker {
  name: string;
  check(): Promise<ServiceStatus>;
}
