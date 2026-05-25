export interface CharityRecord {
  id: string;
  code: string;
  name: string;
  mission: string;
  website?: string;
  isFeatured?: boolean;
  totalRaised?: number;
  totalRaisedMajor?: string;
  currency?: string;
  supportedCurrencies?: string[];
  status?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CharitySelectionRecord {
  id?: string;
  userId?: string;
  charityId?: string;
  currency?: string;
  status?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  changedBy?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CharityDonationRecord {
  id: string;
  userId: string;
  charityId: string;
  paymentId: string;
  paymentIntentId: string;
  subscriptionId?: string | null;
  source: "independent" | "subscription_addon";
  currency: string;
  amountMinor: number;
  amountMajor: string;
  status:
    | "processing"
    | "succeeded"
    | "failed"
    | "cancelled"
    | "timeout"
    | "retry_required";
  finalizedAt?: string | null;
  userMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
