export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  amountMajor?: string;
  currency: string;
  description?: string;
  stripePaymentIntentId: string;
  stripeCheckoutSessionId?: string | null;
  stripeClientSecret?: string | null;
  state:
    | "processing"
    | "succeeded"
    | "failed"
    | "cancelled"
    | "timeout"
    | "retry_required";
  stateReason?: string;
  sourceDomain?: string;
  sourceEntityId?: string;
  sourceAction?: string;
  attemptCount?: number;
  retryCount?: number;
  timeoutAt?: string | null;
  finalizedAt?: string | null;
  stripeLastEventId?: string;
  stripeLastEventType?: string;
  stripeLastEventAt?: string | null;
  mismatchDetected?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
