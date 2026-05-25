export interface HealthStatus {
  status: string;
  uptimeSeconds: number;
  environment: string;
  timezone: string;
  database: {
    connected: boolean;
    readyState: number;
  };
}
