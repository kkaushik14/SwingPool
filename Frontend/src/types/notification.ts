export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  eventType: string;
  channel?: string;
  readAt?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}
