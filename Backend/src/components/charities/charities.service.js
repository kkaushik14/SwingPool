import { config } from "../../config/index.js";
import { AppError, ConflictError, DomainError } from "../../errors/index.js";
import { logAuditEvent } from "../../services/index.js";
import { fromMinorUnits, toMinorUnits } from "../../utils/index.js";
import { paymentsService } from "../payments/payments.service.js";

import {
  buildDefaultContributionRule,
  computeOutstandingByCharity,
} from "./charity-accounting.js";
import {
  CHARITIES_STATUSES,
  CHARITY_CURRENCIES,
  CHARITY_PAYOUT_ENTRY_TYPES,
  CHARITY_PAYOUT_STATUSES,
  CHARITY_SELECTION_STATUSES,
} from "./charities.enums.js";
import {
  toCharityDto,
  toCharitySelectionDto,
  toContributionRuleDto,
  toDonationDto,
  toPayoutLedgerDto,
} from "./charities.dto.js";
import { charitiesRepository } from "./charities.repository.js";

const nowDate = () => new Date();

const resolveCurrencyRuleKey = (currency = CHARITY_CURRENCIES.INR) =>
  String(currency).toUpperCase();

const ensureRuleExists = async (currency = CHARITY_CURRENCIES.INR) => {
  const ruleKey = resolveCurrencyRuleKey(currency);
  const existing = await charitiesRepository.getContributionRule(ruleKey);

  if (existing) {
    return existing;
  }

  const defaults = buildDefaultContributionRule();

  return charitiesRepository.upsertContributionRule(ruleKey, {
    ...defaults,
    ruleKey,
    currency,
  });
};

