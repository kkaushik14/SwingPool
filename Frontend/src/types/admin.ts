import type { ApiMeta } from "./api";
import type {
  CharityDonationRecord,
  CharityRecord
} from "./charity";
import type {
  DrawEntryRecord,
  DrawPrizePoolRecord,
  DrawPublishedResultRecord,
  DrawRecord,
  JackpotLedgerRecord
} from "./draw";
import type { NotificationRecord } from "./notification";
import type { PaymentRecord } from "./payment";
import type { OverviewReport } from "./report";
import type { ScoreRecord } from "./score";
import type {
  SubscriptionConfig,
  SubscriptionPlan,
  SubscriptionRecord
} from "./subscription";
import type { UserRecord } from "./user";
import type {
  WinnerProofSubmissionRecord,
  WinnerRecord
} from "./winner";

export interface AdminPagedResult<T> {
  items: T[];
  meta?: ApiMeta | null;
}

export interface AdminQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  from?: string;
  to?: string;
  [key: string]: string | number | boolean | undefined | null;
}

export interface CouponRecord {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  maxDiscountInr?: number | null;
  minOrderAmountInr?: number | null;
  maxRedemptions?: number | null;
  redeemedCount?: number;
  validFrom?: string | null;
  validTo?: string | null;
  applicablePlanCodes?: string[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContributionRuleRecord {
  id: string;
  ruleKey: string;
  currency: string;
  gatewayFeePercentage: number;
  prizePoolPercentage: number;
  mandatoryCharityPercentage: number;
  status: string;
  effectiveFrom?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PayoutLedgerRecord {
  id: string;
  charityId: string;
  entryType: string;
  status: string;
  currency: string;
  amountMinor: number;
  amountMajor: string;
  externalReference?: string;
  notes?: string;
  createdBy?: string | null;
  processedBy?: string | null;
  processedAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentLedgerRecord {
  id: string;
  paymentId: string;
  userId: string;
  stripePaymentIntentId: string;
  stripeEventId?: string;
  idempotencyKey?: string;
  entryType: string;
  direction: string;
  amountMinor: number;
  amountMajor: string;
  currency: string;
  occurredAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface AuditEventRecord {
  id: string;
  action: string;
  actorId?: string | null;
  actorRole?: string | null;
  entity: string;
  entityId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DrawSimulationRecord {
  id: string;
  drawId: string;
  mode: string;
  winningNumbers: number[];
  winnerStats?: Record<string, number>;
  jackpotWouldRollOver?: boolean;
  status?: string;
  requestedBy?: string | null;
  requestedAt?: string | null;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface DrawGenerationResult {
  draw: DrawRecord;
  createdEntries: DrawEntryRecord[];
  skippedUsers: string[];
  totalEligibleUsers: number;
  totalEntries: number;
}

export interface DrawPublishResult {
  draw: DrawRecord;
  result: DrawPublishedResultRecord;
  prizePool: DrawPrizePoolRecord;
}

export interface AdminDrawDetail {
  draw: DrawRecord;
  entries: DrawEntryRecord[];
  simulations: DrawSimulationRecord[];
  prizePool: DrawPrizePoolRecord | null;
}

export interface AdminDrawReportItem extends DrawRecord {
  entryCount: number;
  prizePool: DrawPrizePoolRecord | null;
}

export interface UsersReportSummary {
  byUserStatus: Record<string, number>;
  byProfileVerificationStatus: Record<string, number>;
  generatedAt?: string;
}

export interface SubscriptionsReportSummary {
  byStatus: Record<string, number>;
  planMix: Array<{
    planCode: string;
    count: number;
  }>;
  churnCount: number;
  generatedAt?: string;
}

export interface PaymentsReportSummary {
  byState: Record<
    string,
    {
      count: number;
      totalAmountMinor: number;
      totalAmountMajor: string;
    }
  >;
  successRate: number;
  generatedAt?: string;
}

export interface CharitiesReportSummary {
  totalAllocationMinor: number;
  totalAllocationMajor: string;
  totalDonationMinor: number;
  totalDonationMajor: string;
  totalPayoutMinor: number;
  totalPayoutMajor: string;
  generatedAt?: string;
}

export interface CharityAggregateRow {
  entryType?: string;
  status?: string;
  count: number;
  totalAmountMinor: number;
  totalAmountMajor: string;
}

export interface DrawsReportSummary {
  byStatus: Record<string, number>;
  prizePools: {
    subscriptionPrizePoolMinor: number;
    subscriptionPrizePoolMajor: string;
    jackpotCarryOutMinor: number;
    jackpotCarryOutMajor: string;
    companyRevenueMinor: number;
    companyRevenueMajor: string;
  };
  generatedAt?: string;
}

export interface WinnersReportSummary {
  byPayoutStatus: Array<{
    payoutStatus: string;
    count: number;
    totalPrizeMinor: number;
    totalPrizeMajor: string;
  }>;
  byMatchCount: Array<{
    matchCount: number;
    count: number;
    totalPrizeMinor: number;
    totalPrizeMajor: string;
  }>;
  generatedAt?: string;
}

export interface ReportPagedResult<T, TSummary> extends AdminPagedResult<T> {
  summary: TSummary;
}

export interface CharitiesReportResult {
  summary: CharitiesReportSummary;
  allocations: CharityAggregateRow[];
  donations: CharityAggregateRow[];
  payouts: CharityAggregateRow[];
}

export interface AdminDashboardSnapshot {
  overview: OverviewReport;
  users: ReportPagedResult<UserRecord, UsersReportSummary>;
  subscriptions: ReportPagedResult<SubscriptionRecord, SubscriptionsReportSummary>;
  payments: ReportPagedResult<PaymentRecord, PaymentsReportSummary>;
  draws: ReportPagedResult<AdminDrawReportItem, DrawsReportSummary>;
  winners: ReportPagedResult<WinnerRecord, WinnersReportSummary>;
  recentAudit: AdminPagedResult<AuditEventRecord>;
}

export interface AdminNotificationPageData {
  notifications: NotificationRecord[];
  recentAudit: AdminPagedResult<AuditEventRecord>;
}

export interface AdminSettingsSnapshot {
  notifications: NotificationRecord[];
  audit: AdminPagedResult<AuditEventRecord>;
}

export type {
  CharityDonationRecord,
  CharityRecord,
  DrawEntryRecord,
  DrawPrizePoolRecord,
  DrawPublishedResultRecord,
  DrawRecord,
  JackpotLedgerRecord,
  NotificationRecord,
  PaymentRecord,
  OverviewReport,
  ScoreRecord,
  SubscriptionConfig,
  SubscriptionPlan,
  SubscriptionRecord,
  UserRecord,
  WinnerProofSubmissionRecord,
  WinnerRecord
};
