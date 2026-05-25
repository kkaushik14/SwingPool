import { toDrawDto, toPrizePoolDto } from "../draws/index.js";
import { PAYMENT_STATES } from "../payments/payments.enums.js";
import { toSubscriptionDto } from "../subscriptions/index.js";
import { SUBSCRIPTION_STATUSES } from "../subscriptions/subscriptions.enums.js";
import { toUserDto } from "../users/index.js";
import { toWinnerDto } from "../winners/index.js";
import { AppError } from "../../errors/index.js";
import { logAuditEvent } from "../../services/index.js";
import {
  buildPaginationMeta,
  fromMinorUnits,
  resolvePagination,
  resolveSorting,
} from "../../utils/index.js";

import { reportsRepository } from "./reports.repository.js";

const toPlain = (value) => (value?.toObject ? value.toObject() : value);

const toPaymentDto = (payment) => {
  if (!payment) {
    return null;
  }

  const item = toPlain(payment);

  return {
    id: item.id || item._id?.toString(),
    userId: item.userId,
    amountMinor: item.amount,
    amountMajor: item.amountMajor,
    currency: item.currency,
    state: item.state,
    stateReason: item.stateReason,
    sourceDomain: item.sourceDomain,
    sourceEntityId: item.sourceEntityId,
    mismatchDetected: item.mismatchDetected,
    stripePaymentIntentId: item.stripePaymentIntentId,
    finalizedAt: item.finalizedAt,
    timeoutAt: item.timeoutAt,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const mapAggregateCounts = (rows = []) => {
  const output = {};

  for (const row of rows) {
    output[String(row._id)] = Number(row.count || 0);
  }

  return output;
};

const applyDateRangeFilter = (filter, field, from, to) => {
  if (!from && !to) {
    return;
  }

  filter[field] = {};

  if (from) {
    filter[field].$gte = from;
  }

  if (to) {
    filter[field].$lte = to;
  }
};

const toRegex = (value) => ({
  $regex: String(value || "").trim(),
  $options: "i",
});

const createPagedResult = ({ items, page, pageSize, totalItems, summary }) => {
  return {
    items,
    summary,
    meta: buildPaginationMeta({
      page,
      pageSize,
      totalItems,
    }),
  };
};

const auditReportView = ({ action, requestContext, metadata = {} }) => {
  logAuditEvent({
    action,
    actorId: requestContext?.actorId,
    actorRole: requestContext?.role,
    entity: "Report",
    entityId: null,
    requestId: requestContext?.requestId,
    metadata,
  });
};

export const reportsService = {
  async getOverview(query = {}, requestContext = {}) {
    const paymentFilter = {};
    const winnerFilter = {};
    const drawFilter = {};

    applyDateRangeFilter(paymentFilter, "createdAt", query.from, query.to);
    applyDateRangeFilter(winnerFilter, "createdAt", query.from, query.to);
    applyDateRangeFilter(drawFilter, "drawAt", query.from, query.to);

    const [
      totalUsers,
      usersByStatus,
      activeSubscriptions,
      churnCount,
      planMix,
      paymentOutcomes,
      allocationSummary,
      donationSummary,
      payoutSummary,
      drawStatusCounts,
      prizePoolSummaryRows,
      winnerPayoutStates,
    ] = await Promise.all([
      reportsRepository.countUsers(),
      reportsRepository.aggregateUserStatusCounts(),
      reportsRepository.countSubscriptions({
        status: SUBSCRIPTION_STATUSES.ACTIVE,
      }),
      reportsRepository.countSubscriptionChurn({
        from: query.from,
        to: query.to,
      }),
      reportsRepository.aggregateSubscriptionPlanMix(),
      reportsRepository.aggregatePaymentOutcomes(paymentFilter),
      reportsRepository.aggregateCharityAllocations({
        from: query.from,
        to: query.to,
      }),
      reportsRepository.aggregateDonations({ from: query.from, to: query.to }),
      reportsRepository.aggregatePayouts({ from: query.from, to: query.to }),
      reportsRepository.aggregateDrawStatusCounts(drawFilter),
      reportsRepository.aggregatePrizePoolSummary({}),
      reportsRepository.aggregateWinnerPayoutStates(winnerFilter),
    ]);

    const paymentOutcomeMap = {};

    for (const row of paymentOutcomes) {
      paymentOutcomeMap[row._id] = {
        count: Number(row.count || 0),
        totalAmountMinor: Number(row.totalAmountMinor || 0),
        totalAmountMajor: fromMinorUnits(Number(row.totalAmountMinor || 0), 2),
      };
    }

    const defaultPaymentOutcome = {
      count: 0,
      totalAmountMinor: 0,
      totalAmountMajor: "0.00",
    };

    const prizePoolSummary = prizePoolSummaryRows[0] || {
      subscriptionPrizePoolMinor: 0,
      manualJackpotAddedMinor: 0,
      jackpotCarryInMinor: 0,
      jackpotCarryOutMinor: 0,
      companyRevenueMinor: 0,
      match3PaidMinor: 0,
      match4PaidMinor: 0,
      match5PaidMinor: 0,
    };

    const data = {
      users: {
        totalUsers,
        byStatus: mapAggregateCounts(usersByStatus),
      },
      subscriptions: {
        activeCount: activeSubscriptions,
        churnCount,
        planMix: (planMix || []).map((item) => ({
          planCode: item._id,
          count: Number(item.count || 0),
        })),
      },
      payments: {
        outcomes: {
          [PAYMENT_STATES.PROCESSING]:
            paymentOutcomeMap[PAYMENT_STATES.PROCESSING] ||
            defaultPaymentOutcome,
          [PAYMENT_STATES.SUCCEEDED]:
            paymentOutcomeMap[PAYMENT_STATES.SUCCEEDED] ||
            defaultPaymentOutcome,
          [PAYMENT_STATES.FAILED]:
            paymentOutcomeMap[PAYMENT_STATES.FAILED] || defaultPaymentOutcome,
          [PAYMENT_STATES.CANCELED]:
            paymentOutcomeMap[PAYMENT_STATES.CANCELED] || defaultPaymentOutcome,
          [PAYMENT_STATES.TIMEOUT]:
            paymentOutcomeMap[PAYMENT_STATES.TIMEOUT] || defaultPaymentOutcome,
          [PAYMENT_STATES.RETRY_REQUIRED]:
            paymentOutcomeMap[PAYMENT_STATES.RETRY_REQUIRED] ||
            defaultPaymentOutcome,
        },
      },
      charities: {
        allocationByEntryType: (allocationSummary || []).map((item) => ({
          entryType: item._id,
          count: Number(item.count || 0),
          totalAmountMinor: Number(item.totalAmountMinor || 0),
          totalAmountMajor: fromMinorUnits(
            Number(item.totalAmountMinor || 0),
            2,
          ),
        })),
        donationsByStatus: (donationSummary || []).map((item) => ({
          status: item._id,
          count: Number(item.count || 0),
          totalAmountMinor: Number(item.totalAmountMinor || 0),
          totalAmountMajor: fromMinorUnits(
            Number(item.totalAmountMinor || 0),
            2,
          ),
        })),
        payoutsByStatus: (payoutSummary || []).map((item) => ({
          status: item._id,
          count: Number(item.count || 0),
          totalAmountMinor: Number(item.totalAmountMinor || 0),
          totalAmountMajor: fromMinorUnits(
            Number(item.totalAmountMinor || 0),
            2,
          ),
        })),
      },
      draws: {
        byStatus: mapAggregateCounts(drawStatusCounts),
        prizePool: {
          subscriptionPrizePoolMinor: Number(
            prizePoolSummary.subscriptionPrizePoolMinor || 0,
          ),
          subscriptionPrizePoolMajor: fromMinorUnits(
            Number(prizePoolSummary.subscriptionPrizePoolMinor || 0),
            2,
          ),
          manualJackpotAddedMinor: Number(
            prizePoolSummary.manualJackpotAddedMinor || 0,
          ),
          manualJackpotAddedMajor: fromMinorUnits(
            Number(prizePoolSummary.manualJackpotAddedMinor || 0),
            2,
          ),
          jackpotCarryInMinor: Number(
            prizePoolSummary.jackpotCarryInMinor || 0,
          ),
          jackpotCarryInMajor: fromMinorUnits(
            Number(prizePoolSummary.jackpotCarryInMinor || 0),
            2,
          ),
          jackpotCarryOutMinor: Number(
            prizePoolSummary.jackpotCarryOutMinor || 0,
          ),
          jackpotCarryOutMajor: fromMinorUnits(
            Number(prizePoolSummary.jackpotCarryOutMinor || 0),
            2,
          ),
          companyRevenueMinor: Number(
            prizePoolSummary.companyRevenueMinor || 0,
          ),
          companyRevenueMajor: fromMinorUnits(
            Number(prizePoolSummary.companyRevenueMinor || 0),
            2,
          ),
        },
      },
      winners: {
        payoutStates: (winnerPayoutStates || []).map((item) => ({
          payoutStatus: item._id,
          count: Number(item.count || 0),
          totalPrizeMinor: Number(item.totalPrizeMinor || 0),
          totalPrizeMajor: fromMinorUnits(Number(item.totalPrizeMinor || 0), 2),
        })),
      },
      generatedAt: new Date(),
    };

    auditReportView({
      action: "reports.overview.view",
      requestContext,
      metadata: {
        from: query.from || null,
        to: query.to || null,
      },
    });

    return data;
  },

  async getUsersReport(query = {}, requestContext = {}) {
    const pagination = resolvePagination(query);
    const sorting = resolveSorting(
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      {
        allowedFields: [
          "createdAt",
          "updatedAt",
          "email",
          "displayName",
          "lastLoginAt",
        ],
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc",
      },
    );

    const filter = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.emailVerified !== undefined) {
      filter.emailVerifiedAt = query.emailVerified ? { $ne: null } : null;
    }

    if (query.search) {
      filter.$or = [
        { email: toRegex(query.search) },
        { displayName: toRegex(query.search) },
      ];
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    if (query.verificationStatus) {
      const userIds = await reportsRepository.findUserIdsByVerificationStatus(
        query.verificationStatus,
      );

      if (userIds.length === 0) {
        return createPagedResult({
          items: [],
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalItems: 0,
          summary: {
            byUserStatus: {},
            byProfileVerificationStatus: {},
          },
        });
      }

      filter._id = {
        $in: userIds,
      };
    }

    const [records, totalItems, statusRows] = await Promise.all([
      reportsRepository.listUsers({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      reportsRepository.countUsers(filter),
      reportsRepository.aggregateUserStatusCounts(filter),
    ]);

    const userIds = records.map((item) => item.id || item._id);
    const profiles = await reportsRepository.listProfilesByUserIds(userIds);
    const profileMap = new Map();

    for (const profile of profiles) {
      profileMap.set(String(profile.userId), profile);
    }

    const profileVerificationRows =
      await reportsRepository.aggregateProfileVerificationCounts(
        userIds.length > 0
          ? {
              userId: {
                $in: userIds,
              },
            }
          : { userId: null },
      );

    const items = records.map((item) =>
      toUserDto(item, profileMap.get(String(item.id || item._id))),
    );

    const summary = {
      byUserStatus: mapAggregateCounts(statusRows),
      byProfileVerificationStatus: mapAggregateCounts(profileVerificationRows),
      generatedAt: new Date(),
    };

    auditReportView({
      action: "reports.users.view",
      requestContext,
      metadata: {
        filters: query,
        resultCount: items.length,
      },
    });

    return createPagedResult({
      items,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      summary,
    });
  },

  async getSubscriptionsReport(query = {}, requestContext = {}) {
    const pagination = resolvePagination(query);
    const sorting = resolveSorting(
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      {
        allowedFields: [
          "createdAt",
          "updatedAt",
          "startAt",
          "endAt",
          "planCode",
          "status",
        ],
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc",
      },
    );

    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.planCode) {
      filter.planCode = String(query.planCode).toLowerCase();
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems, statusRows, planMixRows, churnCount] =
      await Promise.all([
        reportsRepository.listSubscriptions({
          filter,
          sort: sorting.mongoSort,
          skip: pagination.skip,
          limit: pagination.limit,
        }),
        reportsRepository.countSubscriptions(filter),
        reportsRepository.aggregateSubscriptionStatusCounts(filter),
        reportsRepository.aggregateSubscriptionPlanMix(filter),
        reportsRepository.countSubscriptionChurn({
          from: query.from,
          to: query.to,
        }),
      ]);

    const summary = {
      byStatus: mapAggregateCounts(statusRows),
      planMix: (planMixRows || []).map((item) => ({
        planCode: item._id,
        count: Number(item.count || 0),
      })),
      churnCount,
      generatedAt: new Date(),
    };

    auditReportView({
      action: "reports.subscriptions.view",
      requestContext,
      metadata: {
        filters: query,
        resultCount: records.length,
      },
    });

    return createPagedResult({
      items: records.map(toSubscriptionDto),
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      summary,
    });
  },

  async getPaymentsReport(query = {}, requestContext = {}) {
    const pagination = resolvePagination(query);
    const sorting = resolveSorting(
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      {
        allowedFields: [
          "createdAt",
          "updatedAt",
          "state",
          "amount",
          "timeoutAt",
          "finalizedAt",
        ],
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc",
      },
    );

    const filter = {};

    if (query.state) {
      filter.state = query.state;
    }

    if (query.sourceDomain) {
      filter.sourceDomain = query.sourceDomain;
    }

    if (query.mismatchDetected !== undefined) {
      filter.mismatchDetected = query.mismatchDetected;
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems, outcomeRows] = await Promise.all([
      reportsRepository.listPayments({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      reportsRepository.countPayments(filter),
      reportsRepository.aggregatePaymentOutcomes(filter),
    ]);

    const byState = {};
    let succeededCount = 0;

    for (const item of outcomeRows) {
      const count = Number(item.count || 0);

      byState[item._id] = {
        count,
        totalAmountMinor: Number(item.totalAmountMinor || 0),
        totalAmountMajor: fromMinorUnits(Number(item.totalAmountMinor || 0), 2),
      };

      if (item._id === PAYMENT_STATES.SUCCEEDED) {
        succeededCount += count;
      }
    }

    const summary = {
      byState,
      successRate:
        totalItems === 0 ? 0 : Number((succeededCount / totalItems).toFixed(4)),
      generatedAt: new Date(),
    };

    auditReportView({
      action: "reports.payments.view",
      requestContext,
      metadata: {
        filters: query,
        resultCount: records.length,
      },
    });

    return createPagedResult({
      items: records.map(toPaymentDto),
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      summary,
    });
  },

  async getCharitiesReport(query = {}, requestContext = {}) {
    const [allocationRows, donationRows, payoutRows] = await Promise.all([
      reportsRepository.aggregateCharityAllocations({
        from: query.from,
        to: query.to,
        charityId: query.charityId,
      }),
      reportsRepository.aggregateDonations({
        from: query.from,
        to: query.to,
        charityId: query.charityId,
      }),
      reportsRepository.aggregatePayouts({
        from: query.from,
        to: query.to,
        charityId: query.charityId,
      }),
    ]);

    const allocationItems = (allocationRows || []).map((item) => ({
      entryType: item._id,
      count: Number(item.count || 0),
      totalAmountMinor: Number(item.totalAmountMinor || 0),
      totalAmountMajor: fromMinorUnits(Number(item.totalAmountMinor || 0), 2),
    }));

    const donationItems = (donationRows || []).map((item) => ({
      status: item._id,
      count: Number(item.count || 0),
      totalAmountMinor: Number(item.totalAmountMinor || 0),
      totalAmountMajor: fromMinorUnits(Number(item.totalAmountMinor || 0), 2),
    }));

    const payoutItems = (payoutRows || []).map((item) => ({
      status: item._id,
      count: Number(item.count || 0),
      totalAmountMinor: Number(item.totalAmountMinor || 0),
      totalAmountMajor: fromMinorUnits(Number(item.totalAmountMinor || 0), 2),
    }));

    const summary = {
      totalAllocationMinor: allocationItems.reduce(
        (sum, item) => sum + item.totalAmountMinor,
        0,
      ),
      totalDonationMinor: donationItems.reduce(
        (sum, item) => sum + item.totalAmountMinor,
        0,
      ),
      totalPayoutMinor: payoutItems.reduce(
        (sum, item) => sum + item.totalAmountMinor,
        0,
      ),
      generatedAt: new Date(),
    };

    summary.totalAllocationMajor = fromMinorUnits(
      summary.totalAllocationMinor,
      2,
    );
    summary.totalDonationMajor = fromMinorUnits(summary.totalDonationMinor, 2);
    summary.totalPayoutMajor = fromMinorUnits(summary.totalPayoutMinor, 2);

    auditReportView({
      action: "reports.charities.view",
      requestContext,
      metadata: {
        filters: query,
      },
    });

    return {
      summary,
      allocations: allocationItems,
      donations: donationItems,
      payouts: payoutItems,
    };
  },

  async getDrawsReport(query = {}, requestContext = {}) {
    const pagination = resolvePagination(query);
    const sorting = resolveSorting(
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      {
        allowedFields: ["year", "month", "drawAt", "status", "createdAt"],
        defaultSortBy: "year",
        defaultSortOrder: "desc",
      },
    );

    const filter = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.year !== undefined) {
      filter.year = query.year;
    }

    if (query.month !== undefined) {
      filter.month = query.month;
    }

    applyDateRangeFilter(filter, "drawAt", query.from, query.to);

    const [records, totalItems, statusRows, prizePoolSummaryRows] =
      await Promise.all([
        reportsRepository.listDraws({
          filter,
          sort: sorting.mongoSort,
          skip: pagination.skip,
          limit: pagination.limit,
        }),
        reportsRepository.countDraws(filter),
        reportsRepository.aggregateDrawStatusCounts(filter),
        reportsRepository.aggregatePrizePoolSummary({}),
      ]);

    const drawIds = records.map((item) => item.id || item._id);

    const [entryRows, prizePools] = await Promise.all([
      reportsRepository.countDrawEntriesByDrawIds(drawIds),
      reportsRepository.listPrizePoolsByDrawIds(drawIds),
    ]);

    const entryCountByDrawId = new Map(
      (entryRows || []).map((item) => [
        String(item._id),
        Number(item.count || 0),
      ]),
    );

    const prizePoolByDrawId = new Map(
      (prizePools || []).map((item) => [
        String(item.drawId),
        toPrizePoolDto(item),
      ]),
    );

    const items = records.map((draw) => {
      const drawId = String(draw.id || draw._id);

      return {
        ...toDrawDto(draw),
        entryCount: entryCountByDrawId.get(drawId) || 0,
        prizePool: prizePoolByDrawId.get(drawId) || null,
      };
    });

    const prizePoolSummary = prizePoolSummaryRows[0] || {
      subscriptionPrizePoolMinor: 0,
      manualJackpotAddedMinor: 0,
      jackpotCarryInMinor: 0,
      jackpotCarryOutMinor: 0,
      companyRevenueMinor: 0,
      match3PaidMinor: 0,
      match4PaidMinor: 0,
      match5PaidMinor: 0,
    };

    const summary = {
      byStatus: mapAggregateCounts(statusRows),
      prizePools: {
        subscriptionPrizePoolMinor: Number(
          prizePoolSummary.subscriptionPrizePoolMinor || 0,
        ),
        subscriptionPrizePoolMajor: fromMinorUnits(
          Number(prizePoolSummary.subscriptionPrizePoolMinor || 0),
          2,
        ),
        jackpotCarryOutMinor: Number(
          prizePoolSummary.jackpotCarryOutMinor || 0,
        ),
        jackpotCarryOutMajor: fromMinorUnits(
          Number(prizePoolSummary.jackpotCarryOutMinor || 0),
          2,
        ),
        companyRevenueMinor: Number(prizePoolSummary.companyRevenueMinor || 0),
        companyRevenueMajor: fromMinorUnits(
          Number(prizePoolSummary.companyRevenueMinor || 0),
          2,
        ),
      },
      generatedAt: new Date(),
    };

    auditReportView({
      action: "reports.draws.view",
      requestContext,
      metadata: {
        filters: query,
        resultCount: records.length,
      },
    });

    return createPagedResult({
      items,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      summary,
    });
  },

  async getWinnersReport(query = {}, requestContext = {}) {
    const pagination = resolvePagination(query);
    const sorting = resolveSorting(
      {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      {
        allowedFields: [
          "createdAt",
          "updatedAt",
          "matchCount",
          "payoutStatus",
          "prizeAmountMinor",
        ],
        defaultSortBy: "createdAt",
        defaultSortOrder: "desc",
      },
    );

    const filter = {};

    if (query.payoutStatus) {
      filter.payoutStatus = query.payoutStatus;
    }

    if (query.drawId) {
      filter.drawId = query.drawId;
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.matchCount !== undefined) {
      filter.matchCount = query.matchCount;
    }

    applyDateRangeFilter(filter, "createdAt", query.from, query.to);

    const [records, totalItems, payoutRows, matchRows] = await Promise.all([
      reportsRepository.listWinners({
        filter,
        sort: sorting.mongoSort,
        skip: pagination.skip,
        limit: pagination.limit,
      }),
      reportsRepository.countWinners(filter),
      reportsRepository.aggregateWinnerPayoutStates(filter),
      reportsRepository.aggregateWinnerMatchCounts(filter),
    ]);

    const summary = {
      byPayoutStatus: (payoutRows || []).map((item) => ({
        payoutStatus: item._id,
        count: Number(item.count || 0),
        totalPrizeMinor: Number(item.totalPrizeMinor || 0),
        totalPrizeMajor: fromMinorUnits(Number(item.totalPrizeMinor || 0), 2),
      })),
      byMatchCount: (matchRows || []).map((item) => ({
        matchCount: Number(item._id || 0),
        count: Number(item.count || 0),
        totalPrizeMinor: Number(item.totalPrizeMinor || 0),
        totalPrizeMajor: fromMinorUnits(Number(item.totalPrizeMinor || 0), 2),
      })),
      generatedAt: new Date(),
    };

    auditReportView({
      action: "reports.winners.view",
      requestContext,
      metadata: {
        filters: query,
        resultCount: records.length,
      },
    });

    return createPagedResult({
      items: records.map(toWinnerDto),
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      summary,
    });
  },

  async getReportById() {
    throw AppError.notFound(
      "Saved report documents are not enabled for this build.",
    );
  },

  async listAll() {
    throw AppError.notFound(
      "Saved report documents are not enabled for this build.",
    );
  },

  async create() {
    throw AppError.notFound(
      "Saved report documents are not enabled for this build.",
    );
  },

  async update() {
    throw AppError.notFound(
      "Saved report documents are not enabled for this build.",
    );
  },
};