const normalizeCharityCode = (code = "") => {
  return String(code)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const assertCharityActive = async (charityId) => {
  const charity = await charitiesRepository.findById(charityId);

  if (!charity) {
    throw AppError.notFound("Charity not found.");
  }

  if (charity.status !== CHARITIES_STATUSES.ACTIVE) {
    throw new DomainError("Selected charity is currently not active.");
  }

  return charity;
};

const toMinorAmountFromInr = (amountInr) => {
  const minor = toMinorUnits(amountInr, 2);

  if (minor <= 0) {
    throw new DomainError(
      "Donation or payout amount must be greater than zero.",
    );
  }

  return {
    minor,
    major: fromMinorUnits(minor, 2),
  };
};

const extractCharityIdsFromAggregates = ({
  allocations = [],
  payouts = [],
}) => {
  const ids = new Set();

  for (const item of allocations) {
    if (item?._id?.charityId) {
      ids.add(String(item._id.charityId));
    }
  }

  for (const item of payouts) {
    if (item?._id?.charityId) {
      ids.add(String(item._id.charityId));
    }
  }

  return [...ids];
};

const aggregateArrayByEntryType = (entries = [], targetCharityId) => {
  const summary = {
    allocatedToCharityMinor: 0,
    mandatoryCharityMinor: 0,
    optionalAddonMinor: 0,
    independentDonationMinor: 0,
    manualAdjustmentCreditMinor: 0,
    manualAdjustmentDebitMinor: 0,
    gatewayFeeMinor: 0,
    prizePoolMinor: 0,
    platformRevenueMinor: 0,
  };

  for (const entry of entries) {
    if (String(entry?._id?.charityId || "") !== String(targetCharityId || "")) {
      continue;
    }

    const entryType = entry?._id?.entryType;
    const amountMinor = Number(entry?.amountMinor || 0);

    if (entryType === "mandatory_charity") {
      summary.mandatoryCharityMinor += amountMinor;
      summary.allocatedToCharityMinor += amountMinor;
    }

    if (entryType === "optional_charity_addon") {
      summary.optionalAddonMinor += amountMinor;
      summary.allocatedToCharityMinor += amountMinor;
    }

    if (entryType === "independent_donation_charity") {
      summary.independentDonationMinor += amountMinor;
      summary.allocatedToCharityMinor += amountMinor;
    }

    if (entryType === "manual_adjustment_credit") {
      summary.manualAdjustmentCreditMinor += amountMinor;
      summary.allocatedToCharityMinor += amountMinor;
    }

    if (entryType === "manual_adjustment_debit") {
      summary.manualAdjustmentDebitMinor += amountMinor;
      summary.allocatedToCharityMinor -= amountMinor;
    }

    if (entryType === "gateway_fee") {
      summary.gatewayFeeMinor += amountMinor;
    }

    if (entryType === "prize_pool") {
      summary.prizePoolMinor += amountMinor;
    }

    if (entryType === "platform_revenue") {
      summary.platformRevenueMinor += amountMinor;
    }
  }

  return summary;
};

const aggregatePayoutsByEntryType = (entries = [], targetCharityId) => {
  const summary = {
    payoutCompletedMinor: 0,
    payoutPendingMinor: 0,
    adjustmentCreditMinor: 0,
    adjustmentDebitMinor: 0,
  };

  for (const entry of entries) {
    if (String(entry?._id?.charityId || "") !== String(targetCharityId || "")) {
      continue;
    }

    const entryType = entry?._id?.entryType;
    const status = entry?._id?.status;
    const amountMinor = Number(entry?.amountMinor || 0);

    if (
      entryType === CHARITY_PAYOUT_ENTRY_TYPES.PAYOUT &&
      status === CHARITY_PAYOUT_STATUSES.COMPLETED
    ) {
      summary.payoutCompletedMinor += amountMinor;
    }

    if (
      entryType === CHARITY_PAYOUT_ENTRY_TYPES.PAYOUT &&
      status === CHARITY_PAYOUT_STATUSES.PENDING
    ) {
      summary.payoutPendingMinor += amountMinor;
    }

    if (entryType === CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_CREDIT) {
      summary.adjustmentCreditMinor += amountMinor;
    }

    if (entryType === CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_DEBIT) {
      summary.adjustmentDebitMinor += amountMinor;
    }
  }

  return summary;
};

export const charitiesService = {
  async listAll({ includeInactive = false } = {}) {
    const filter = includeInactive ? {} : { status: CHARITIES_STATUSES.ACTIVE };
    const records = await charitiesRepository.findMany(filter);
    return records.map(toCharityDto);
  },

  async getById(id) {
    const record = await charitiesRepository.findById(id);

    if (!record) {
      throw AppError.notFound("Charity record not found.");
    }

    return toCharityDto(record);
  },

  async create(payload, requestContext = {}) {
    const normalizedCode = normalizeCharityCode(payload.code || payload.name);

    if (!normalizedCode) {
      throw new DomainError("Unable to derive a valid charity code.");
    }

    const existing = await charitiesRepository.findByCode(normalizedCode);

    if (existing) {
      throw new ConflictError(
        `Charity code '${normalizedCode}' already exists.`,
      );
    }

    const created = await charitiesRepository.create({
      ...payload,
      code: normalizedCode,
      currency: payload.currency || CHARITY_CURRENCIES.INR,
      supportedCurrencies: payload.supportedCurrencies || [
        CHARITY_CURRENCIES.INR,
      ],
    });

    logAuditEvent({
      action: "charities.create",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "Charity",
      entityId: created.id,
      requestId: requestContext.requestId,
      metadata: {
        code: created.code,
      },
    });

    return toCharityDto(created);
  },

  async update(id, payload, requestContext = {}) {
    const updatePayload = {
      ...payload,
    };

    if (payload.code) {
      updatePayload.code = normalizeCharityCode(payload.code);
    }

    const updated = await charitiesRepository.updateById(id, updatePayload);

    if (!updated) {
      throw AppError.notFound("Charity record not found.");
    }

    logAuditEvent({
      action: "charities.update",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "Charity",
      entityId: updated.id,
      requestId: requestContext.requestId,
      metadata: {
        updatedFields: Object.keys(payload),
      },
    });

    return toCharityDto(updated);
  },

  async getContributionRule(currency = CHARITY_CURRENCIES.INR) {
    const rule = await ensureRuleExists(currency);
    return toContributionRuleDto(rule);
  },

  async adminUpdateContributionRule(payload, requestContext = {}) {
    const rule = await ensureRuleExists(CHARITY_CURRENCIES.INR);

    const updated = await charitiesRepository.upsertContributionRule(
      rule.ruleKey,
      {
        ...payload,
        updatedBy: requestContext.actorId || null,
        effectiveFrom: nowDate(),
      },
    );

    logAuditEvent({
      action: "charities.rule.update",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "ContributionRule",
      entityId: updated.id,
      requestId: requestContext.requestId,
      metadata: {
        updatedFields: Object.keys(payload),
      },
    });

    return toContributionRuleDto(updated);
  },

  async getMyActiveSelection(userId) {
    const selection =
      await charitiesRepository.getActiveSelectionByUserId(userId);
    return toCharitySelectionDto(selection);
  },

  async listMySelectionHistory(userId) {
    const records =
      await charitiesRepository.listSelectionHistoryByUserId(userId);
    return records.map(toCharitySelectionDto);
  },

  async setMySelection(userId, payload, requestContext = {}) {
    await assertCharityActive(payload.charityId);

    const activeSelection =
      await charitiesRepository.getActiveSelectionByUserId(userId);

    if (
      activeSelection &&
      String(activeSelection.charityId) === String(payload.charityId)
    ) {
      return toCharitySelectionDto(activeSelection);
    }

    const switchedAt = nowDate();

    if (activeSelection) {
      await charitiesRepository.supersedeActiveSelection(userId, switchedAt);
    }

    const created = await charitiesRepository.createSelection({
      userId,
      charityId: payload.charityId,
      currency: CHARITY_CURRENCIES.INR,
      status: CHARITY_SELECTION_STATUSES.ACTIVE,
      effectiveFrom: switchedAt,
      effectiveTo: null,
      changedBy: requestContext.actorId || userId,
      reason: payload.reason || "",
      metadata: payload.metadata || {},
    });

    logAuditEvent({
      action: "charities.selection.set",
      actorId: requestContext.actorId || userId,
      actorRole: requestContext.role,
      entity: "CharitySelection",
      entityId: created.id,
      requestId: requestContext.requestId,
      metadata: {
        charityId: String(payload.charityId),
      },
    });

    return toCharitySelectionDto(created);
  },

  async resolveSelectedCharityForUser(userId, explicitCharityId = null) {
    if (explicitCharityId) {
      const explicitCharity = await assertCharityActive(explicitCharityId);
      return explicitCharity;
    }

    const activeSelection =
      await charitiesRepository.getActiveSelectionByUserId(userId);

    if (!activeSelection) {
      return null;
    }

    const selectedCharity = await charitiesRepository.findById(
      activeSelection.charityId,
    );

    if (
      !selectedCharity ||
      selectedCharity.status !== CHARITIES_STATUSES.ACTIVE
    ) {
      return null;
    }

    return selectedCharity;
  },

  async createDonationIntent(userId, payload, requestContext = {}) {
    const charity = await assertCharityActive(payload.charityId);
    const amount = toMinorAmountFromInr(payload.amountInr);

    const contributionRule = await ensureRuleExists(CHARITY_CURRENCIES.INR);

    const payment = await paymentsService.createPaymentIntentForUser(
      userId,
      {
        amount: amount.minor,
        currency: "inr",
        description: `Donation to ${charity.name}`,
        sourceDomain: "charity_donation",
        sourceEntityId: String(charity.id),
        sourceAction: "independent_donation",
        metadata: {
          charityId: String(charity.id),
          donationSource: "independent",
          allocationSnapshot: {
            gatewayFeePercentage: contributionRule.gatewayFeePercentage,
            prizePoolPercentage: contributionRule.prizePoolPercentage,
            mandatoryCharityPercentage:
              contributionRule.mandatoryCharityPercentage,
          },
        },
      },
      requestContext,
    );

    const donation = await charitiesRepository.createDonation({
      userId,
      charityId: charity.id,
      paymentId: payment.id,
      paymentIntentId: payment.stripePaymentIntentId,
      source: "independent",
      currency: CHARITY_CURRENCIES.INR,
      amountMinor: amount.minor,
      amountMajor: amount.major,
      status: "processing",
      finalizedAt: null,
      userMessage: payload.message || "",
      metadata: payload.metadata || {},
    });

    logAuditEvent({
      action: "charities.donation.intent.create",
      actorId: requestContext.actorId || userId,
      actorRole: requestContext.role,
      entity: "CharityDonation",
      entityId: donation.id,
      requestId: requestContext.requestId,
      metadata: {
        charityId: String(charity.id),
        paymentIntentId: payment.stripePaymentIntentId,
        amountMinor: amount.minor,
      },
    });

    return {
      donation: toDonationDto(donation),
      payment,
    };
  },

  async listMyDonations(userId) {
    const donations = await charitiesRepository.listDonationsByUserId(userId);
    return donations.map(toDonationDto);
  },

  async listPayoutEntries(filter = {}) {
    const entries = await charitiesRepository.listPayoutLedgerEntries(filter);
    return entries.map(toPayoutLedgerDto);
  },

  async createPayoutEntry(payload, requestContext = {}) {
    await assertCharityActive(payload.charityId);

    const amount = toMinorAmountFromInr(payload.amountInr);

    const created = await charitiesRepository.createPayoutLedgerEntry({
      charityId: payload.charityId,
      entryType: payload.entryType,
      status:
        payload.entryType === CHARITY_PAYOUT_ENTRY_TYPES.PAYOUT
          ? CHARITY_PAYOUT_STATUSES.PENDING
          : CHARITY_PAYOUT_STATUSES.COMPLETED,
      currency: CHARITY_CURRENCIES.INR,
      amountMinor: amount.minor,
      amountMajor: amount.major,
      externalReference: payload.externalReference || "",
      notes: payload.notes || "",
      createdBy: requestContext.actorId || null,
      processedBy:
        payload.entryType === CHARITY_PAYOUT_ENTRY_TYPES.PAYOUT
          ? null
          : requestContext.actorId || null,
      processedAt:
        payload.entryType === CHARITY_PAYOUT_ENTRY_TYPES.PAYOUT
          ? null
          : nowDate(),
      metadata: payload.metadata || {},
    });

    logAuditEvent({
      action: "charities.payout.create",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "CharityPayoutLedger",
      entityId: created.id,
      requestId: requestContext.requestId,
      metadata: {
        charityId: String(payload.charityId),
        entryType: payload.entryType,
        amountMinor: amount.minor,
      },
    });

    return toPayoutLedgerDto(created);
  },

  async updatePayoutEntry(payoutId, payload, requestContext = {}) {
    const existing =
      await charitiesRepository.findPayoutLedgerEntryById(payoutId);

    if (!existing) {
      throw AppError.notFound("Payout entry not found.");
    }

    const updatePayload = {
      status: payload.status,
      externalReference:
        payload.externalReference ?? existing.externalReference,
      notes: payload.notes ?? existing.notes,
      metadata: {
        ...(existing.metadata || {}),
        ...(payload.metadata || {}),
      },
    };

    if (payload.status === CHARITY_PAYOUT_STATUSES.COMPLETED) {
      updatePayload.processedBy = requestContext.actorId || null;
      updatePayload.processedAt = nowDate();
    }

    const updated = await charitiesRepository.updatePayoutLedgerEntryById(
      payoutId,
      updatePayload,
    );

    logAuditEvent({
      action: "charities.payout.update",
      actorId: requestContext.actorId,
      actorRole: requestContext.role,
      entity: "CharityPayoutLedger",
      entityId: payoutId,
      requestId: requestContext.requestId,
      metadata: {
        status: payload.status,
      },
    });

    return toPayoutLedgerDto(updated);
  },

  async createManualAdjustment(payload, requestContext = {}) {
    const allowedTypes = [
      CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_CREDIT,
      CHARITY_PAYOUT_ENTRY_TYPES.ADJUSTMENT_DEBIT,
    ];

    if (!allowedTypes.includes(payload.entryType)) {
      throw new DomainError(
        "Manual adjustments must be either adjustment_credit or adjustment_debit.",
      );
    }

    return this.createPayoutEntry(payload, requestContext);
  },

  async getReportsSummary(query = {}) {
    const from = query.from || null;
    const to = query.to || null;

    const [allocationGroups, payoutGroups] = await Promise.all([
      charitiesRepository.aggregateAllocationsByCharity({ from, to }),
      charitiesRepository.aggregatePayoutsByCharity({ from, to }),
    ]);

    const charityIds = extractCharityIdsFromAggregates({
      allocations: allocationGroups,
      payouts: payoutGroups,
    });

    let charities = [];

    if (charityIds.length > 0) {
      charities = await Promise.all(
        charityIds.map((charityId) => charitiesRepository.findById(charityId)),
      );
    }

    const charityMap = new Map(
      charities.filter(Boolean).map((item) => [
        String(item.id),
        {
          id: item.id,
          code: item.code,
          name: item.name,
          status: item.status,
        },
      ]),
    );

    const summaryItems = charityIds.map((charityId) => {
      const allocationSummary = aggregateArrayByEntryType(
        allocationGroups,
        charityId,
      );
      const payoutSummary = aggregatePayoutsByEntryType(
        payoutGroups,
        charityId,
      );

      const outstanding = computeOutstandingByCharity({
        totalAllocatedMinor: Math.max(
          allocationSummary.mandatoryCharityMinor +
            allocationSummary.optionalAddonMinor +
            allocationSummary.independentDonationMinor,
          0,
        ),
        totalAdjustedCreditMinor: payoutSummary.adjustmentCreditMinor,
        totalAdjustedDebitMinor: payoutSummary.adjustmentDebitMinor,
        totalPayoutCompletedMinor: payoutSummary.payoutCompletedMinor,
      });

      return {
        charity: charityMap.get(String(charityId)) || {
          id: charityId,
          code: "",
          name: "Unknown Charity",
          status: "unknown",
        },
        allocations: {
          mandatoryCharityMinor: allocationSummary.mandatoryCharityMinor,
          mandatoryCharityMajor: fromMinorUnits(
            allocationSummary.mandatoryCharityMinor,
            2,
          ),
          optionalAddonMinor: allocationSummary.optionalAddonMinor,
          optionalAddonMajor: fromMinorUnits(
            allocationSummary.optionalAddonMinor,
            2,
          ),
          independentDonationMinor: allocationSummary.independentDonationMinor,
          independentDonationMajor: fromMinorUnits(
            allocationSummary.independentDonationMinor,
            2,
          ),
          totalCharityAllocatedMinor:
            allocationSummary.mandatoryCharityMinor +
            allocationSummary.optionalAddonMinor +
            allocationSummary.independentDonationMinor,
          totalCharityAllocatedMajor: fromMinorUnits(
            allocationSummary.mandatoryCharityMinor +
              allocationSummary.optionalAddonMinor +
              allocationSummary.independentDonationMinor,
            2,
          ),
        },
        payouts: {
          payoutCompletedMinor: payoutSummary.payoutCompletedMinor,
          payoutCompletedMajor: fromMinorUnits(
            payoutSummary.payoutCompletedMinor,
            2,
          ),
          payoutPendingMinor: payoutSummary.payoutPendingMinor,
          payoutPendingMajor: fromMinorUnits(
            payoutSummary.payoutPendingMinor,
            2,
          ),
          adjustmentCreditMinor: payoutSummary.adjustmentCreditMinor,
          adjustmentCreditMajor: fromMinorUnits(
            payoutSummary.adjustmentCreditMinor,
            2,
          ),
          adjustmentDebitMinor: payoutSummary.adjustmentDebitMinor,
          adjustmentDebitMajor: fromMinorUnits(
            payoutSummary.adjustmentDebitMinor,
            2,
          ),
        },
        outstanding,
      };
    });

    if (query.charityId) {
      return summaryItems.filter(
        (item) => String(item.charity.id) === String(query.charityId),
      );
    }

    return summaryItems;
  },
};
