import { routePaths } from "@/routes/paths";
import type {
  AdminQueryParams,
  AuditEventRecord,
  DrawsReportSummary,
  PaymentsReportSummary,
  SubscriptionsReportSummary,
  UsersReportSummary,
  WinnersReportSummary
} from "@/types";
import { formatCurrency } from "@/utils";

export const buildQueryString = (params: AdminQueryParams = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
};

export const resolveSortState = ({
  currentSortBy,
  currentSortOrder,
  nextSortBy
}: {
  currentSortBy?: string;
  currentSortOrder?: "asc" | "desc";
  nextSortBy: string;
}) => {
  if (currentSortBy !== nextSortBy) {
    return {
      sortBy: nextSortBy,
      sortOrder: "desc" as const
    };
  }

  return {
    sortBy: nextSortBy,
    sortOrder: currentSortOrder === "desc" ? ("asc" as const) : ("desc" as const)
  };
};

export const toChartPoints = (
  values: Record<string, number> = {},
  labelOverrides: Record<string, string> = {}
) =>
  Object.entries(values)
    .map(([key, value]) => ({
      key,
      label: labelOverrides[key] || key.replace(/_/g, " "),
      value: Number(value || 0)
    }))
    .sort((left, right) => right.value - left.value);

export const toArrayChartPoints = <
  TItem extends Record<string, unknown>
>(
  items: TItem[] = [],
  config: {
    labelKey: keyof TItem;
    valueKey: keyof TItem;
  }
) =>
  items
    .map((item) => ({
      key: String(item[config.labelKey]),
      label: String(item[config.labelKey]).replace(/_/g, " "),
      value: Number(item[config.valueKey] || 0)
    }))
    .sort((left, right) => right.value - left.value);

export const buildPendingAdminActions = ({
  usersSummary,
  subscriptionsSummary,
  paymentsSummary,
  winnersSummary,
  drawsSummary
}: {
  usersSummary?: UsersReportSummary;
  subscriptionsSummary?: SubscriptionsReportSummary;
  paymentsSummary?: PaymentsReportSummary;
  winnersSummary?: WinnersReportSummary;
  drawsSummary?: DrawsReportSummary;
}) => {
  const paymentRetryCount =
    paymentsSummary?.byState?.retry_required?.count || 0;
  const gracePeriodCount =
    subscriptionsSummary?.byStatus?.grace_period || 0;
  const pendingVerificationCount =
    usersSummary?.byProfileVerificationStatus?.pending_verification || 0;
  const winnerPendingProofCount =
    winnersSummary?.byPayoutStatus?.find(
      (item) => item.payoutStatus === "pending_verification"
    )?.count || 0;
  const draftDrawCount = drawsSummary?.byStatus?.draft || 0;

  return [
    {
      id: "pending-profile-reviews",
      title: `${pendingVerificationCount} profiles are waiting for verification review`,
      description:
        "User activation remains blocked until admin profile review decisions are made.",
      href: routePaths.adminUsers,
      actionLabel: "Review users",
      count: pendingVerificationCount,
      tone: pendingVerificationCount ? "warning" : "success"
    },
    {
      id: "grace-period-subscriptions",
      title: `${gracePeriodCount} subscriptions are in grace period`,
      description:
        "Lapsed memberships can drop out of draw eligibility if renewal issues stay unresolved.",
      href: routePaths.adminPayments,
      actionLabel: "Review billing",
      count: gracePeriodCount,
      tone: gracePeriodCount ? "danger" : "success"
    },
    {
      id: "retry-required-payments",
      title: `${paymentRetryCount} payments need retry or reconciliation attention`,
      description:
        "Webhook-safe payment operations still need admin visibility when records stall or mismatch.",
      href: routePaths.adminPayments,
      actionLabel: "Open payments",
      count: paymentRetryCount,
      tone: paymentRetryCount ? "danger" : "success"
    },
    {
      id: "winner-proof-queue",
      title: `${winnerPendingProofCount} winner claims are waiting on proof handling`,
      description:
        "Proof review and payout progression should stay tightly controlled and fully reasoned.",
      href: routePaths.adminWinners,
      actionLabel: "Open winners",
      count: winnerPendingProofCount,
      tone: winnerPendingProofCount ? "warning" : "success"
    },
    {
      id: "draft-draws",
      title: `${draftDrawCount} draws are still in draft state`,
      description:
        "Draw preparation, simulations, and publication safety checks should be completed before release.",
      href: routePaths.adminDraws,
      actionLabel: "Open draws",
      count: draftDrawCount,
      tone: draftDrawCount ? "info" : "success"
    }
  ].sort((left, right) => right.count - left.count);
};

export const buildAdminRecentActivity = (auditEvents: AuditEventRecord[] = []) =>
  auditEvents.map((event) => ({
    id: event.id,
    title: event.action.replace(/\./g, " "),
    description: `${event.entity}${event.entityId ? ` • ${event.entityId}` : ""}`,
    meta: event.requestId ? `Request ${event.requestId}` : "Request-aware audit event",
    createdAt: event.createdAt || event.updatedAt || ""
  }));

export const downloadCsv = ({
  filename,
  headers,
  rows
}: {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null | undefined>>;
}) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const toCsvCell = (value: string | number | boolean | null | undefined) =>
    `"${String(value ?? "").replace(/"/g, "\"\"")}"`;

  const csv = [headers, ...rows]
    .map((row) => row.map(toCsvCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.setAttribute("download", filename);
  link.click();

  URL.revokeObjectURL(url);
};

export const formatMinorCurrency = (valueMinor = 0, currency = "INR") =>
  formatCurrency(valueMinor / 100, currency);

export const summarizeCollectionCount = <TItem>(items: TItem[] = []) =>
  `${items.length} item${items.length === 1 ? "" : "s"}`;
